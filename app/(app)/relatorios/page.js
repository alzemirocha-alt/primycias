import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSessionUser } from "@/lib/auth"
import FormRelatorio from "./FormRelatorio"

export default async function PageRelatorios(){
  const eu = await getSessionUser()

  // Só validados pelo tesoureiro
  const { data: registros } = await supabaseAdmin
  .from('records')
  .select('*')
  .eq('status', 'validado')
  .order('data_culto', { ascending: true })

  // Busca dados da igreja (se não tiver usa o da foto)
  let igreja = null
  try{
    const { data } = await supabaseAdmin.from('church_settings').select('*').limit(1).single()
    igreja = data
  }catch{}
  if(!igreja){
    try{
      const { data } = await supabaseAdmin.from('dados_igreja').select('*').limit(1).single()
      igreja = data
    }catch{}
  }

  return <FormRelatorio eu={eu} registros={registros || []} igreja={igreja} />
}
