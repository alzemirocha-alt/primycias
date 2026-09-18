import { supabaseAdmin } from "@/lib/supabaseAdmin"
import FormEditarRegistro from "./FormEditarRegistro"

export const dynamic = 'force-dynamic'

export default async function EditarPage({ params }) {
  const param = params.data_culto

  // 1. busca o culto direto - aqui já vem periodo = noite pro seu ID 498a51ff...
  const { data: culto } = await supabaseAdmin
    .from('cultos')
    .select('id,data,periodo,motivo_erro')
    .eq('id', param)
    .single()

  let cultoFinal = culto
  let cultoId = param

  // 2. fallback se vier um id de record antigo
  if (!cultoFinal) {
    const { data: r } = await supabaseAdmin
      .from('records')
      .select('culto_id,data_culto')
      .eq('id', param)
      .single()
    
    if (r?.culto_id) {
      cultoId = r.culto_id
      const { data: c2 } = await supabaseAdmin
        .from('cultos')
        .select('id,data,periodo,motivo_erro')
        .eq('id', r.culto_id)
        .single()
      cultoFinal = c2
    } else {
      const { data: r2 } = await supabaseAdmin
        .from('records')
        .select('culto_id,data_culto')
        .eq('culto_id', param)
        .limit(1)
        .single()
      
      if (r2) {
        cultoId = param
        const { data: c3 } = await supabaseAdmin
          .from('cultos')
          .select('id,data,periodo,motivo_erro')
          .eq('id', param)
          .single()
        cultoFinal = c3
      }
    }
  }

  if (!cultoFinal) {
    return <div className="p-6">Culto não encontrado: {param}</div>
  }

  const { data: registros } = await supabaseAdmin
    .from('records')
    .select('*')
    .eq('culto_id', cultoFinal.id)

  return <FormEditarRegistro registros={registros || []} data_culto={cultoFinal.data} culto={cultoFinal} />
}
