"use client"
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

function formatarDataBR(dataStr){
  if(!dataStr) return '---'
  const s = String(dataStr).split('T')[0]
  const [a,m,d] = s.split('-')
  if(a && m && d) return `${d}/${m}/${a}`
  return '---'
}
function formatarDataLongaBR(dataStr){
  if(!dataStr) return '___'
  const s = String(dataStr).split('T')[0]
  const [a,m,d] = s.split('-')
  if(!a||!m||!d) return '___'
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  return `${d} de ${meses[parseInt(m)-1]} de ${a}`
}
function formatarOficio(f){
  let of = (f.oficial_tipo || '').trim()
  if(of && of!== 'null' && of!== ''){
    const low = of.toLowerCase()
    if(low.includes('presb')) return 'Presbítero'
    if(low.includes('diac') || low.includes('diác')) return 'Diácono'
    if(low.includes('pastor')) return 'Pastor'
    return of.charAt(0).toUpperCase() + of.slice(1).toLowerCase()
  }
  const tipo = (f.tipo_membro || f.categoria_membro || f.categoria || '').toLowerCase()
  if(tipo.includes('nao') || tipo.includes('não')) return 'Não Comungante'
  if(tipo.includes('oficial')) return 'Oficial'
  return 'Comungante'
}
function isNaoComungante(m){
  const t = `${m.tipo_membro||''} ${m.categoria_membro||''} ${m.categoria||''} ${m.oficial_tipo||''} ${m.oficial||''}`.toLowerCase()
  return t.includes('nao') || t.includes('não')
}
function isDemitido(m){
  const s = `${m.status||''} ${m.status_membro||''} ${m.situacao||''}`.toLowerCase()
  return s.includes('demitido') || s.includes('exclu') || s.includes('falec')
}

