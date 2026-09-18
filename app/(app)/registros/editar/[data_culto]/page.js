import { supabaseAdmin } from "@/lib/supabaseAdmin"
import FormEditarRegistro from "./FormEditarRegistro"
export const dynamic = 'force-dynamic'

export default async function EditarPage({ params }) {
  const p = await params
  const param = p.data_culto

  const { data: culto } = await supabaseAdmin.from('cultos').select('id,data,periodo,motivo_erro').eq('id', param).maybeSingle()
  let cultoFinal = culto

  const { data: registros } = await supabaseAdmin.from('records').select('*').eq('culto_id', param)

  if (!cultoFinal && registros && registros.length > 0) {
    const { data: c2 } = await supabaseAdmin.from('cultos').select('id,data,periodo,motivo_erro').eq('id', registros[0].culto_id).maybeSingle()
    if (c2) cultoFinal = c2
    else cultoFinal = { id: registros[0].culto_id, data: registros[0].data_culto, periodo: registros[0].periodo, motivo_erro: registros[0].motivo_erro }
  }

  if (!cultoFinal) return <div className="p-6">Culto não encontrado: {param}</div>
  return <FormEditarRegistro registros={registros || []} data_culto={cultoFinal.data} culto={cultoFinal} />
}
