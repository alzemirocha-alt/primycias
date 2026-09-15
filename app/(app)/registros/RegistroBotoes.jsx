"use client"
import { confirmarRegistro, validarRegistro, devolverRegistro, excluirRegistro } from "./actions"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function RegistroBotoes({ culto, eu, isTesoureiro }) {
  const [motivo, setMotivo] = useState('')
  const router = useRouter()
  const isSegundo = culto.segundo_diacono_id === eu.id
  const isPrimeiro = culto.primeiro_diacono_id === eu.id || culto.diacono_id === eu.id

  if (culto.status === 'aguardando_segundo_diacono' && isSegundo) {
    return (
      <div className="flex gap-2 flex-col">
        <div className="flex gap-2">
          <button onClick={() => confirmarRegistro(culto.id)} className="bg-green-700 text-white px-4 py-2 rounded font-bold flex-1">✓ Confirmar e enviar p/ Tesoureiro</button>
        </div>
        <div className="flex gap-2">
          <input value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Motivo do erro" className="border p-2 rounded flex-1 text-sm" />
          <button onClick={() => devolverRegistro(culto.id, motivo)} className="bg-red-600 text-white px-3 py-2 rounded">Devolver</button>
        </div>
      </div>
    )
  }

  if (culto.status === 'aguardando_tesoureiro' && isTesoureiro) {
    return (
      <div className="flex gap-2 flex-col">
        <button onClick={() => validarRegistro(culto.id)} className="bg-blue-700 text-white px-4 py-2 rounded font-bold">✓ Validar como Tesoureiro</button>
        <div className="flex gap-2">
          <input value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Motivo do erro" className="border p-2 rounded flex-1 text-sm" />
          <button onClick={() => devolverRegistro(culto.id, motivo)} className="bg-red-600 text-white px-3 py-2 rounded">Devolver com erro</button>
        </div>
      </div>
    )
  }

  if (culto.status === 'devolvido_com_erro' && isPrimeiro) {
    return (
      <div className="flex gap-2">
        <button onClick={() => router.push(`/registros/editar/${culto.data_culto}`)} className="bg-orange-500 text-white px-4 py-2 rounded font-bold flex-1">✏️ Corrigir - Editar valores</button>
        <button onClick={() => { if(confirm('Excluir definitivamente?')) excluirRegistro(culto.id) }} className="bg-red-700 text-white px-4 py-2 rounded">🗑️ Excluir</button>
      </div>
    )
  }

  return null
}
