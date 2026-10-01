'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ListaMembros() {
  const [membros, setMembros] = useState([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('membros_oficial')
        .select('id, nome_completo, numero_rol, foto_url, status, tipo_membro')
        .order('nome_completo')
      
      if (error) {
        console.error(error)
      } else {
        setMembros(data || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtrados = membros.filter(m =>
    m.nome_completo.toLowerCase().includes(busca.toLowerCase())
  )

  if (loading) {
    return <div className="p-6">Carregando 72 membros...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Membros - {filtrados.length} / 72</h1>
        <span className="text-sm text-gray-500">Pastor fora da contagem</span>
      </div>

      <input
        placeholder="Buscar por nome..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        className="border p-2 w-full mb-4 rounded"
      />

      <div className="grid grid-cols-1 gap-3">
        {filtrados.map(m => (
          <Link 
            key={m.id} 
            href={`/membros/${m.id}`} 
            className="border p-4 rounded hover:bg-gray-50 flex justify-between items-center"
          >
            <div className="flex items-center gap-3">
              <img 
                src={m.foto_url || '/avatar.png'} 
                className="w-10 h-10 rounded-full object-cover bg-gray-200" 
                alt=""
              />
              <span className="font-medium">{m.nome_completo}</span>
            </div>
            <span className="text-sm text-gray-500">
              Rol: {m.numero_rol ?? 'a definir'} • {m.status}
            </span>
          </Link>
        ))}
      </div>

      {filtrados.length === 0 && (
        <p className="text-center text-gray-500 mt-8">Nenhum membro encontrado.</p>
      )}
    </div>
  )
}
