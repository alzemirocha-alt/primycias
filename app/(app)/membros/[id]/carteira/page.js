import { supabaseAdmin } from "@/lib/supabaseAdmin"
export const dynamic = 'force-dynamic'

export default async function CarteiraPage({ params }) {
  const { id } = await params
  const { data: m, error } = await supabaseAdmin.from('membros_oficial').select('*').eq('id', id).single()
  if (error || !m) return <div className="p-10">Membro não encontrado: {id} - {error?.message}</div>
  
  const validacaoUrl = `https://primycias.vercel.app/validar/${m.id}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(validacaoUrl)}`

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between mb-6 print:hidden">
          <a href={`/membros/${id}`} className="text-sm text-blue-600 underline">← Voltar</a>
          <button onClick={()=>window.print()} className="bg-[#0F3A1F] text-white px-6 py-2 rounded">Imprimir</button>
        </div>
        <div className="flex justify-center">
          <div className="w-[340px] h-[216px] bg-white rounded-xl shadow-lg border overflow-hidden">
            <div className="bg-[#0F3A1F] text-white px-3 py-2 flex items-center gap-2 text-[11px]">
              <div className="w-7 h-7 bg-white text-[#0F3A1F] rounded-full flex items-center justify-center font-bold">IPB</div>
              <b>IPB Boa Viagem - Carteira</b>
              <img src={qrUrl} className="ml-auto w-9 h-9 bg-white p-0.5 rounded"/>
            </div>
            <div className="p-3 flex gap-3">
              <div className="w-[80px] h-[100px] bg-gray-200 rounded overflow-hidden">
                {m.foto_url && <img src={m.foto_url} className="w-full h-full object-cover"/>}
              </div>
              <div className="text-[11px]">
                <div className="font-bold text-[13px]">{m.nome_completo}</div>
                <div>Rol: {m.numero_rol || '---'}</div>
                <div>{m.categoria_membro || ''} {m.oficial_tipo? `• ${m.oficial_tipo}`:''}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
