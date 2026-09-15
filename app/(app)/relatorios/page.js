import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSessionUser } from "@/lib/auth"
import FormRelatorio from "./FormRelatorio"

export default async function PageRelatorios(){
  const eu = await getSessionUser()

  // Só pega o que já foi VALIDADO pelo tesoureiro
  const { data: registros } = await supabaseAdmin
   .from('records')
   .select('id, data_culto, tipo, membro_nome, valor, status, diacono1_nome, diacono2_nome, tesoureiro_nome')
   .eq('status', 'validado')
   .order('data_culto', { ascending: false })

  return <FormRelatorio eu={eu} registros={registros || []} />
}
