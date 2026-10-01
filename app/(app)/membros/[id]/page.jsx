import { createClient } from "@supabase/supabase-js"
import Link from "next/link"

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const key = serviceKey || anonKey

  if (!url ||!key) {
    throw new Error("Falta ENV na Vercel")
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function MembroDetalhePage({ params }) {
  const { id } = await params
  const supabase = getSupabase()

  // tenta membros_oficial primeiro
  let { data: membro } = await supabase
   .from("membros_oficial")
   .select("*")
   .eq("id", id)
   .single()

  // se não achou, tenta membros
  if (!membro) {
    const { data } = await supabase.from("membros").select("*").eq("id", id).single()
    membro = data
  }

  if (!membro) {
    return (
      <div className="p-10">
        <h1 className="font-bold">Membro não encontrado</h1>
        <p className="text-sm mt-2">ID: {id}</p>
        <p className="text-sm mt-2">Verifique se o RLS está desabilitado:</p>
        <code className="text-xs bg-gray-100 p-2 block mt-2">
          ALTER TABLE membros_oficial DISABLE ROW LEVEL SECURITY;
        </code>
        <Link href="/membros" className="text-blue-600 underline text-sm mt-4 block">Voltar para membros</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/membros" className="text-sm text-blue-600 underline">← Voltar</Link>

        <div className="mt-6 bg-white rounded-xl shadow border p-6">
          <div className="flex gap-6">
            <div className="w-24 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              {membro.foto_url? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={membro.foto_url} alt={membro.nome_completo} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-xs text-gray-500">Sem foto</div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-[#0F3A1F]">{membro.nome_completo}</h1>
              <p className="text-sm text-gray-600 mt-1">Rol: {membro.numero_rol || "---"}</p>
              <p className="text-sm text-gray-600">CPF: {membro.cpf || "---"}</p>
              <p className="text-sm text-gray-600">Categoria: {membro.categoria_membro || membro.tipo_membro || "Membro"}</p>
              {membro.oficial_tipo && <p className="text-sm text-gray-600">Oficial: {membro.oficial_tipo}</p>}
              <p className="text-xs text-gray-400 mt-2">ID: {membro.id}</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <Link
              href={`/membros/${membro.id}/carteira`}
              className="bg-[#0F3A1F] text-white text-center py-3 rounded-lg text-sm font-bold hover:opacity-90"
            >
              Emitir Carteira
            </Link>
            <Link
              href={`/validar/${membro.id}`}
              className="bg-white border text-center py-3 rounded-lg text-sm font-bold"
            >
              Validar QR
            </Link>
          </div>

          <div className="mt-8 border-t pt-4">
            <h3 className="font-bold text-sm mb-2">Dados completos</h3>
            <pre className="text-[11px] bg-gray-50 p-3 rounded overflow-auto">
              {JSON.stringify(membro, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
