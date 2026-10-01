import { supabaseAdmin } from "@/lib/supabaseAdmin"
export const dynamic = 'force-dynamic'
export default async function Validar({ params }){
  const { id } = await params
  const { data: m } = await supabaseAdmin.from('membros_oficial').select('*').eq('id', id).single()
  if(!m) return <div className="min-h-screen grid place-items-center bg-red-50">❌ Inválida: {id}</div>
  return <div className="min-h-screen grid place-items-center bg-green-50 p-6"><div className="bg-white border-2 border-green-600 rounded-xl p-6 text-center"><div className="text-green-700 font-bold">✅ Carteira Válida</div><div className="font-bold mt-2">{m.nome_completo}</div><div className="text-sm">{m.numero_rol}</div></div></div>
}
