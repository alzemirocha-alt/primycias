'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function Carta({ searchParams }) {
  const id = searchParams?.carta
  const [carta, setCarta] = useState(null)
  const [membros, setMembros] = useState([])

  useEffect(()=> {
    async function load(){
      const { data: c } = await supabase.from('cartas_transferencia').select('*').eq('id', id).single()
      const { data: m } = await supabase.from('cartas_membros').select('*').eq('carta_id', id)
      setCarta(c); setMembros(m||[])
    }
    if(id) load()
  }, [id])

  if(!carta) return <div>Carregando...</div>

  return (
    <div className="p-8 bg-white">
      {/* CABEÇALHO */}
      <div className="flex items-center gap-4 border-b pb-4">
        <img src="/logo-ipb.png" className="w-16" />
        <div>
          <h1 className="font-bold text-lg">Igreja Presbiteriana de Sucupira</h1>
          <p className="text-sm">Carta de Transferência - {carta.data_emissao}</p>
        </div>
      </div>

      <h2 className="font-bold mt-6">Carta de Transferência</h2>
      <p>Destino: {carta.igreja_destino}</p>
      <p>Data: {new Date(carta.data_emissao).toLocaleDateString('pt-BR')}</p>

      <h3 className="font-bold mt-6">Membros:</h3>
      <ol className="list-decimal ml-6 mt-2">
        {membros.map((m,i)=>(
          <li key={i} className="mb-2">
            <b>{m.nome_completo}</b> - {m.tipo_membro}<br/>
            <span className="text-sm">{m.forma_transferencia_individual}</span>
          </li>
        ))}
      </ol>

      <div className="mt-20">
        <p>Local e data: _______, {new Date().toLocaleDateString('pt-BR')}</p>
        <p className="mt-16 border-t w-64 pt-2">Secretário do Conselho</p>
        <p className="mt-8 border-t w-64 pt-2">Pastor</p>
      </div>

      <button onClick={()=>window.print()} className="mt-8 bg-black text-white px-6 py-2 rounded">Imprimir PDF</button>
    </div>
  )
}
