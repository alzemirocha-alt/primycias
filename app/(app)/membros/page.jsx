export const dynamic = 'force-dynamic'
export const revalidate = 0

import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSessionUser, getChurch } from "@/lib/auth"
import { isAdmin } from "@/lib/constants"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function ListaMembros({ searchParams }) {
  const user = await getSessionUser()
  const church = await getChurch()

  if (!user) {
    return <div className="p-6">Não autenticado</div>
  }

  // TRAVA DE SEGURANÇA: só Pastor e Secretário
  const funcaoPresb = (user.funcao_presbitero || '').toLowerCase()
  const isSecretario = funcaoPresb.includes('secretario')
  if (!isAdmin(user) && !isSecretario) {
    redirect("/dashboard")
  }

  const q = searchParams?.q || ""

  let query = supabaseAdmin
    .from('membros_oficial')
    .select('id, nome_completo, numero_rol, status, tipo_membro')
    .order('nome_completo')

  if (q) {
    query = query.ilike('nome_completo', `%${q}%`)
  }

  const { data: membros, error } = await query

  if (error) {
    return <div className="p-6">Erro ao carregar: {error.message}</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Membros - {membros?.length || 0} / 72
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden md:block">
            {church?.nome || ''}
          </span>
          <Link href="/membros/novo" className="px-4 py-2 bg-[#0F3A1F] text-white text-sm rounded">
            + Novo Membro
          </Link>
        </div>
      </div>

      <form className="flex gap-2 mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome..."
          className="border p-2 w-full rounded text-sm"
        />
        <button className="border px-4 rounded text-sm bg-white">Buscar</button>
      </form>

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
        <p className="text-center text-gray-500 mt-8">Nenhum membro encontrado para "{q}".</p>
      )}
    </div>
  )
}
