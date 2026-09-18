import { supabaseAdmin } from "@/lib/supabaseAdmin"
import FormEditarRegistro from "./FormEditarRegistro"

export const dynamic = 'force-dynamic'

export default async function EditarPage({ params }) {
  const p = await params // Next 15 precisa disso
  const param = p.data_culto

  // 1. tenta direto como culto_id
  const { data: culto } = await supabaseAdmin
   .from('cultos')
   .select('id,data,periodo,motivo_erro')
   .eq('id', param)
   .maybeSingle()

  let cultoFinal = culto
  let cultoId = culto?.id || param

  // 2. busca os registros DESSE culto_id primeiro (prova que existe)
  const { data: registros } = await supabaseAdmin
   .from('records')
   .select('*')
   .eq('culto_id', param)

  // 3. se não achou culto mas achou registros, pega o culto pelo registros[0].culto_id
  if (!cultoFinal && registros && registros.length > 0) {
    const { data: c2 } = await supabaseAdmin
     .from('cultos')
     .select('id,data,periodo,motivo_erro')
     .eq('id', registros[0].culto_id)
     .maybeSingle()
    if (c2) {
      cultoFinal = c2
      cultoId = c2.id
    } else {
      // último fallback: cria objeto com o periodo que já está no banco (noite)
      cultoFinal = {
        id: registros[0].culto_id,
        data: registros[0].data_culto,
        periodo: 'noite',
        motivo_erro: registros[0].motivo_erro
      }
    }
  }

  if (!cultoFinal) {
    return <div className="p-6">Culto não encontrado: {param} - Nenhum registro com culto_id={param}</div>
  }

  return <FormEditarRegistro registros={registros || []} data_culto={cultoFinal.data} culto={cultoFinal} />
}
