import { createClient } from "@supabase/supabase-js"
export const dynamic = 'force-dynamic'

export default async function ValidarPage({ params }) {
  const { id } = await params
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data: m } = await supabase.from('membros_oficial').select('*').eq('id', id).single()

  if (!m) return <div className="min-h-screen flex items-center justify-center bg-red-50"><div className="bg-white p-8 rounded border-2 border-red-400 text-center">❌ Carteira Inválida<br/><span className="text-xs">{id}</span></div></div>

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-6">
      <div className="bg-white border-2 border-green-600 rounded-xl p-6 max-w-sm w-full text-center">
        <div className="font-bold text-green-700 text-lg">✅ Carteira Válida</div>
        <div className="font-bold mt-2">{m.nome_completo}</div>
        <div className="text-sm text-gray-600">{m.categoria_membro} {m.oficial_tipo? `• ${m.oficial_tipo}`:''}</div>
        <div className="text-xs mt-2">Rol: {m.numero_rol || 'a definir'} • Status: {m.status}</div>
        <div className="text-[10px] text-gray-400 mt-4">Validado em {new Date().toLocaleString('pt-BR')} - primycias.vercel.app</div>
      </div>
    </div>
  )
}
