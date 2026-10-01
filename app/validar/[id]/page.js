import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const dynamic = 'force-dynamic'

export default async function ValidarPage({ params }) {
  const { id } = await params
  const { data: m } = await supabaseAdmin.from('membros_oficial').select('*').eq('id', id).single()

  if (!m) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
        <div className="bg-white border-2 border-red-300 rounded-xl p-8 max-w-sm text-center">
          <div className="text-4xl mb-2">❌</div>
          <h1 className="font-bold text-red-700">Carteira Inválida</h1>
          <p className="text-sm mt-2">Membro não encontrado ou carteira falsificada.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-6">
      <div className="bg-white border-2 border-green-600 rounded-xl p-6 max-w-sm w-full">
        <div className="text-center">
          <div className="w-12 h-12 bg-[#0F3A1F] text-white rounded-full flex items-center justify-center mx-auto font-bold">IPB</div>
          <h1 className="font-bold text-[#0F3A1F] mt-2">Carteira Válida ✅</h1>
          <p className="text-xs text-gray-500">Igreja Presbiteriana de Boa Viagem - Recife/PE</p>
        </div>
        <div className="mt-4 flex gap-3">
          <div className="w-[70px] h-[90px] bg-gray-200 rounded overflow-hidden">
            {m.foto_url? <img src={m.foto_url} className="w-full h-full object-cover" /> : null}
          </div>
          <div className="text-sm">
            <div className="font-bold">{m.nome_completo}</div>
            <div className="text-xs text-gray-600">Rol: {m.numero_rol || 'a definir'}</div>
            <div className="text-xs">{m.categoria_membro || m.tipo_membro} {m.oficial_tipo? `• ${m.oficial_tipo}` : ''}</div>
            <div className="text-xs mt-1">Status: <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">{m.status}</span></div>
          </div>
        </div>
        <div className="mt-4 text-[10px] text-gray-500 border-t pt-2">
          Validação realizada em {new Date().toLocaleString('pt-BR')}<br/>
          ID: {m.id}<br/>
          Este documento comprova vínculo regular com a IPB.
        </div>
      </div>
    </div>
  )
}
