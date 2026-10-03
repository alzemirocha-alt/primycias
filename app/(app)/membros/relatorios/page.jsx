"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const LOGO_URL = "https://ebqvtoqpoxaklhheaeve.supabase.co/storage/v1/object/public/logos/Code_Generated_Image.png"

export default function RelatoriosPage() {
  const [aba, setAba] = useState('ativos')
  const [dados, setDados] = useState([])
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [tipoAssembleia, setTipoAssembleia] = useState('Assembléia Geral Ordinária')
  const [dataAssembleia, setDataAssembleia] = useState(new Date().toISOString().split('T')[0])
  const [buscaCarta, setBuscaCarta] = useState('')
  const [cartas, setCartas] = useState([])
  const [buscaBatismo, setBuscaBatismo] = useState('')
  const [resBatismo, setResBatismo] = useState([])
  const [membroBatismo, setMembroBatismo] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  async function carregarAtivos() {
    setLoading(true)
    let q = supabase.from('membros_oficial').select('*').eq('status','ativo').order('nome_completo')
    if(filtroTipo!=='todos') q = q.eq('tipo_membro', filtroTipo)
    const {data} = await q.limit(500)
    setDados(data||[]); setLoading(false)
  }

  async function carregarDemitidos() {
    setLoading(true)
    let q = supabase.from('membros_oficial').select('*').eq('status','demitido').order('data_demissao', {ascending:false})
    if(filtroTipo!=='todos') q = q.eq('tipo_membro', filtroTipo)
    const {data} = await q.limit(500)
    setDados(data||[]); setLoading(false)
  }

  async function carregarAssembleia() {
    setLoading(true)
    const {data} = await supabase.from('membros_oficial').select('nome_completo, cpf').eq('status','ativo').eq('tipo_membro','comungante').order('nome_completo').limit(500)
    setDados(data||[]); setLoading(false)
  }

  async function carregarMovimentacao() {
    setLoading(true)
    const {data: ativos} = await supabase.from('membros_oficial').select('sexo, data_nascimento, data_batismo, data_profissao_fe, data_admissao').eq('status','ativo')
    const {data: demitidos} = await supabase.from('membros_oficial').select('id').eq('status','demitido')
    const {data: transferidos} = await supabase.from('cartas_transferencia').select('id', {count:'exact'})

    const porSexo = { M: ativos?.filter(a=>a.sexo==='M').length||0, F: ativos?.filter(a=>a.sexo==='F').length||0 }
    const porIdade = { crianca: 0, jovem: 0, adulto: 0, idoso: 0 }
    ativos?.forEach(a=>{
      if(!a.data_nascimento) return
      const idade = new Date().getFullYear() - new Date(a.data_nascimento).getFullYear()
      if(idade<12) porIdade.crianca++; else if(idade<18) porIdade.jovem++; else if(idade<60) porIdade.adulto++; else porIdade.idoso++
    })

    setStats({
      totalAtivos: ativos?.length||0,
      totalDemitidos: demitidos?.length||0,
      totalTransferidos: transferidos?.length||0,
      batizados: ativos?.filter(a=>a.data_batismo).length||0,
      profissaoFe: ativos?.filter(a=>a.data_profissao_fe).length||0,
      porSexo, porIdade
    })
    setLoading(false)
  }

  async function buscarCartas() {
    const {data} = await supabase.from('cartas_transferencia').select('*, cartas_membros(*)').order('data_emissao', {ascending:false}).limit(100)
    let filtradas = data||[]
    if(buscaCarta) filtradas = filtradas.filter(c=> c.cartas_membros?.some(m=> m.nome_completo.toLowerCase().includes(buscaCarta.toLowerCase())) || c.igreja_destino.toLowerCase().includes(buscaCarta.toLowerCase()))
    setCartas(filtradas)
  }

  async function buscarBatismo(e) {
    const termo = e.target.value
    setBuscaBatismo(termo)
    if(termo.length<2) return
    const {data} = await supabase.from('membros_oficial').select('*').ilike('nome_completo', `%${termo}%`).limit(5)
    setResBatismo(data||[])
  }

  useEffect(()=>{
    if(aba==='ativos') carregarAtivos()
    if(aba==='demitidos') carregarDemitidos()
    if(aba==='assembleia') carregarAssembleia()
    if(aba==='movimentacao') carregarMovimentacao()
    if(aba==='cartas') buscarCartas()
  },[aba, filtroTipo])

  function imprimir() { window.print() }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <style>{`@media print {.no-print{display:none!important} }`}</style>
      <h1 className="text-2xl font-bold text-[#0A3D26] no-print">Relatórios</h1>

      <div className="flex gap-2 mt-4 flex-wrap no-print">
        {[
          ['ativos','Membros Ativos'],
          ['assembleia','Assembléia Geral'],
          ['demitidos','Demitidos'],
          ['movimentacao','Movimentação'],
          ['batismo','Certificado Batismo'],
          ['cartas','Cartas de Transferência'],
        ].map(([id,label])=>(
          <button key={id} onClick={()=>setAba(id)} className={`px-4 py-2 rounded-lg text-sm border ${aba===id?'bg-[#0A3D26] text-white':'bg-white'}`}>{label}</button>
        ))}
      </div>

      <div id="print-area" className="mt-6 bg-white border rounded-xl p-6">
        {/* CABECALHO PADRAO */}
        <div className="flex items-center gap-4 border-b-2 border-[#0A3D26] pb-4 mb-6">
          <img src={LOGO_URL} className="h-[50px]" alt="logo"/>
          <div>
            <h2 className="font-bold text-[#0A3D26]">Igreja Presbiteriana</h2>
            <p className="text-xs text-gray-500">Relatório oficial - {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <button onClick={imprimir} className="ml-auto no-print bg-black text-white px-4 py-2 rounded text-sm">Imprimir PDF</button>
        </div>

        {aba==='ativos' && (
          <div>
            <h3 className="font-bold text-lg">Relatório de Membros Ativos</h3>
            <div className="flex gap-2 mt-3 no-print">
              <select value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)} className="border p-2 rounded"><option value="todos">Todos</option><option value="comungante">Comungante</option><option value="nao-comungante">Não comungante</option></select>
              <button onClick={carregarAtivos} className="bg-[#0A3D26] text-white px-4 rounded">Filtrar</button>
            </div>
            <table className="w-full mt-4 text-sm border">
              <thead className="bg-gray-100"><tr><th className="p-2 border text-left">Nome</th><th className="p-2 border">CPF</th><th className="p-2 border">Tipo</th><th className="p-2 border">Admissão</th><th className="p-2 border">Modo</th></tr></thead>
              <tbody>{dados.map(m=><tr key={m.id}><td className="p-2 border">{m.nome_completo}</td><td className="p-2 border">{m.cpf||'---'}</td><td className="p-2 border">{m.tipo_membro}</td><td className="p-2 border">{m.data_admissao? new Date(m.data_admissao).toLocaleDateString('pt-BR'):'---'}</td><td className="p-2 border">{m.forma_admissao_comungante||m.forma_admissao||'---'}</td></tr>)}</tbody>
            </table>
          </div>
        )}

        {aba==='assembleia' && (
          <div>
            <h3 className="font-bold text-lg">Relação de Membros para {tipoAssembleia}</h3>
            <div className="grid grid-cols-2 gap-3 mt-3 no-print">
              <select value={tipoAssembleia} onChange={e=>setTipoAssembleia(e.target.value)} className="border p-2 rounded"><option>Assembléia Geral Ordinária</option><option>Assembléia Geral Extraordinária</option></select>
              <input type="date" value={dataAssembleia} onChange={e=>setDataAssembleia(e.target.value)} className="border p-2 rounded"/>
            </div>
            <p className="text-sm mt-3">Data: {new Date(dataAssembleia).toLocaleDateString('pt-BR')} - {tipoAssembleia}</p>
            <table className="w-full mt-4 text-sm border">
              <thead className="bg-gray-100"><tr><th className="p-2 border text-left">Nome</th><th className="p-2 border">CPF</th><th className="p-2 border w-[200px]">Assinatura</th></tr></thead>
              <tbody>{dados.map(m=><tr key={m.id}><td className="p-2 border">{m.nome_completo}</td><td className="p-2 border">{m.cpf||'---'}</td><td className="p-2 border h-[35px]"></td></tr>)}</tbody>
            </table>
          </div>
        )}

        {aba==='demitidos' && (
          <div>
            <h3 className="font-bold text-lg">Relação de Membros Demitidos</h3>
            <div className="flex gap-2 mt-3 no-print">
              <select value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)} className="border p-2 rounded"><option value="todos">Todos</option><option value="comungante">Comungante</option><option value="nao-comungante">Não comungante</option></select>
              <button onClick={carregarDemitidos} className="bg-[#0A3D26] text-white px-4 rounded">Filtrar</button>
            </div>
            <table className="w-full mt-4 text-sm border">
              <thead className="bg-gray-100"><tr><th className="p-2 border text-left">Nome</th><th className="p-2 border">CPF</th><th className="p-2 border">Tipo</th><th className="p-2 border">Data Demissão</th><th className="p-2 border">Modo</th></tr></thead>
              <tbody>{dados.map(m=><tr key={m.id}><td className="p-2 border">{m.nome_completo}</td><td className="p-2 border">{m.cpf||'---'}</td><td className="p-2 border">{m.tipo_membro}</td><td className="p-2 border">{m.data_demissao? new Date(m.data_demissao).toLocaleDateString('pt-BR'):'---'}</td><td className="p-2 border">{m.forma_demissao||'---'}</td></tr>)}</tbody>
            </table>
          </div>
        )}

        {aba==='movimentacao' && stats && (
          <div>
            <h3 className="font-bold text-lg">Relatório de Movimentação de Membros</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="border rounded-lg p-4 text-center"><p className="text-2xl font-bold">{stats.totalAtivos}</p><p className="text-xs">Ativos</p></div>
              <div className="border rounded-lg p-4 text-center"><p className="text-2xl font-bold">{stats.batizados}</p><p className="text-xs">Batizados</p></div>
              <div className="border rounded-lg p-4 text-center"><p className="text-2xl font-bold">{stats.profissaoFe}</p><p className="text-xs">Profissão de Fé</p></div>
              <div className="border rounded-lg p-4 text-center"><p className="text-2xl font-bold">{stats.totalDemitidos}</p><p className="text-xs">Demitidos</p></div>
              <div className="border rounded-lg p-4 text-center"><p className="text-2xl font-bold">{stats.totalTransferidos}</p><p className="text-xs">Transferidos</p></div>
              <div className="border rounded-lg p-4 text-center"><p className="text-2xl font-bold">{stats.porSexo.M}</p><p className="text-xs">Homens</p></div>
              <div className="border rounded-lg p-4 text-center"><p className="text-2xl font-bold">{stats.porSexo.F}</p><p className="text-xs">Mulheres</p></div>
              <div className="border rounded-lg p-4 text-center"><p className="text-xs">Idade</p><p className="text-[11px]">Crianças:{stats.porIdade.crianca} Jovens:{stats.porIdade.jovem} Adultos:{stats.porIdade.adulto} Idosos:{stats.porIdade.idoso}</p></div>
            </div>
          </div>
        )}

        {aba==='batismo' && (
          <div>
            <h3 className="font-bold text-lg">Certificado de Batismo</h3>
            <div className="mt-3 no-print">
              <input value={buscaBatismo} onChange={buscarBatismo} placeholder="Pesquisar membro..." className="w-full border p-3 rounded-lg"/>
              {resBatismo.length>0 && <div className="border rounded mt-2">{resBatismo.map(r=><div key={r.id} onClick={()=>{setMembroBatismo(r); setResBatismo([])}} className="p-3 hover:bg-gray-100 cursor-pointer">{r.nome_completo}</div>)}</div>}
            </div>
            {membroBatismo && (
              <div className="mt-8 text-center border-2 border-[#0A3D26] p-8 rounded-xl">
                <img src={LOGO_URL} className="h-[60px] mx-auto"/>
                <h2 className="font-bold text-xl mt-4 text-[#0A3D26]">CERTIFICADO DE BATISMO</h2>
                <p className="mt-8 text-sm leading-relaxed">Certificamos que <b>{membroBatismo.nome_completo}</b>, filho de <b>{membroBatismo.filiacao_pai||'---'}</b> e <b>{membroBatismo.filiacao_mae||'---'}</b>, foi batizado em <b>{membroBatismo.data_batismo? new Date(membroBatismo.data_batismo).toLocaleDateString('pt-BR'):'---'}</b> em <b>{membroBatismo.local_batismo||'---'}</b>, sendo celebrante o Pastor <b>{membroBatismo.pastor_batismo||'---'}</b>.</p>
                <div className="mt-20"><div className="border-t border-black w-[250px] mx-auto"></div><p className="text-xs mt-2">Pastor Celebrante</p><p className="text-[10px] text-gray-500 mt-8">{new Date().toLocaleDateString('pt-BR')} - {new Date().toLocaleTimeString('pt-BR')}</p></div>
              </div>
            )}
          </div>
        )}

        {aba==='cartas' && (
          <div>
            <h3 className="font-bold text-lg">Relatório de Cartas de Transferência</h3>
            <input value={buscaCarta} onChange={e=>setBuscaCarta(e.target.value)} onKeyUp={buscarCartas} placeholder="Pesquisar por nome do membro ou igreja destino..." className="w-full border p-3 rounded-lg mt-3 no-print"/>
            <div className="mt-4 space-y-3">
              {cartas.map(c=>(
                <Link key={c.id} href={`/membros/relatorios/${c.id}`} className="block border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between"><b>{c.igreja_destino}</b><span className="text-xs">{new Date(c.data_emissao).toLocaleDateString('pt-BR')}</span></div>
                  <p className="text-xs text-gray-600 mt-1">Membros: {c.cartas_membros?.map(m=>m.nome_completo).join(', ')}</p>
                  <p className="text-xs text-gray-500">Forma: {c.forma_transferencia}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
