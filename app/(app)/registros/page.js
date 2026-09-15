import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import FormNovoRegistro from "./FormNovoRegistro"

export default async function NovoPage() {
  const eu = await getSessionUser()
  const { data: diaconos } = await supabaseAdmin.from('users').select('id, nome').eq('oficio', 'diacono').neq('id', eu.id)
  return <FormNovoRegistro diaconos={diaconos} />
}
