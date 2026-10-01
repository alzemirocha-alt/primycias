export const dynamic = 'force-dynamic'
export const revalidate = 0

import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSessionUser, getChurch } from "@/lib/auth"
import Link from "next/link"

export default async function ListaMembros() {
  const user = await getSessionUser()
  const church = await getChurch()

  if (!user) {
    return <div className="p-6">Não autenticado</div>
  }

  const { data: membros, error } = await supabaseAdmin
    .from('membros_oficial')
    .select('id, nome_completo, numero_rol, status, tipo_membro')
    .order('nome_completo')

  if (error) {
    return <div className="p-6">Erro ao carregar: {error.message}</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Membros - {membros?.length || 0} / 72
        </h1>
        <span className="text-sm text-gray-500">
          {church?.nome || ''}
        </span>
      </div>

      <div className="mb-4">
        <input
          id="busca"
          placeholder="Buscar por nome..."
          className="border p-2 w-full rounded"
        />
      </div>

      <div className="grid grid-cols-1 gap-2">
        {membros?.map((m) => (
          <Link
            key={m.id}
            href={`/membros/${m.id}`}
            className="border p-4 rounded hover:bg-gray-50 flex justify-between items-center bg-white"
          >
            <span className="font-medium">{m.nome_completo}</span>
            <span className="text-sm text-gray-500">
              Rol: {m.numero_rol ?? 'a definir'} • {m.status}
            </span>
          </Link>
        ))}
      </div>

      {(!membros || membros.length === 0) && (
        <p className="text-center text-gray-500 mt-8">Nenhum membro encontrado. Verifique a tabela membros_oficial.</p>
      )}
    </div>
  )
}
