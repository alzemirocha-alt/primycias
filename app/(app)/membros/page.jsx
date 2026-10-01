javascript'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ListaMembros() {
  const [membros, setMembros] = useState([])
  const [busca, setBusca] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
       .from('membros_oficial')
       .select('id, nome_completo, numero_rol, foto_url, status, tipo_membro')
       .order('nome_completo')
      setMembros(data || [])
    }
    load()
  }, [])

  const filtrados = membros.filter(m =>
    m.nome_completo.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Membros - {filtrados.length} / 72</h1>
      <input
        placeholder="Buscar por nome..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        className="border p-2 w-full mb-4 rounded"
      />
      <div className="grid grid-cols-1 gap-3">
        {filtrados.map(m => (
          <Link key={m.id} href={`/membros/${m.id}`} className="border p-4 rounded hover:bg-gray-50 flex justify-between">
            <span>{m.nome_completo}</span>
            <span className="text-sm text-gray-500">Rol: {m.numero_rol?? 'a definir'} • {m.status}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
