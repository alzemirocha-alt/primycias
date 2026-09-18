import { supabaseAdmin } from "@/lib/supabaseAdmin"
import FormEditarRegistro from "./FormEditarRegistro"

export const dynamic = 'force-dynamic'

export default async function EditarPage({ params }) {
  // AGORA O PARAM É O ID DO CULTO, NÃO A DATA - assim separa manhã/noite
  const cultoId = params.id || params.culto_id || params.data_culto

  // Se for UUID (culto_id), busca só ele. Se for data antiga, mantém compatibilidade mas filtra por culto_id
  let registros = []
  let culto = null

  // tenta buscar como culto_id (caso correto)
  const { data: cultoData } = await supabaseAdmin.from('cultos').select('id, data, periodo, motivo_erro').eq('id', cultoId).single()
  
  if (cultoData) {
    culto = cultoData
    const { data } = await supabaseAdmin.from('records').select('*').eq('culto_id', cultoId)
    registros = data || []
  } else {
    // fallback rota antiga /editar/2026-09-17 -> busca por data mas ainda vai misturar, por isso use a rota por id
    const { data } = await supabaseAdmin.from('records').select('*').eq('data_culto', cultoId)
    registros = data || []
  }

  return <FormEditarRegistro registros={registros} data_culto={culto?.data || cultoId} culto={culto} />
}
