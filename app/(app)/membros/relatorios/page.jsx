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
function formatarCPF(cpf){
  if(!cpf) return '---'
  const d = cpf.replace(/\D/g,'')
  if(d.length!==11) return cpf || '---'
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}
function formatarCategoriaExibicao(m){
  const raw = (m.categoria_membro || m.categoria || m.tipo_membro || '').toLowerCase()
  if(!raw) return '---'
  if(raw.includes('comungante_oficial') || raw==='comungante oficial' || (raw.includes('comungante') && raw.includes('oficial'))) return 'Comungante Oficial'
  if(raw.includes('nao_comungante') || raw.includes('não comungante') || raw.includes('nao comungante')) return 'Não Comungante'
  if(raw.includes('nao') || raw.includes('não')) return 'Não Comungante'
  if(raw.includes('comungante')) return 'Comungante'
  return raw.charAt(0).toUpperCase()+raw.slice(1)
}
function formatarOficioTabela(m){
  const of = (m.oficial_tipo || m.oficial || '').toString().trim()
  if(!of || of.toLowerCase()==='null' || of==='') return '---'
  const low = of.toLowerCase()
  if(low.includes('presb')) return 'Presbítero'
  if(low.includes('diac') || low.includes('diác')) return 'Diácono'
  if(low.includes('pastor')) return 'Pastor'
  if(low.includes('comungante')) return '---'
  return of
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

function normaliza(s){
  return String(s||'')
 .toLowerCase()
 .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .replace(/[_-]/g,' ')
 .replace(/\s+/g,' ')
 .trim()
}

function isNaoComungante(m){
  const cat = normaliza(m.categoria_membro || m.categoria || m.tipo_membro || '')
  if(!cat) return false
  if(cat.includes('nao comungante')) return true
  return false
}
function isDemitido(m){
  const s = normaliza(`${m.status||''} ${m.status_membro||''} ${m.situacao||''}`)
  return s.includes('demitido') || s.includes('exclu') || s.includes('falec')
}
function sexoMasc(m){ const s=normaliza(m.sexo); return s.startsWith('masc') || s==='m' || s==='masculino' }
function sexoFem(m){ const s=normaliza(m.sexo); return s.startsWith('fem') || s==='f' || s==='feminino' }

function parseData(d){ if(!d) return null; const s=String(d).split('T')[0]; const dt=new Date(s+'T12:00:00'); return isNaN(dt)?null:dt }
function inPeriodo(dataStr, ini, fim){ const dt=parseData(dataStr); if(!dt) return false; return dt>=ini && dt<=fim }
function ativoEm(dataLimite, m){
  const adm=parseData(m.data_admissao); const dem=parseData(m.data_demissao)
  if(!adm) return false
  if(adm>dataLimite) return false
  if(dem && dem<=dataLimite) return false
  return true
}
function classificarAdmissao(m){
  const f=normaliza(m.forma_admissao)
  if(!f) return 'Transferência'
  if(f.includes('profissao') && f.includes('batismo')) return 'Profissão de Fé e Batismo'
  if(f.includes('profissao')) return 'Profissão de Fé'
  if(f.includes('batismo')) return 'Batismo'
  if(f.includes('transfer')) return 'Transferência'
  if(f.includes('jurisdic')) return 'Jurisdição'
  if(f.includes('restaur')) return 'Restauração'
  if(f.includes('designac')) return 'Designação do Presbitério'
  return m.forma_admissao
}
function classificarDemissao(m){
  const f=normaliza(m.forma_demissao || m.motivo_demissao)
  if(!f) return 'Transferência'
  if(f.includes('falec')) return 'Falecimento'
  if(f.includes('transfer')) return 'Transferência'
  if(f.includes('exclu')) return 'Exclusão'
  if(f.includes('ordenac')) return 'Ordenação'
  if(f.includes('profissao')) return 'Profissão de Fé'
  if(f.includes('jurisdic')) return 'Jurisdição'
  return m.forma_demissao
}

export default function RelatoriosPage(){
  const [aba, setAba] = useState('movimentacao')
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
  const [mesIni, setMesIni] = useState('2026-01')
  const [mesFim, setMesFim] = useState('2026-12')
  const [modalMov, setModalMov] = useState(null)
  const refCarta = useRef(null)

  async function carregar(){
    setLoading(true)
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
    let lista = []
    try{
      let res = await fetch('/api/relatorios/membros', { cache: 'no-store' })
      if(!res.ok){ res = await fetch('/api/membros', { cache: 'no-store' }) }
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
  function abrirFichaDemitido(m){
    try{ localStorage.setItem('fromDemitidos','1') }catch{}
    window.location.href = `/membros/${m.id}`
  }
  function imprimirCartaLimpa(){
    document.body.classList.add('imprimindo-carta')
    setTimeout(()=>{ window.print(); setTimeout(()=> document.body.classList.remove('imprimindo-carta'), 500) },100)
  }
  function imprimirRelatorio(){
    document.body.classList.add('imprimindo-relatorio')
    setTimeout(()=>{ window.print(); setTimeout(()=> document.body.classList.remove('imprimindo-relatorio'), 500) },100)
  }

  const ini = parseData(mesIni+'-01')
  const fim = (()=>{ const [a,m]=mesFim.split('-'); const last=new Date(parseInt(a),parseInt(m),0); return new Date(last.getFullYear(), last.getMonth(), last.getDate(), 12,0,0) })()
  const fimAnoAnterior = new Date(ini); fimAnoAnterior.setDate(0); fimAnoAnterior.setHours(12,0,0,0)
  const comungantesAnoAnterior = membros.filter(m=>!isNaoComungante(m) && ativoEm(fimAnoAnterior, m))
  const naoAnoAnterior = membros.filter(m=> isNaoComungante(m) && ativoEm(fimAnoAnterior, m))
  const admNoPeriodo = membros.filter(m=> inPeriodo(m.data_admissao, ini, fim))
  const demNoPeriodo = membros.filter(m=> inPeriodo(m.data_demissao, ini, fim))

  function contar(lista, cat, isAdm){
    let f=lista
    if(cat) f=f.filter(m=> (isAdm?classificarAdmissao(m):classificarDemissao(m))===cat)
    const masc=f.filter(m=> sexoMasc(m)).length
    const fem=f.filter(m=> sexoFem(m)).length
    return {lista:f, masc, fem, total:f.length}
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
  const rodapedinamico = `${nomeIgreja} — ${enderecoIgreja} — Brasil — CNPJ: ${cnpjIgreja || '00.000.000/0001-00'}`

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
                      <td className="border p-2 text-center">{formatarCPF(m.cpf)}</td>
                      <td className="border p-2 bg-yellow-50/30 text-center">{formatarCategoriaExibicao(m)}</td>
                      <td className="border p-2 text-center">{formatarOficioTabela(m)}</td>
                      <td className="border p-2 text-center">{m.data_admissao?formatarDataBR(m.data_admissao):'---'}</td>
                      <td className="border p-2 text-center">{m.data_batismo?formatarDataBR(m.data_batismo):'---'}</td>
                      <td className="border p-2 text-center">{m.data_profissao_fe?formatarDataBR(m.data_profissao_fe):'---'}</td>
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
              <table className="w-full text-sm border"><thead className="bg-gray-100"><tr><th className="border p-2 text-left">Nome</th><th className="border p-2">CPF</th><th className="border p-2 w-56">Assinatura</th></tr></thead><tbody>{filtrarComungantesParaAssembleia().map(m=><tr key={m.id} className="h-10"><td className="border p-3">{m.nome_completo}</td><td className="border p-2 text-center">{formatarCPF(m.cpf)}</td><td className="border p-2"></td></tr>)}</tbody></table>
            </div>
          )}
          {aba==='demitidos' && (
            <div>
              <h3 className="font-bold text-center text-lg mb-4">Relação de Membros Demitidos - {nomeIgreja} ({filtrarDemitidos().length})</h3>
              <table className="w-full text-xs border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2 text-left">Nome</th>
                    <th className="border p-2">CPF</th>
                    <th className="border p-2 bg-yellow-50">Categoria</th>
                    <th className="border p-2">Ofício</th>
                    <th className="border p-2">Data Demissão</th>
                    <th className="border p-2">Forma Demissão</th>
                    <th className="border p-2">Ver</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrarDemitidos().map(m=>(
                    <tr key={m.id}>
                      <td className="border p-2">{m.nome_completo}</td>
                      <td className="border p-2 text-center">{formatarCPF(m.cpf)}</td>
                      <td className="border p-2 text-center bg-yellow-50/30">{formatarCategoriaExibicao(m)}</td>
                      <td className="border p-2 text-center">{formatarOficioTabela(m)}</td>
                      <td className="border p-2 text-center">{m.data_demissao?formatarDataBR(m.data_demissao):'---'}</td>
                      <td className="border p-2 text-center">{m.forma_demissao||m.motivo_demissao||'---'}</td>
                      <td className="border p-2 text-center"><button onClick={()=>abrirFichaDemitido(m)} className="border px-2 py-1 rounded bg-white hover:bg-gray-50">👁️</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {aba==='movimentacao' && (
            <div>
              <div className="flex flex-wrap justify-between gap-4 mb-6 no-print">
                <div>
                  <h3 className="font-bold text-[20px] text-[#0A3D26]">MOVIMENTAÇÃO DE MEMBROS</h3>
                  <p className="text-xs text-gray-600">Padrão: Janeiro/2026 a Dezembro/2026 • Saldo Inicial = Fechamento de {formatarDataBR(fimAnoAnterior)} (31/12/2025)</p>
                  <p className="text-xs">Período: <b>{formatarDataLongaBR(ini)} a {formatarDataLongaBR(fim)}</b></p>
                </div>
                <div className="flex gap-2 items-end bg-yellow-50 border p-3 rounded-xl">
                  <div><label className="text-[10px] font-bold block">MÊS INICIAL</label><input type="month" value={mesIni} onChange={e=>setMesIni(e.target.value)} className="border p-2 rounded text-sm" /></div>
                  <div><label className="text-[10px] font-bold block">MÊS FINAL</label><input type="month" value={mesFim} onChange={e=>setMesFim(e.target.value)} className="border p-2 rounded text-sm" /></div>
                  <div className="text-[10px] text-gray-500 ml-2">Nunca inferior a 1 mês completo</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="border rounded-xl overflow-hidden">
                  <div className="bg-[#0A3D26] text-white px-4 py-2 font-bold text-sm">COMUNGANTES</div>
                  <div className="p-3">
                    <p className="font-bold text-xs mb-2">A D M I S S Ã O</p>
                    <table className="w-full text-xs">
                      <thead><tr className="text-[11px] text-gray-500"><th className="text-left"></th><th>MASC.</th><th>FEM.</th><th className="bg-gray-200">TOTAL</th></tr></thead>
                      <tbody>
                        {['Profissão de Fé','Profissão de Fé e Batismo','Transferência','Jurisdição','Restauração','Designação do Presbitério'].map(cat=>{
                          const {masc,fem,total,lista}=contar(admNoPeriodo.filter(m=>!isNaoComungante(m)), cat, true)
                          return <tr key={cat} className="border-b"><td className="py-1">{cat}:</td><td className="text-center"><button onClick={()=>total>0&&setModalMov({titulo:cat, lista})} className="bg-yellow-100 border px-2 rounded font-bold hover:bg-yellow-200">{masc}</button></td><td className="text-center"><button onClick={()=>total>0&&setModalMov({titulo:cat, lista})} className="bg-yellow-100 border px-2 rounded font-bold hover:bg-yellow-200">{fem}</button></td><td className="text-center bg-gray-100"><button onClick={()=>total>0&&setModalMov({titulo:cat, lista})} className="bg-gray-300 px-2 rounded font-bold">{total}</button></td></tr>
                        })}
                      </tbody>
                    </table>
                    <p className="font-bold text-xs mt-4 mb-2">D E M I S S Ã O</p>
                    <table className="w-full text-xs">
                      <tbody>
                        {['Transferência','Falecimento','Exclusão','Ordenação'].map(cat=>{
                          const {masc,fem,total,lista}=contar(demNoPeriodo.filter(m=>!isNaoComungante(m)), cat, false)
                          return <tr key={cat} className="border-b"><td className="py-1">{cat}:</td><td className="text-center"><button onClick={()=>total>0&&setModalMov({titulo:cat+' - Demissão', lista})} className="bg-yellow-100 border px-2 rounded font-bold">{masc}</button></td><td className="text-center"><button onClick={()=>total>0&&setModalMov({titulo:cat+' - Demissão', lista})} className="bg-yellow-100 border px-2 rounded font-bold">{fem}</button></td><td className="text-center bg-gray-100"><button onClick={()=>total>0&&setModalMov({titulo:cat+' - Demissão', lista})} className="bg-gray-300 px-2 rounded font-bold">{total}</button></td></tr>
                        })}
                      </tbody>
                    </table>
                    <div className="bg-gray-50 mt-4 p-2 rounded text-xs space-y-1">
                      <div className="flex justify-between"><span>Diferença (Adm - Dem):</span><span className="bg-green-100 px-2 rounded font-bold">{contar(admNoPeriodo.filter(m=>!isNaoComungante(m))).total - contar(demNoPeriodo.filter(m=>!isNaoComungante(m))).total}</span></div>
                      <div className="flex justify-between"><span>Comungantes Ano Anterior (31/12/2025):</span><span className="bg-gray-300 px-2 rounded">{comungantesAnoAnterior.length}</span></div>
                      <div className="flex justify-between"><span>Comungantes Ano Atual:</span><span className="bg-yellow-300 px-2 rounded font-bold">{comungantesAnoAnterior.length + contar(admNoPeriodo.filter(m=>!isNaoComungante(m))).total - contar(demNoPeriodo.filter(m=>!isNaoComungante(m))).total}</span></div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-xl overflow-hidden">
                  <div className="bg-yellow-100 px-4 py-2 font-bold text-sm">NÃO-COMUNGANTES</div>
                  <div className="p-3">
                    <p className="font-bold text-xs mb-2">A D M I S S Ã O</p>
                    <table className="w-full text-xs">
                      <thead><tr className="text-[11px] text-gray-500"><th className="text-left"></th><th>MASC.</th><th>FEM.</th><th className="bg-gray-200">TOTAL</th></tr></thead>
                      <tbody>
                        {['Batismo','Transferência','Jurisdição'].map(cat=>{
                          const {masc,fem,total,lista}=contar(admNoPeriodo.filter(m=>isNaoComungante(m)), cat, true)
                          return <tr key={cat} className="border-b"><td className="py-1">{cat}:</td><td className="text-center"><button onClick={()=>total>0&&setModalMov({titulo:cat+' - Não-Comungantes', lista})} className="bg-yellow-100 border px-2 rounded font-bold">{masc}</button></td><td className="text-center"><button onClick={()=>total>0&&setModalMov({titulo:cat+' - Não-Comungantes', lista})} className="bg-yellow-100 border px-2 rounded font-bold">{fem}</button></td><td className="text-center bg-gray-100"><button onClick={()=>total>0&&setModalMov({titulo:cat+' - Não-Comungantes', lista})} className="bg-gray-300 px-2 rounded font-bold">{total}</button></td></tr>
                        })}
                      </tbody>
                    </table>
                    <p className="font-bold text-xs mt-4 mb-2">D E M I S S Ã O</p>
                    <table className="w-full text-xs">
                      <tbody>
                        {['Profissão de Fé','Transferência','Falecimento','Exclusão'].map(cat=>{
                          const {masc,fem,total,lista}=contar(demNoPeriodo.filter(m=>isNaoComungante(m)), cat, false)
                          return <tr key={cat} className="border-b"><td className="py-1">{cat}:</td><td className="text-center"><button onClick={()=>total>0&&setModalMov({titulo:cat+' - Dem Não-Comungantes', lista})} className="bg-yellow-100 border px-2 rounded font-bold">{masc}</button></td><td className="text-center"><button onClick={()=>total>0&&setModalMov({titulo:cat+' - Dem Não-Comungantes', lista})} className="bg-yellow-100 border px-2 rounded font-bold">{fem}</button></td><td className="text-center bg-gray-100"><button onClick={()=>total>0&&setModalMov({titulo:cat+' - Dem Não-Comungantes', lista})} className="bg-gray-300 px-2 rounded font-bold">{total}</button></td></tr>
                        })}
                      </tbody>
                    </table>
                    <div className="bg-gray-50 mt-4 p-2 rounded text-xs space-y-1">
                      <div className="flex justify-between"><span>Diferença (Adm - Dem):</span><span className="bg-green-100 px-2 rounded font-bold">{contar(admNoPeriodo.filter(m=>isNaoComungante(m))).total - contar(demNoPeriodo.filter(m=>isNaoComungante(m))).total}</span></div>
                      <div className="flex justify-between"><span>Não-Comungantes Ano Anterior:</span><span className="bg-gray-300 px-2 rounded">{naoAnoAnterior.length}</span></div>
                      <div className="flex justify-between"><span>Não-Comungantes Ano Atual:</span><span className="bg-yellow-300 px-2 rounded font-bold">{naoAnoAnterior.length + contar(admNoPeriodo.filter(m=>isNaoComungante(m))).total - contar(demNoPeriodo.filter(m=>isNaoComungante(m))).total}</span></div>
                      <div className="flex justify-between font-bold border-t pt-1"><span>ROL ATUAL TOTAL:</span><span className="bg-[#0A3D26] text-white px-2 rounded">{(comungantesAnoAnterior.length + contar(admNoPeriodo.filter(m=>!isNaoComungante(m))).total - contar(demNoPeriodo.filter(m=>!isNaoComungante(m))).total) + (naoAnoAnterior.length + contar(admNoPeriodo.filter(m=>isNaoComungante(m))).total - contar(demNoPeriodo.filter(m=>isNaoComungante(m))).total)}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {modalMov && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
                  <div className="bg-white w-full max-w-md h-full overflow-auto p-4">
                    <div className="flex justify-between border-b pb-2 mb-3"><h3 className="font-bold text-sm">{modalMov.titulo} - {modalMov.lista.length} membros</h3><button onClick={()=>setModalMov(null)} className="border px-2 rounded">✕</button></div>
                    <div className="space-y-2">
                      {modalMov.lista.map(m=>(
                        <div key={m.id} className="border rounded p-2 text-xs cursor-pointer hover:bg-gray-50" onClick={()=>abrirFichaDemitido(m)}>
                          <div className="font-bold">{m.nome_completo} - {formatarCPF(m.cpf)}</div>
                          <div className="text-[11px] text-gray-600">{m.sexo} • {formatarCategoriaExibicao(m)} • {formatarDataBR(m.data_admissao)} • {m.forma_admissao||'---'} {m.data_demissao? `• Dem: ${formatarDataBR(m.data_demissao)} ${m.forma_demissao||''}`:''}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {aba==='batismo' && (
            <div>
              <div className="mb-6 no-print">
                <h3 className="font-bold text-center text-lg mb-2">Certificado de Batismo - {nomeIgreja}</h3>
                <input value={buscaBatismo} onChange={e=>buscarBatismo(e.target.value)} placeholder="Pesquisar membro para emitir certificado..." className="border p-3 rounded-lg w-full" />
                {resultBatismo.length>0 && <div className="border rounded mt-2 max-h-40 overflow-auto bg-white shadow">{resultBatismo.map(r=><div key={r.id} onClick={()=>{setMembroBatismo(r); setResultBatismo([]); setBuscaBatismo(r.nome_completo)}} className="p-2 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-0">{r.nome_completo} - {r.data_batismo?formatarDataBR(r.data_batismo):'s/ batismo'}</div>)}</div>}
              </div>

              {membroBatismo && (
                <>
                  {/* FRENTE - COM BORDA ORNAMENTADA */}
                  <div className="pagina-cert" style={{backgroundImage:"url('/borda-certificado.png')"}}>
                    <div className="conteudo-cert">
                      <div className="flex justify-center">
                        <img src={logoIgreja || '/logo-igreja.png'} className="h-[70px] w-auto -mt-1 object-contain" alt="logo"/>
                      </div>
                      <h2 className="fonte-igreja text-center text-[26px] text-[#0a3d26] mt-2 leading-tight">{nomeIgreja}</h2>
                      <h1 className="titulo-ouro text-center text-[38px] font-bold mt-5 tracking-[1px]">CERTIFICADO DE BATISMO</h1>
                      <p className="text-center text-[13px] italic mt-2">Certificamos que foi administrado o Sacramento do Batismo a:</p>

                      <div className="mt-8 px-2 md:px-6 text-[14.5px] leading-[2.6] flex-1">
                        <p>Nome: <span className="font-bold border-b border-black px-3">{membroBatismo.nome_completo}</span></p>
                        <p>Data de Nascimento: <span className="border-b border-black px-3">{membroBatismo.data_nascimento?formatarDataLongaBR(membroBatismo.data_nascimento):'___'}</span></p>
                        <p>Data do Batismo: <span className="border-b border-black px-4">{membroBatismo.data_batismo?formatarDataBR(membroBatismo.data_batismo):'__/__/____'}</span> &nbsp; Local: <span className="border-b border-dotted border-black px-6">{membroBatismo.local_batismo || nomeIgreja}</span></p>
                        <p className="mt-6">Oficiado por Reverendo: <span className="border-b border-black px-8">{membroBatismo.pastor_batismo || igreja?.pastor_nome || '____________________'}</span></p>
                      </div>

                      <div className="flex justify-center mt-14">
                        <div className="text-center">
                          <div className="font-[cursive] text-[20px] text-[#0a3d26] -mb-1">Assinatura</div>
                          <div className="border-t border-black w-[260px]"></div>
                          <p className="text-[10px] mt-1">Assinatura do Pastor</p>
                        </div>
                      </div>

                      <div className="rodape-igreja">{rodapedinamico}</div>
                    </div>
                  </div>

                  {/* VERSO - DADOS COMPLEMENTARES COM MESMO RODAPÉ */}
                  <div className="pagina-cert mt-8" style={{backgroundImage:"url('/borda-certificado.png')"}}>
                    <div className="conteudo-cert">
                      <div className="flex justify-center">
                        <img src={logoIgreja || '/logo-igreja.png'} className="h-[62px] w-auto object-contain" alt="logo"/>
                      </div>
                      <h2 className="fonte-igreja text-center text-[22px] text-[#0a3d26] mt-2 leading-tight">{nomeIgreja}</h2>
                      <h1 className="titulo-ouro text-center text-[30px] font-bold mt-2">Dados Complementares</h1>

                      <div className="flex mt-8 px-2 md:px-6">
                        <div className="flex-1 text-[13px] leading-[2.7]">
                          <p>CPF: <span className="border-b border-black px-8">{formatarCPF(membroBatismo.cpf)}</span></p>
                          <p>Filiação — Pai: <span className="border-b border-black px-6">{membroBatismo.filiacao_pai || membroBatismo.nome_pai || '---'}</span></p>
                          <p>Filiação — Mãe: <span className="border-b border-black px-6">{membroBatismo.filiacao_mae || membroBatismo.nome_mae || '---'}</span></p>
                          <p className="mt-4">Forma de Admissão: <span className="border-b border-black px-8">{membroBatismo.forma_admissao || classificarAdmissao(membroBatismo)}</span></p>
                          <p>Nº Rol: <span className="border-b border-black px-12">{membroBatismo.numero_rol || membroBatismo.id?.slice(0,8) || '---'}</span></p>
                          <p>Data de emissão: <span className="border-b border-black px-6">{formatarDataBR(new Date().toISOString())}</span></p>
                        </div>
                        <div className="w-[120px] flex flex-col items-center pt-2">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`validacao:${membroBatismo.id}-${membroBatismo.nome_completo}`)}`} className="w-[92px] h-[92px]" alt="QR"/>
                          <p className="text-[7px] mt-1">Validação</p>
                        </div>
                      </div>

                      <div className="rodape-igreja">{rodapedinamico}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
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
       .fonte-igreja{font-family:Optima,Candara,'Zapf Humanist',sans-serif;font-weight:700}
       .titulo-ouro{color:#b89a5a;font-family:serif;letter-spacing:1px}
       .pagina-cert{width:100%;max-width:900px;min-height:560px;background-size:100% 100%;background-repeat:no-repeat;background-color:#fdf6e3;position:relative;margin:0 auto;box-sizing:border-box;page-break-after:always}
       .conteudo-cert{padding:38px 64px 52px 64px;position:relative;min-height:560px;display:flex;flex-direction:column}
       .rodape-igreja{position:absolute;bottom:12px;left:10px;right:10px;text-align:center;font-size:7px;color:#222;letter-spacing:0.15px;line-height:1.2}
        @media print {
          body { background: white!important; }
       .no-print { display: none!important; }
       .print\\:block { display: block!important; }
         .pagina-cert{width:297mm!important;height:210mm!important;max-width:none!important;box-shadow:none!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
         .conteudo-cert{min-height:210mm}
          body.imprimindo-carta * { visibility: hidden!important; }
          body.imprimindo-carta #detalhe-carta, body.imprimindo-carta #detalhe-carta * { visibility: visible!important; }
          body.imprimindo-carta #detalhe-carta { position: absolute!important; left:0!important; top:0!important; width:100%!important; max-width:100%!important; margin:0!important; padding:0!important; border:none!important; box-shadow:none!important; background:white!important; }
          body.imprimindo-relatorio * { visibility: hidden!important; }
          body.imprimindo-relatorio #area-impressao, body.imprimindo-relatorio #area-impressao * { visibility: visible!important; }
          body.imprimindo-relatorio #area-impressao { position: absolute!important; left:0!important; top:0!important; width:100%!important; margin:0!important; padding:0!important; background:white!important; }
          body.imprimindo-relatorio table { width:100%!important; border-collapse: collapse!important; }
          @page { margin: 0; size: A4 landscape; }
        }
      `}</style>
    </div>
  )
}
