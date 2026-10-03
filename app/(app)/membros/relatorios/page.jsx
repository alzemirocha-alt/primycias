"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

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

  async function carregar(){
    setLoading(true)
    let dadosIgreja = null
    const tabelas = ['dados_igreja','igreja','igrejas','config_igreja','configuracoes']
    for(let t of tabelas){
      const { data } = await supabase.from(t).select('*').limit(1).maybeSingle()
      if(data){ dadosIgreja = data; break }
    }
    setIgreja(dadosIgreja)
    const { data: m } = await supabase.from('membros_oficial').select('*').limit(5000).order('nome_completo')
    const { data: c } = await supabase.from('cartas_transferencia').select('*').order('data_emissao',{ascending:false}).limit(100)
    setMembros(m||[])
    setCartas(c||[])
    setLoading(false)
  }

  async function buscarBatismo(v){
    setBuscaBatismo(v)
    if(v.length<2){ setResultBatismo([]); return }
    const { data } = await supabase.from('membros_oficial').select('*').ilike('nome_completo', `%${v}%`).limit(10)
    setResultBatismo(data||[])
  }

  async function buscarCartaPorMembro(){
    if(!buscaCarta){ carregar(); return }
    const { data } = await supabase.from('cartas_membros').select('carta_id, cartas_transferencia(*)').ilike('nome_completo', `%${buscaCarta}%`).limit(20)
    const unicas = {}
    data?.forEach(d=>{ if(d.cartas_transferencia) unicas[d.carta_id]=d.cartas_transferencia })
    setCartas(Object.values(unicas))
  }

  // --- FUNÇÃO CORRIGIDA QUE NÃO ABRIA ---
  async function abrirCarta(id){
    setAba('cartas')
    const { data: c } = await supabase.from('cartas_transferencia').select('*').eq('id', id).single()
    const { data: m } = await supabase.from('cartas_membros').select('*').eq('carta_id', id)
    setCartaAberta(c)
    setMembrosCarta(m||[])
    setTimeout(()=>{
      document.getElementById('detalhe-carta')?.scrollIntoView({behavior:'smooth', block:'start'})
    },100)
  }

  function filtrarAtivos(){
    let f = membros.filter(m=> (m.status||'').toLowerCase()==='ativo' || (m.situacao||'').toLowerCase()==='ativo')
    if(filtroTipo==='comungante') f=f.filter(m=> (m.tipo_membro||'').toLowerCase().includes('comungante') && !m.tipo_membro.toLowerCase().includes('não') && !m.tipo_membro.toLowerCase().includes('nao'))
    if(filtroTipo==='nao') f=f.filter(m=> (m.tipo_membro||'').toLowerCase().includes('não') || (m.tipo_membro||'').toLowerCase().includes('nao'))
    if(busca) f=f.filter(m=> m.nome_completo.toLowerCase().includes(busca.toLowerCase()))
    return f
  }

  function filtrarDemitidos(){
    let f = membros.filter(m=> (m.status||'').toLowerCase().includes('demitido') || (m.situacao||'').toLowerCase().includes('demitido'))
    if(filtroTipo==='comungante') f=f.filter(m=> (m.tipo_membro||'').toLowerCase().includes('comungante'))
    if(filtroTipo==='nao') f=f.filter(m=> (m.tipo_membro||'').toLowerCase().includes('não') || (m.tipo_membro||'').toLowerCase().includes('nao'))
    return f
  }

  const stats = {
    total: membros.length,
    masc: membros.filter(m=> (m.sexo||'').toLowerCase().startsWith('m')).length,
    fem: membros.filter(m=> (m.sexo||'').toLowerCase().startsWith('f')).length,
    batizados: membros.filter(m=> m.data_batismo || (m.modo_admissao||'').toLowerCase().includes('batismo')).length,
    profissao: membros.filter(m=> (m.modo_admissao||'').toLowerCase().includes('profiss')).length,
    admitidos: membros.filter(m=> (m.status||'').toLowerCase()==='ativo').length,
    demitidos: membros.filter(m=> (m.status||'').toLowerCase().includes('demitido')).length,
    transferidos: cartas.length
  }

  useEffect(()=>{ carregar() },[])
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search)
    const cartaId = params.get('carta')
    if(cartaId) abrirCarta(cartaId)
  },[])

  if(loading) return <div className="p-10">Carregando relatórios...</div>

  const nomeIgreja = igreja?.nome_igreja || igreja?.nome || igreja?.razao_social || "Igreja"
  const enderecoIgreja = igreja?.endereco || igreja?.endereco_completo || `${igreja?.cidade||''} - ${igreja?.estado||''}`
  const cnpjIgreja = igreja?.cnpj || igreja?.documento || ""
  const logoIgreja = igreja?.logo_url || igreja?.url_logo || null

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-[#0A3D26]">Relatórios</h1>
      <div className="flex flex-wrap gap-2 mt-4 mb-6">
        {[
          ['ativos','Membros Ativos'],
          ['assembleia','Assembléia Geral'],
          ['demitidos','Demitidos'],
          ['movimentacao','Movimentação'],
          ['batismo','Cert. Batismo'],
          ['cartas','Cartas Transferência']
        ].map(([id, label])=>(
          <button key={id} onClick={()=>setAba(id)} className={`px-4 py-2 rounded-lg text-sm font-bold border ${aba===id?'bg-[#0A3D26] text-white':'bg-white'}`}>{label}</button>
        ))}
      </div>

      <div className="bg-white border rounded-xl p-8 shadow-sm" id="print">
        <div className="flex gap-4 border-b pb-4 mb-6 items-center">
          {logoIgreja ? <img src={logoIgreja} className="w-16 h-16 object-contain rounded" /> : <div className="w-14 h-14 bg-[#0A3D26] rounded flex items-center justify-center text-white font-bold">IPB</div>}
          <div>
            <h2 className="font-bold text-lg">{nomeIgreja}</h2>
            <p className="text-xs text-gray-600">{enderecoIgreja} {cnpjIgreja? `| ${cnpjIgreja}`:''} {igreja?.data_organizacao? `| Organizada em ${new Date(igreja.data_organizacao).toLocaleDateString('pt-BR')}`:''}</p>
          </div>
          <div className="ml-auto"><button onClick={()=>window.print()} className="bg-black text-white px-4 py-2 rounded text-sm">Imprimir / PDF</button></div>
        </div>

        {aba==='ativos' && (
          <div>
            <h3 className="font-bold text-center text-lg mb-4">Relatório de Membros Ativos - {nomeIgreja}</h3>
            <div className="flex gap-2 mb-4">
              <select value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)} className="border p-2 rounded text-sm"><option value="todos">Todos</option><option value="comungante">Comungante</option><option value="nao">Não Comungante</option></select>
              <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar nome..." className="border p-2 rounded text-sm flex-1" />
            </div>
            <table className="w-full text-xs border"><thead className="bg-gray-100"><tr><th className="border p-2 text-left">Nome</th><th className="border p-2">CPF</th><th className="border p-2">Tipo</th><th className="border p-2">Data Admissão</th><th className="border p-2">Modo Admissão</th></tr></thead>
            <tbody>{filtrarAtivos().slice(0,500).map(m=><tr key={m.id}><td className="border p-2">{m.nome_completo}</td><td className="border p-2">{m.cpf||'---'}</td><td className="border p-2">{m.tipo_membro}</td><td className="border p-2">{m.data_admissao?new Date(m.data_admissao).toLocaleDateString('pt-BR'):'---'}</td><td className="border p-2">{m.modo_admissao||'---'}</td></tr>)}</tbody></table>
          </div>
        )}

        {aba==='assembleia' && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-6 bg-yellow-50 p-4 rounded border">
              <label className="text-sm">Tipo<select value={tipoAssembleia} onChange={e=>setTipoAssembleia(e.target.value)} className="w-full border p-2 rounded mt-1"><option>Assembléia Geral Ordinária</option><option>Assembléia Geral Extraordinária</option></select></label>
              <label className="text-sm">Data<input type="date" value={dataAssembleia} onChange={e=>setDataAssembleia(e.target.value)} className="w-full border p-2 rounded mt-1" /></label>
            </div>
            <h3 className="font-bold text-center">Relação de Membros para {tipoAssembleia}</h3>
            <p className="text-center text-sm mb-4">{nomeIgreja} - Data: {new Date(dataAssembleia).toLocaleDateString('pt-BR')}</p>
            <table className="w-full text-sm border"><thead className="bg-gray-100"><tr><th className="border p-2 text-left">Nome</th><th className="border p-2">CPF</th><th className="border p-2 w-48">Assinatura</th></tr></thead>
            <tbody>{membros.filter(m=> (m.tipo_membro||'').toLowerCase().includes('comungante') && !m.tipo_membro.toLowerCase().includes('não') && (m.status||'').toLowerCase()==='ativo').map(m=><tr key={m.id}><td className="border p-3">{m.nome_completo}</td><td className="border p-2">{m.cpf||'---'}</td><td className="border p-2"></td></tr>)}</tbody></table>
          </div>
        )}

        {aba==='demitidos' && (
          <div>
            <h3 className="font-bold text-center text-lg mb-4">Relação de Membros Demitidos - {nomeIgreja}</h3>
            <table className="w-full text-xs border"><thead className="bg-gray-100"><tr><th className="border p-2 text-left">Nome</th><th className="border p-2">CPF</th><th className="border p-2">Tipo</th><th className="border p-2">Data Demissão</th><th className="border p-2">Modo Demissão</th></tr></thead>
            <tbody>{filtrarDemitidos().map(m=><tr key={m.id}><td className="border p-2">{m.nome_completo}</td><td className="border p-2">{m.cpf||'---'}</td><td className="border p-2">{m.tipo_membro}</td><td className="border p-2">{m.data_demissao?new Date(m.data_demissao).toLocaleDateString('pt-BR'):'---'}</td><td className="border p-2">{m.modo_demissao||'---'}</td></tr>)}</tbody></table>
          </div>
        )}

        {aba==='movimentacao' && (
          <div>
            <h3 className="font-bold text-center text-lg mb-6">Relatório de Movimentação - {nomeIgreja}</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="border p-4 rounded"><b>Por Sexo</b><div>Masc: {stats.masc}</div><div>Fem: {stats.fem}</div></div>
              <div className="border p-4 rounded"><b>Movimentações</b><div>Batizados: {stats.batizados}</div><div>Profissão Fé: {stats.profissao}</div><div>Admitidos: {stats.admitidos}</div><div>Demitidos: {stats.demitidos}</div><div>Transferidos: {stats.transferidos}</div></div>
              <div className="border p-4 rounded"><b>Total</b><div className="text-2xl font-bold">{stats.total}</div></div>
            </div>
          </div>
        )}

        {aba==='batismo' && (
          <div>
            <h3 className="font-bold text-center text-lg mb-4">Certificado de Batismo - {nomeIgreja}</h3>
            <div className="mb-4"><input value={buscaBatismo} onChange={e=>buscarBatismo(e.target.value)} placeholder="Pesquisar membro..." className="border p-3 rounded-lg w-full" />
            {resultBatismo.length>0 && <div className="border rounded mt-2 max-h-40 overflow-auto">{resultBatismo.map(r=><div key={r.id} onClick={()=>{setMembroBatismo(r); setResultBatismo([]); setBuscaBatismo(r.nome_completo)}} className="p-2 hover:bg-gray-100 cursor-pointer text-sm">{r.nome_completo}</div>)}</div>}
            </div>
            {membroBatismo && (
              <div className="text-center py-10 px-8 border-2 border-double">
                <h2 className="font-bold">{nomeIgreja}</h2>
                <h2 className="text-xl font-bold mt-4">CERTIFICADO DE BATISMO</h2>
                <p className="mt-8 text-sm leading-7">Certificamos que <b>{membroBatismo.nome_completo}</b>, filho(a) de {membroBatismo.filiacao_pai||'---'} e {membroBatismo.filiacao_mae||'---'}, foi batizado(a) em <b>{membroBatismo.data_batismo?new Date(membroBatismo.data_batismo).toLocaleDateString('pt-BR'):'__/__/____'}</b>.</p>
                <p className="mt-4 text-sm">Pastor Celebrante: _________________________</p>
                <div className="mt-20 grid grid-cols-2 gap-10 text-sm"><div className="border-t pt-2">Secretário</div><div className="border-t pt-2">Pastor</div></div>
              </div>
            )}
          </div>
        )}

        {aba==='cartas' && (
          <div>
            <h3 className="font-bold text-center text-lg mb-4">Relatório de Cartas de Transferência - {nomeIgreja}</h3>
            <div className="flex gap-2 mb-4">
              <input value={buscaCarta} onChange={e=>setBuscaCarta(e.target.value)} placeholder="Pesquisar por nome do membro na carta..." className="border p-2 rounded flex-1 text-sm" />
              <button onClick={buscarCartaPorMembro} className="bg-[#0A3D26] text-white px-4 rounded text-sm">Buscar</button>
            </div>
            <div className="space-y-2 mb-6 max-h-64 overflow-auto">
              {cartas.map(c=><div key={c.id} onClick={()=>abrirCarta(c.id)} className="border p-3 rounded hover:bg-gray-50 cursor-pointer flex justify-between text-sm"><div><b>{c.igreja_destino}</b> - {new Date(c.data_emissao).toLocaleDateString('pt-BR')}</div><span className="text-xs bg-black text-white px-2 py-1 rounded">Abrir</span></div>)}
            </div>
            {cartaAberta && (
              <div id="detalhe-carta" className="border-2 border-[#0A3D26] rounded-xl p-6 bg-gray-50">
                <h4 className="font-bold text-lg">Carta para: {cartaAberta.igreja_destino}</h4>
                <p className="text-xs text-gray-600">Emitida em: {new Date(cartaAberta.data_emissao).toLocaleDateString('pt-BR')} às {new Date(cartaAberta.data_emissao).toLocaleTimeString('pt-BR')}</p>
                <ol className="list-decimal ml-6 mt-4 text-sm space-y-2 bg-white p-4 rounded border">
                  {membrosCarta.length===0 && <li className="text-red-500">Nenhum membro vinculado - verifique cartas_membros no Supabase</li>}
                  {membrosCarta.map((m,i)=><li key={i}><b>{m.nome_completo}</b> - {m.tipo_membro}<br/><i className="text-xs">{m.forma_transferencia_individual}</i></li>)}
                </ol>
                <div className="mt-10 grid grid-cols-2 gap-10 text-sm text-center"><div className="border-t pt-2">Pastor</div><div className="border-t pt-2">Secretário</div></div>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@media print { button{display:none} }`}</style>
    </div>
  )
}
