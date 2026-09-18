import { supabaseAdmin } from "@/lib/supabaseAdmin"
import FormEditarRegistro from "./FormEditarRegistro"

export const dynamic = 'force-dynamic'

export default async function EditarPage({ params }) {
  const param = params.data_culto

  let culto = null
  let cultoIdReal = param

  // 1. tenta como ID da tabela cultos
  const { data: c1 } = await supabaseAdmin.from('cultos').select('id,data,periodo,motivo_erro').eq('id', param).single()
  if (c1) {
    culto = c1
    cultoIdReal = c1.id
  } else {
    // 2. tenta como ID da tabela records (é o que vem do seu RegistroBotoes com culto.id)
    const { data: r } = await supabaseAdmin.from('records').select('culto_id,data_culto').eq('id', param).single()
    if (r?.culto_id) {
      cultoIdReal = r.culto_id
      const { data: c2 } = await supabaseAdmin.from('cultos').select('id,data,periodo,motivo_erro').eq('id', r.culto_id).single()
      culto = c2
      if (!culto) {
        // se não tem na tabela cultos (registro antigo), cria objeto culto fake só com a data
        culto = { id: r.culto_id, data: r.data_culto, periodo: 'manha', motivo_erro: null }
      }
    } else {
      // 3. tenta como culto_id direto nos records
      const { data: r2 } = await supabaseAdmin.from('records').select('culto_id,data_culto').eq('culto_id', param).limit(1).single()
      if (r2) {
        cultoIdReal = param
        const { data: c3 } = await supabaseAdmin.from('cultos').select('id,data,periodo,motivo_erro').eq('id', param).single()
        culto = c3 || { id: param, data: r2.data_culto, periodo: 'manha', motivo_erro: null }
      }
    }
  }

  if (!cultoIdReal) {
    return <div className="p-6">Culto não encontrado: {param}</div>
  }

  // AGORA SIM - busca SÓ desse culto_id, separa manhã/noite
  const { data: registros } = await supabaseAdmin.from('records').select('*').eq('culto_id', cultoIdReal)

  return <FormEditarRegistro registros={registros || []} data_culto={culto?.data} culto={culto} />
}