export default function RelatoriosPage(){
  const [aba, setAba] = useState('ativos')
  const [membros, setMembros] = useState([])
  const [cartas, setCartas] = useState([])
  const [igreja, setIgreja] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [busca, setBusca] = useState('')
  const [buscaCarta, setBuscaCarta] = useState('')
  const [tipoAssembleia, setTipoAssembleia] = useState('Assembléia Geral Ordinária')
  const [dataAssembleia, setDataAssembleia] = useState(new Date().toISOString().slice(0,10))
  const [buscaBatismo, setBuscaBatismo] = useState('')
  const [resultBatismo, setResultBatismo] = useState([])
  const [membroBatismo, setMembroBatismo] = useState(null)
  const [cartaAberta, setCartaAberta] = useState(null)
  const [membrosCarta, setMembrosCarta] = useState([])
  const refCarta = useRef(null)

  async function carregar(){
    setLoading(true)
    // CABEÇALHO - ORIGINAL RESTAURADO COM FALLBACK
    let dadosIgreja = null
    const { data: viewIgreja } = await supabase.from('vw_igreja_completa').select('*').limit(1).maybeSingle()
    if(viewIgreja){
      dadosIgreja = {
        nome_igreja: viewIgreja.igreja_nome, nome: viewIgreja.igreja_nome,
        endereco: viewIgreja.igreja_endereco, cnpj: viewIgreja.igreja_cnpj,
        logo_url: viewIgreja.igreja_logo_url || viewIgreja.logo_url,
        cidade: viewIgreja.cidade, pastor_nome: viewIgreja.pastor_nome_completo,
        secretario_nome: viewIgreja.secretario_nome_completo, pastor_cargo: 'Pastor Efetivo',
        email: viewIgreja.igreja_email || viewIgreja.email,
        telefone: viewIgreja.igreja_telefone || viewIgreja.telefone,
        logo: viewIgreja.igreja_logo_url || viewIgreja.logo_url,
        data_organizacao: viewIgreja.data_organizacao
      }
    } else {
      const tabelas = ['dados_igreja','igreja','igrejas','config_igreja','configuracoes']
      for(let t of tabelas){
        const { data } = await supabase.from(t).select('*').limit(1).maybeSingle()
        if(data){ dadosIgreja = data; break }
      }
    }
    setIgreja(dadosIgreja)

    // MEMBROS - CARREGA AUTOMÁTICO DA FICHA VIA API (fura RLS)
    let lista = []
    try{
      let res = await fetch('/api/relatorios/membros', { cache: 'no-store' })
      if(!res.ok){ // se não criou ainda, tenta /api/membros que você já tem
        res = await fetch('/api/membros', { cache: 'no-store' })
      }
      const json = await res.json()
      if(Array.isArray(json)) lista = json
    }catch(e){ console.log('api relatorio erro', e) }

    if(lista.length===0){
      const { data: m } = await supabase.from('vw_relatorio_membros').select('*').limit(5000).order('nome_completo')
      if(m && m.length>0) lista = m
    }
    setMembros(lista)
    setCartas([])
    setLoading(false)
  }

  async function buscarBatismo(v){
    setBuscaBatismo(v)
    if(v.length<2){ setResultBatismo([]); return }
    const { data } = await supabase.from('vw_relatorio_membros').select('*').ilike('nome_completo', `%${v}%`).limit(10)
    setResultBatismo(data||[])
  }
  async function buscarCartaPorMembro(){
    if(!buscaCarta.trim()){ setCartas([]); return }
    const { data } = await supabase.from('cartas_membros').select('carta_id, cartas_transferencia(*)').ilike('nome_completo', `%${buscaCarta}%`).limit(20)
    const unicas = {}
    data?.forEach(d=>{ if(d.cartas_transferencia) unicas[d.carta_id]=d.cartas_transferencia })
    setCartas(Object.values(unicas))
    setCartaAberta(null)
  }
  function limparPesquisaCarta(){ setBuscaCarta(''); setCartas([]); setCartaAberta(null); setMembrosCarta([]) }

  async function abrirCarta(id){
    setAba('cartas')
    const { data: cView } = await supabase.from('vw_carta_transferencia_dinamica').select('*').eq('carta_id', id).single()
    let c = cView
    if(!cView){
      const { data: cFallback } = await supabase.from('cartas_transferencia').select('*').eq('id', id).single()
      c = cFallback
    }
    if(!c) return
    try{
      const igrejaIdParaBuscar = c.igreja_id || c.igreja_origem_id
      if(igrejaIdParaBuscar){
        const { data: igrejaFull } = await supabase.from('vw_igreja_completa').select('*').eq('igreja_id', igrejaIdParaBuscar).single()
        if(igrejaFull){
          c.pastor_nome_completo = c.pastor_nome_completo || igrejaFull.pastor_nome_completo
          c.secretario_nome_completo = c.secretario_nome_completo || igrejaFull.secretario_nome_completo
          c.secretario_nome = c.secretario_nome || igrejaFull.secretario_nome_completo
          c.igreja_nome = c.igreja_nome || igrejaFull.igreja_nome
          c.igreja_endereco = c.igreja_endereco || igrejaFull.igreja_endereco
          c.igreja_cnpj = c.igreja_cnpj || igrejaFull.igreja_cnpj
          c.igreja_email = c.igreja_email || igrejaFull.igreja_email || igrejaFull.email
          c.igreja_telefone = c.igreja_telefone || igrejaFull.telefone
          c.igreja_logo_url = c.igreja_logo_url || igrejaFull.logo_url
          c.cidade = c.cidade || igrejaFull.cidade
        }
      }
    }catch(e){ console.log('igreja full error', e) }
    const { data: vinculos } = await supabase.from('cartas_membros').select('*').eq('carta_id', id)
    const ids = (vinculos||[]).map(v=> v.membro_id || v.membros_oficial_id).filter(Boolean)
    let membrosComDados = []
    if(ids.length>0){
      const { data: fichas } = await supabase.from('membros_oficial').select('*').in('id', ids)
      const fichaMap = new Map((fichas||[]).map(f=>[String(f.id), f]))
      membrosComDados = (vinculos||[]).map(v => {
        const f = fichaMap.get(String(v.membro_id || v.membros_oficial_id)) || {}
        return {
          id: v.membro_id || f.id,
          nome_completo: v.nome_completo || f.nome_completo,
          oficial_tipo: v.oficial_tipo || f.oficial_tipo,
          tipo_membro: v.tipo_membro || f.tipo_membro,
          categoria_membro: v.categoria_membro || f.categoria_membro,
          oficial: formatarOficio({ oficial_tipo: v.oficial_tipo || f.oficial_tipo, tipo_membro: v.tipo_membro || f.tipo_membro, categoria_membro: v.categoria_membro || f.categoria_membro }),
          data_admissao: v.data_admissao || f.data_admissao,
          forma_admissao: v.forma_admissao || f.forma_admissao || f.forma_de_admissao,
          data_batismo: v.data_batismo || f.data_batismo,
          local_batismo: v.local_batismo || f.local_batismo,
          pastor_batismo: v.pastor_batismo || f.pastor_batismo,
          data_profissao_fe: v.data_profissao_fe || f.data_profissao_fe,
          local_profissao_fe: v.local_profissao_fe || f.local_profissao_fe,
          pastor_profissao_fe: v.pastor_profissao_fe || f.pastor_profissao_fe,
          data_ordenacao: v.data_ordenacao || f.data_ordenacao,
        }
      })
      membrosComDados.sort((a,b)=>{
        const prio = (m)=>{ if(m.oficial_tipo) return 1; const t=(m.tipo_membro||m.categoria_membro||'').toLowerCase(); if(t.includes('nao')||t.includes('não')) return 3; return 2 }
        return prio(a)-prio(b)
      })
    }
    setCartaAberta(c)
    setMembrosCarta(membrosComDados||[])
    setTimeout(()=>{ document.getElementById('detalhe-carta')?.scrollIntoView({behavior:'smooth', block:'start'}) },100)
  }

  function filtrarAtivos(){
    let f = membros.filter(m=>!isDemitido(m))
    if(f.length===0) f = membros
    if(filtroTipo==='comungante') f=f.filter(m=>!isNaoComungante(m))
    if(filtroTipo==='nao') f=f.filter(m=> isNaoComungante(m))
    if(busca) f=f.filter(m=> (m.nome_completo||'').toLowerCase().includes(busca.toLowerCase()))
    return f
  }
  function filtrarComungantesParaAssembleia(){
    let f = membros.filter(m=>!isDemitido(m) &&!isNaoComungante(m))
    if(f.length===0) f = membros.filter(m=>!isNaoComungante(m))
    return f
  }
  function filtrarDemitidos(){ return membros.filter(m=> isDemitido(m)) }

  function imprimirCartaLimpa(){
    document.body.classList.add('imprimindo-carta')
    setTimeout(()=>{ window.print(); setTimeout(()=> document.body.classList.remove('imprimindo-carta'), 500) },100)
  }
  function imprimirRelatorio(){
    document.body.classList.add('imprimindo-relatorio')
    setTimeout(()=>{ window.print(); setTimeout(()=> document.body.classList.remove('imprimindo-relatorio'), 500) },100)
  }

  const stats = {
    total: membros.length,
    masc: membros.filter(m=> (m.sexo||'').toLowerCase().startsWith('m')).length,
    fem: membros.filter(m=> (m.sexo||'').toLowerCase().startsWith('f')).length,
    batizados: membros.filter(m=> m.data_batismo).length,
    profissao: membros.filter(m=> m.data_profissao_fe).length,
    admitidos: membros.filter(m=> (m.status_membro||m.status||'').toLowerCase()==='ativo').length,
    demitidos: membros.filter(m=> (m.status_membro||m.status||'').toLowerCase().includes('demitido')).length,
    transferidos: membros.filter(m=> (m.status_membro||'').toLowerCase().includes('demitido')).length
  }

  useEffect(()=>{ carregar() },[])
  useEffect(()=>{ if(aba!=='cartas'){ setCartaAberta(null); setCartas([]); setBuscaCarta(''); setMembrosCarta([]) } },[aba])
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search)
    const cartaId = params.get('carta')
    if(cartaId){ setAba('cartas'); abrirCarta(cartaId); window.history.replaceState({}, '', window.location.pathname) }
  },[])

  if(loading) return <div className="p-10">Carregando relatórios...</div>

  const nomeIgreja = igreja?.nome_igreja || igreja?.nome || igreja?.razao_social || "Igreja"
  const enderecoIgreja = igreja?.endereco || igreja?.endereco_completo || `${igreja?.cidade||''} - ${igreja?.estado||''}`
  const cnpjIgreja = igreja?.cnpj || igreja?.documento || ""
  const logoIgreja = igreja?.logo_url || igreja?.url_logo || igreja?.logo || null

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-[#0A3D26] no-print">Relatórios</h1>
      <div className="flex flex-wrap gap-2 mt-4 mb-6 no-print">
        {[
          ['ativos','Membros Ativos'],['assembleia','Assembléia Geral'],['demitidos','Demitidos'],
          ['movimentacao','Movimentação'],['batismo','Cert. Batismo'],['cartas','Cartas Transferência']
        ].map(([id, label])=>(
          <button key={id} onClick={()=>setAba(id)} className={`px-4 py-2 rounded-lg text-sm font-bold border ${aba===id?'bg-[#0A3D26] text-white':'bg-white'}`}>{label}</button>
        ))}
      </div>

      <div className="bg-white border rounded-xl p-8 shadow-sm">
        <div className="flex gap-4 border-b pb-4 mb-6 items-center no-print">
          {logoIgreja? <img src={logoIgreja} className="w-16 h-16 object-contain rounded" /> : <div className="w-14 h-14 bg-[#0A3D26] rounded flex items-center justify-center text-white font-bold">IPB</div>}
          <div>
            <h2 className="font-bold text-lg">{nomeIgreja}</h2>
            <p className="text-xs text-gray-600">{enderecoIgreja} {cnpjIgreja? `| ${cnpjIgreja}`:''} {igreja?.data_organizacao? `| Organizada em ${formatarDataBR(igreja.data_organizacao)}`:''}</p>
          </div>
          <div className="ml-auto flex gap-2">
            {aba==='cartas' && cartaAberta && <button onClick={imprimirCartaLimpa} className="bg-[#0A3D26] text-white px-6 py-2 rounded text-sm font-bold no-print">Imprimir Carta</button>}
            {aba!=='cartas' && <button onClick={imprimirRelatorio} className="bg-black text-white px-5 py-2 rounded text-sm font-bold no-print">Imprimir / PDF</button>}
          </div>
        </div>

        <div id="area-impressao">
          <div className="hidden print:block text-center mb-6">
            <div className="flex items-start justify-center gap-3">
              {logoIgreja && <img src={logoIgreja} className="w-14 h-16 object-contain" />}
              <div className="text-center">
                <h1 className="font-bold text-[18px] leading-5 text-[#0A3D26] uppercase">{nomeIgreja}</h1>
                <p className="text-[10px]">Organizada em 20 de Janeiro de 1959</p>
                <p className="text-[10px] font-semibold">Sínodo Central de Pernambuco / Presbitério Centro de Pernambuco</p>
                <p className="text-[10px]">{enderecoIgreja}</p>
                <p className="text-[10px]">CNPJ: {cnpjIgreja}</p>
              </div>
            </div>
          </div>

          {aba==='ativos' && (
            <div>
              <h3 className="font-bold text-center text-lg mb-4">Relatório de Membros Ativos - {nomeIgreja} ({filtrarAtivos().length})</h3>
              <div className="flex gap-2 mb-4 no-print"><select value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)} className="border p-2 rounded text-sm"><option value="todos">Todos</option><option value="comungante">Comungante</option><option value="nao">Não Comungante</option></select><input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar nome..." className="border p-2 rounded text-sm flex-1" /></div>
              <table className="w-full text-xs border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2 text-left">Nome</th>
                    <th className="border p-2">CPF</th>
                    <th className="border p-2 bg-yellow-50">Categoria</th>
                    <th className="border p-2">Ofício</th>
                    <th className="border p-2">Admissão</th>
                    <th className="border p-2">Batismo</th>
                    <th className="border p-2">Profissão</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrarAtivos().map(m=>(
                    <tr key={m.id}>
                      <td className="border p-2">{m.nome_completo}</td>
                      <td className="border p-2">{m.cpf||'---'}</td>
                      <td className="border p-2 bg-yellow-50/30">{m.categoria_membro || m.categoria || m.tipo_membro || '---'}</td>
                      <td className="border p-2">{m.oficial_tipo || m.oficial || m.tipo_membro ||'---'}</td>
                      <td className="border p-2">{m.data_admissao?formatarDataBR(m.data_admissao):'---'}</td>
                      <td className="border p-2">{m.data_batismo?formatarDataBR(m.data_batismo):'---'}</td>
                      <td className="border p-2">{m.data_profissao_fe?formatarDataBR(m.data_profissao_fe):'---'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {aba==='assembleia' && (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-6 bg-yellow-50 p-4 rounded border no-print"><label className="text-sm">Tipo<select value={tipoAssembleia} onChange={e=>setTipoAssembleia(e.target.value)} className="w-full border p-2 rounded mt-1"><option>Assembléia Geral Ordinária</option><option>Assembléia Geral Extraordinária</option></select></label><label className="text-sm">Data<input type="date" value={dataAssembleia} onChange={e=>setDataAssembleia(e.target.value)} className="w-full border p-2 rounded mt-1" /></label></div>
              <h3 className="font-bold text-center">Relação de Membros para {tipoAssembleia}</h3>
              <p className="text-center text-sm mb-4">{nomeIgreja} - Data: {formatarDataBR(dataAssembleia)} - Comungantes: {filtrarComungantesParaAssembleia().length}</p>
              <table className="w-full text-sm border"><thead className="bg-gray-100"><tr><th className="border p-2 text-left">Nome</th><th className="border p-2">CPF</th><th className="border p-2 w-56">Assinatura</th></tr></thead><tbody>{filtrarComungantesParaAssembleia().map(m=><tr key={m.id} className="h-10"><td className="border p-3">{m.nome_completo}</td><td className="border p-2 text-center">{m.cpf||'---'}</td><td className="border p-2"></td></tr>)}</tbody></table>
            </div>
          )}
          {aba==='demitidos' && (
            <div><h3 className="font-bold text-center text-lg mb-4">Relação de Membros Demitidos - {nomeIgreja}</h3><table className="w-full text-xs border"><thead className="bg-gray-100"><tr><th className="border p-2 text-left">Nome</th><th className="border p-2">CPF</th><th className="border p-2">Ofício</th><th className="border p-2">Data Demissão</th><th className="border p-2">Motivo</th></tr></thead><tbody>{filtrarDemitidos().map(m=><tr key={m.id}><td className="border p-2">{m.nome_completo}</td><td className="border p-2">{m.cpf||'---'}</td><td className="border p-2">{m.oficial_tipo || m.oficial||m.tipo_membro||'---'}</td><td className="border p-2">{m.data_demissao?formatarDataBR(m.data_demissao):'---'}</td><td className="border p-2">{m.motivo_demissao||m.forma_demissao||'---'}</td></tr>)}</tbody></table></div>
          )}
          {aba==='movimentacao' && (
            <div><h3 className="font-bold text-center text-lg mb-6">Relatório de Movimentação - {nomeIgreja}</h3><div className="grid grid-cols-3 gap-4 text-sm"><div className="border p-4 rounded"><b>Por Sexo</b><div>Masc: {stats.masc}</div><div>Fem: {stats.fem}</div></div><div className="border p-4 rounded"><b>Movimentações</b><div>Batizados: {stats.batizados}</div><div>Profissão Fé: {stats.profissao}</div><div>Admitidos: {stats.admitidos}</div><div>Demitidos: {stats.demitidos}</div></div><div className="border p-4 rounded"><b>Total</b><div className="text-2xl font-bold">{stats.total}</div></div></div></div>
          )}
          {aba==='batismo' && (
            <div><h3 className="font-bold text-center text-lg mb-4">Certificado de Batismo - {nomeIgreja}</h3><div className="mb-4 no-print"><input value={buscaBatismo} onChange={e=>buscarBatismo(e.target.value)} placeholder="Pesquisar membro..." className="border p-3 rounded-lg w-full" />{resultBatismo.length>0 && <div className="border rounded mt-2 max-h-40 overflow-auto">{resultBatismo.map(r=><div key={r.id} onClick={()=>{setMembroBatismo(r); setResultBatismo([]); setBuscaBatismo(r.nome_completo)}} className="p-2 hover:bg-gray-100 cursor-pointer text-sm">{r.nome_completo} - {r.data_batismo?formatarDataBR(r.data_batismo):'s/ batismo'}</div>)}</div>}</div>{membroBatismo && (<div className="text-center py-10 px-8 border-2 border-double"><h2 className="font-bold">{nomeIgreja}</h2><h2 className="text-xl font-bold mt-4">CERTIFICADO DE BATISMO</h2><p className="mt-8 text-sm leading-7">Certificamos que <b>{membroBatismo.nome_completo}</b>, filho(a) de {membroBatismo.filiacao_pai||'---'} e {membroBatismo.filiacao_mae||'---'}, foi batizado(a) em <b>{membroBatismo.data_batismo?formatarDataBR(membroBatismo.data_batismo):'__/__/____'}</b> {membroBatismo.local_batismo? ` em ${membroBatismo.local_batismo}`:''}.</p><p className="mt-4 text-sm">Pastor Celebrante: {membroBatismo.pastor_batismo || igreja?.pastor_nome || '____________________'}</p><div className="mt-20 grid grid-cols-2 gap-10 text-sm"><div className="border-t pt-2">{igreja?.secretario_nome||'Secretário'}</div><div className="border-t pt-2">{igreja?.pastor_nome||'Pastor'}</div></div></div>)}</div>
          )}
          {aba==='cartas' && (
            <div>
              <div className="flex gap-2 mb-4 no-print">
                <input value={buscaCarta} onChange={e=>setBuscaCarta(e.target.value)} onKeyDown={e=> e.key==='Enter' && buscarCartaPorMembro()} placeholder="Pesquisar por nome do membro na carta..." className="border p-2 rounded flex-1 text-sm" />
                <button onClick={buscarCartaPorMembro} className="bg-[#0A3D26] text-white px-4 rounded text-sm no-print">Buscar</button>
                {(buscaCarta || cartas.length>0 || cartaAberta) && <button onClick={limparPesquisaCarta} className="bg-gray-100 border px-3 rounded text-sm no-print">Limpar</button>}
              </div>
              {!cartaAberta && cartas.length>0 && (
                <div className="space-y-2 mb-6 max-h-64 overflow-auto no-print">
                  {cartas.map(c=><div key={c.carta_id || c.id} onClick={()=>abrirCarta(c.carta_id || c.id)} className="border p-3 rounded hover:bg-gray-50 cursor-pointer flex justify-between text-sm"><div><b>{c.igreja_destino}</b> - {c.data_emissao? formatarDataBR(c.data_emissao) : ''} - Ata {c.ata_numero||''}</div><span className="text-xs bg-black text-white px-2 py-1 rounded">Abrir</span></div>)}
                </div>
              )}
              {cartaAberta && (
                <div ref={refCarta} id="detalhe-carta" className="bg-white p-8 md:p-10 max-w-[780px] mx-auto text-black leading-normal">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex items-start justify-center gap-3">
                      {(cartaAberta.igreja_logo_url || cartaAberta.logo_url || logoIgreja) && (
                        <img src={cartaAberta.igreja_logo_url || cartaAberta.logo_url || logoIgreja} className="w-16 h-20 object-contain mt-1" alt="logo" />
                      )}
                      <div className="text-center">
                        <h1 className="font-bold text-[20px] leading-[20px] text-[#0A3D26] uppercase">{cartaAberta.igreja_nome || nomeIgreja}</h1>
                        <p className="text-[11px] mt-1">Organizada em 20 de Janeiro de 1959</p>
                        <p className="text-[10px] font-semibold">Sínodo Central de Pernambuco / Presbitério Centro de Pernambuco</p>
                        <p className="text-[10px]">{cartaAberta.igreja_endereco || enderecoIgreja}</p>
                        <p className="text-[10px]">CNPJ: {cartaAberta.igreja_cnpj || cnpjIgreja}</p>
                        <p className="text-[10px]">E-mail: {cartaAberta.igreja_email || cartaAberta.email || igreja?.email || ''} {cartaAberta.igreja_telefone? ` | Tel: ${cartaAberta.igreja_telefone}` : igreja?.telefone? ` | Tel: ${igreja.telefone}` : ''}</p>
                        <p className="text-[11px] font-bold mt-1">Pastor Efetivo: {cartaAberta.pastor_nome_completo || igreja?.pastor_nome || ''}</p>
                      </div>
                      <div className="w-16 h-20 hidden md:block"></div>
                    </div>
                  </div>
                  <div className="text-right text-[13px] mt-10">{cartaAberta.cidade || igreja?.cidade || 'Jaboatão dos Guararapes'}, {formatarDataLongaBR(cartaAberta.data_emissao)}.</div>
                  <div className="mt-8 text-[13px]"><p>À</p><p className="font-bold uppercase">{cartaAberta.igreja_destino}</p></div>
                  <div className="text-center my-6 text-[13px] italic">Oh! Como é bom e agradável viverem unidos os irmãos!<br/>(Salmos 133.1)</div>
                  <div className="text-[13px] leading-[22px] text-justify">
                    <p><b>Assunto:</b> Resposta à solicitação de transferência de membros</p><br/>
                    <p>Amados irmãos, Graça e Paz em Cristo Jesus!</p><br/>
                    <p className="indent-8">O Conselho da {cartaAberta.igreja_nome || nomeIgreja}, reunido em {formatarDataBR(cartaAberta.data_reuniao_conselho || cartaAberta.data_emissao)} (Ata nº {cartaAberta.ata_numero || '___'}), resolveu expedir Carta de Transferência, em atendimento ao pedido recebido do egrégio Conselho dos irmãos: {' '}{membrosCarta.map((m,i)=>{ const isNao=(m.oficial||'').toLowerCase().includes('não')||(m.oficial||'').toLowerCase().includes('nao'); const art=isNao?' (Artigo 24, alínea "a" da CI/IPB)':' (Artigo 23, alínea "d" da CI/IPB)'; const sep=i < membrosCarta.length-2? ', ' : i===membrosCarta.length-2? ' e ' : ''; return <span key={m.id}><b>{m.nome_completo}</b>{art}{sep}</span> })} consequentemente baixados do rol de membros desta Igreja.</p>
                    <p className="mt-6 font-bold">Segue dados dos irmãos:</p>
                    <div className="mt-3 space-y-6">
                      {membrosCarta.map(m=>{
                        const isNaoComungante = (m.oficial||'').toLowerCase().includes('nao') || (m.oficial||'').toLowerCase().includes('não')
                        const isOficial = m.oficial_tipo && m.oficial_tipo.trim()!== ''
                        return (
                        <div key={m.id} className="text-[13px] leading-5">
                          <p className="font-bold">{m.nome_completo} - {m.oficial}</p>
                          <div className="mt-1">
                            <p>Data de Admissão: {m.data_admissao? formatarDataBR(m.data_admissao) : '___'}</p>
                            <p>Forma de Admissão: {m.forma_admissao || '___'}</p>
                            <p className="mt-2">Data do Batismo: {m.data_batismo? formatarDataBR(m.data_batismo) : '___'}</p>
                            <p>Local Batismo: {m.local_batismo || '___'}</p>
                            <p>Pastor Batismo: {m.pastor_batismo || '___'}</p>
                            {!isNaoComungante && (<><p className="mt-2">Data Prof. Fé: {m.data_profissao_fe? formatarDataBR(m.data_profissao_fe) : '___'}</p><p>Local Prof. Fé: {m.local_profissao_fe || '___'}</p><p>Pastor Prof. Fé: {m.pastor_profissao_fe || '___'}</p></>)}
                            {isOficial && (<p className="mt-2">Data de Ordenação: {m.data_ordenacao? formatarDataBR(m.data_ordenacao) : '___'}</p>)}
                          </div>
                        </div>
                        )
                      })}
                    </div>
                    <p className="mt-8 indent-8">Sendo somente o que se nos apresenta para o momento, firmamo-nos no amor de Cristo, o Senhor da Igreja.</p>
                    <p className="mt-4">Pelos laços da cruz,</p>
                  </div>
                  <div className="mt-20 grid grid-cols-2 gap-8 text-[11px] leading-4">
                    <div className="text-left"><p className="font-bold border-t border-black pt-1 inline-block">Rev. {cartaAberta.pastor_nome_completo || igreja?.pastor_nome}</p><p>Pres. do Conselho da {cartaAberta.igreja_nome || nomeIgreja}</p></div>
                    <div className="text-left"><p className="font-bold border-t border-black pt-1 inline-block">Presb. {cartaAberta.secretario_nome_completo || igreja?.secretario_nome || cartaAberta.secretario_nome || ''}</p><p>Sec. do Conselho da {cartaAberta.igreja_nome || nomeIgreja}</p></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white!important; }
      .no-print { display: none!important; }
      .print\\:block { display: block!important; }
          body.imprimindo-carta * { visibility: hidden!important; }
          body.imprimindo-carta #detalhe-carta, body.imprimindo-carta #detalhe-carta * { visibility: visible!important; }
          body.imprimindo-carta #detalhe-carta { position: absolute!important; left:0!important; top:0!important; width:100%!important; max-width:100%!important; margin:0!important; padding:0!important; border:none!important; box-shadow:none!important; background:white!important; }
          body.imprimindo-relatorio * { visibility: hidden!important; }
          body.imprimindo-relatorio #area-impressao, body.imprimindo-relatorio #area-impressao * { visibility: visible!important; }
          body.imprimindo-relatorio #area-impressao { position: absolute!important; left:0!important; top:0!important; width:100%!important; margin:0!important; padding:20px 30px!important; background:white!important; }
          body.imprimindo-relatorio table { width:100%!important; border-collapse: collapse!important; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>
    </div>
  )
}
