import { supabaseAdmin } from "@/lib/supabaseAdmin"
import FormEditarRegistro from "./FormEditarRegistro"

export const dynamic = 'force-dynamic'

export default async function EditarPage({ params }) {
  const cultoId = params.data_culto // na sua pasta o param chama data_culto, mas agora vem o ID

  // 1. TENTA COMO ID (CASO CORRETO - SEPARA MANHÃ/NOITE)
  const { data: culto } = await supabaseAdmin.from('cultos').select('id, data, periodo, motivo_erro').eq('id', cultoId).single()
  
  if (culto) {
    const { data: registros } = await supabaseAdmin.from('records').select('*').eq('culto_id', cultoId)
    return <FormEditarRegistro registros={registros || []} data_culto={culto.data} culto={culto} />
  }

  // 2. SE CAIU AQUI É LINK ANTIGO COM DATA (2026-09-18) - NÃO TEM COMO SEPARAR, AVISA
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="font-bold">Link antigo</h1>
      <p className="mt-2">Esse link usa só a data ({cultoId}) e junta manhã + noite. Volte em /registros e clique novamente em <b>Corrigir</b> para abrir só o culto correto.</p>
      <a href="/registros" className="mt-4 inline-block bg-green-700 text-white px-4 py-2 rounded">Voltar</a>
    </div>
  )
}
