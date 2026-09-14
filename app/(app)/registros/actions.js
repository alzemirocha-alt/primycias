import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import Link from "next/link"
import { confirmarSegundoDiaconoAction, validarTesoureiroAction, excluirRegistroAction, reportarErroAction } from "./actions"

export default async function RegistrosPage() {
  const me = await getSessionUser()
  const { data: registros } = await supabaseAdmin
    .from("records")
    .select("*")
    .eq("igreja_id", me.igreja_id)
    .order("created_at", { ascending: false })

  if (!registros || registros.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">Registros</h1>
        <p className="mt-4">Ainda não tem nenhum? Vai em /registros/novo e lança. Você já tem 1 no banco.</p>
        <Link href="/registros/novo" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded">Novo Lançamento</Link>
        <pre className="mt-4 bg-gray-100 p-2 text-xs">Debug: igreja_id={me.igreja_id} cargo={me.cargo} total={registros?.length}</pre>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between">
        <h1 className="text-xl font-bold">Registros ({registros.length})</h1>
        <Link href="/registros/novo" className="bg-blue-600 text-white px-4 py-2 rounded">+ Novo</Link>
      </div>

      {registros.map(r => (
        <div key={r.id} className="border p-4 rounded bg-white">
          <div className="flex justify-between">
            <div>
              <p className="font-bold">{r.tipo} - R$ {r.valor} - {r.membro_nome}</p>
              <p className="text-sm text-gray-500">Status: {r.status} | {new Date(r.created_at).toLocaleString('pt-BR')}</p>
              <p className="text-xs">ID: {r.id.slice(0,8)}</p>
            </div>
            <div className="flex gap-2">
              {r.status === 'aguardando_segundo_diacono' && me.cargo !== 'pastor' && (
                <form action={confirmarSegundoDiaconoAction.bind(null, r.id)}>
                  <button className="bg-green-600 text-white px-3 py-1 rounded text-sm">Sou 2º Diácono - Confirmar</button>
                </form>
              )}
              {r.status === 'aguardando_tesoureiro' && (me.cargo === 'tesoureiro' || me.cargo === 'admin') && (
                <form action={validarTesoureiroAction.bind(null, r.id)}>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Validar (Tesoureiro)</button>
                </form>
              )}
              <form action={excluirRegistroAction.bind(null, r.id)}>
                <button className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm">Excluir</button>
              </form>
            </div>
          </div>
          {/* SIGILO: Pastor só vê depois de validado */}
          {me.cargo === 'pastor' && r.status !== 'validado' && (
            <p className="text-xs text-orange-600 mt-2">🔒 Pastor: valor oculto até tesoureiro validar. Status atual: {r.status}</p>
          )}
        </div>
      ))}
    </div>
  )
}
