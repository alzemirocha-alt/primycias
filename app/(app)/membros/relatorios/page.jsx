"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function RelatoriosPage(){
  const [busca, setBusca] = useState('')
  const [cartas, setCartas] = useState([])
  const [loading, setLoading] = useState(false)
  const [cartaAberta, setCartaAberta] = useState(null)
  const [membros, setMembros] = useState([])

  async function buscar(){
    setLoading(true)
    const { data } = await supabase
      .from('cartas_membros')
      .select('carta_id, nome_completo, cartas_transferencia(*)')
      .ilike('nome_completo', `%${busca}%`)
      .limit(20)
    
    const unicas = {}
    data?.forEach(d=>{
      if(d.cartas_transferencia) unicas[d.carta_id] = d.cartas_transferencia
    })
    setCartas(Object.values(unicas))
    setLoading(false)
  }

  async function abrirCarta(id){
    const { data: c } = await supabase.from('cartas_transferencia').select('*').eq('id', id).single()
    const { data: m } = await supabase.from('cartas_membros').select('*').eq('carta_id', id)
    setCartaAberta(c)
    setMembros(m || [])
    window.scrollTo(0,0)
  }

  useEffect(()=>{
    const params = new URLSearchParams(window.location.search)
    const id = params.get('carta')
    if(id) abrirCarta(id)
  },[])

  return (
    <div className="p-6 bg-white max-w-4xl mx-auto">
      <h1 className="font-bold text-xl mb-4 text-[#0A3D26]">Relatório de Cartas de Transferência</h1>
      <div className="flex gap-2 mb-4">
        <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar por nome ex: Alzemir" className="border p-2 rounded w-80" />
        <button onClick={buscar} className="bg-[#0A3D26] text-white px-6 rounded">Buscar</button>
      </div>

      {loading && <p>Carregando...</p>}
      {cartas.map(c=>(
        <div key={c.id} onClick={()=>abrirCarta(c.id)} className="border p-3 mb-2 cursor-pointer hover:bg-gray-100 rounded">
          <b>{c.igreja_destino}</b> - {new Date(c.data_emissao).toLocaleDateString('pt-BR')} - {c.id.slice(0,8)}
        </div>
      ))}

      {cartaAberta && (
        <div className="mt-8 border-t pt-8">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg">Carta - {cartaAberta.igreja_destino}</h2>
            <button onClick={()=>window.print()} className="bg-black text-white px-6 py-2 rounded">Imprimir PDF</button>
          </div>
          <p className="mt-4">Destino: {cartaAberta.igreja_destino}</p>
          <p>Data: {new Date(cartaAberta.data_emissao).toLocaleDateString('pt-BR')}</p>
          <h3 className="font-bold mt-4">Membros:</h3>
          <ol className="list-decimal ml-6 mt-2">
            {membros.map((m,i)=><li key={i} className="mb-3"><b>{m.nome_completo}</b> - {m.tipo_membro}<br/><span className="text-xs bg-gray-100 p-1 rounded">{m.forma_transferencia_individual}</span></li>)}
          </ol>
        </div>
      )}
    </div>
  )
}
