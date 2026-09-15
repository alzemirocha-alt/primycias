import { supabaseAdmin } from "@/lib/supabaseAdmin"
import FormEditarRegistro from "./FormEditarRegistro"

export default async function EditarPage({ params }) {
  const data_culto = params.data_culto
  const { data } = await supabaseAdmin.from('records').select('*').eq('data_culto', data_culto)
  return <FormEditarRegistro registros={data} data_culto={data_culto} />
}
