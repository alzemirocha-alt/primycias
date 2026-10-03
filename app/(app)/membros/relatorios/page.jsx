"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function RelatoriosPage(){
  const [cartas, setCartas] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartaAberta, setCartaAberta] = useState(null)
  const [membros, setMembros] = useState([])
  const [busca, setBusca] = useState('')

  async function carregarTodas(){
    setLoading(true)
    const { data } = await supabase.from('cartas_transferencia').select('*').order('data_emissao', {ascending:false}).limit(100)
    setCartas(data||[])
    setLoading(false)
  }

  async function abrirCarta(id){
    const { data: c } = await supabase.from('cartas_transferencia').select('*').eq('id', id).single()
    const { data: m } = await supabase.from('cartas_membros').select('*').eq('carta_id', id)
    setCartaAberta(c)
    setMembros(m||[])
  }

  useEffect(()=>{ carregarTodas() },[])
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search)
    const id = params.get('carta')
    if(id) abrirCarta(id)
  },[])

  const filtradas = cartas.filter(c=> c.igreja_destino?.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-[#0A3D26]">Relatórios</h1>
      <div className="bg-white border rounded-xl p-6 mt-4">
        <div className="flex justify-between mb-4">
          <h2 className="font-bold">Cartas de Transferência</h2>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Filtrar..." className="border p-2 rounded text-sm w-64" />
        </div>
        {loading ? <p>Carregando...</p> : filtradas.map(c=>(
          <div key={c.id} onClick={()=>abrirCarta(c.id)} className="border p-3 mb-2 rounded hover:bg-gray-50 cursor-pointer flex justify-between">
            <div><b>{c.igreja_destino}</b><div className="text-xs text-gray-500">{new Date(c.data_emissao).toLocaleDateString('pt-BR')}</div></div>
            <span className="text-xs bg-[#0A3D26] text-white px-3 py-1 rounded h-fit">Ver</span>
          </div>
        ))}
      </div>

      {cartaAberta && (
        <div className="mt-8 bg-white border rounded-xl p-8">
          <div className="flex justify-between border-b pb-4">
            <b>Igreja Presbiteriana de Sucupira - Carta de Transferência</b>
            <button onClick={()=>window.print()} className="bg-black text-white px-4 py-1 rounded text-sm">Imprimir PDF</button>
          </div>
          <p className="mt-4 text-sm"><b>Destino:</b> {cartaAberta.igreja_destino}</p>
          <p className="text-sm"><b>Data:</b> {new Date(cartaAberta.data_emissao).toLocaleDateString('pt-BR')}</p>
          <h3 className="font-bold mt-4">Membros:</h3>
          <ol className="list-decimal ml-6 mt-2">
            {membros.map((m,i)=><li key={i} className="text-sm mb-2"><b>{m.nome_completo}</b> - {m.tipo_membro}<br/><span className="text-xs italic">{m.forma_transferencia_individual}</span></li>)}
          </ol>
        </div>
      )}
    </div>
  )
}
