import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import FormNovo from "./FormNovoRegistro"

export default async function NovoPage() {
  const eu = await getSessionUser()

  // TRAVA 2: Tira tesoureiro da lista de diáconos
  const { data: users } = await supabaseAdmin.from('users').select('id,nome,oficio,funcao')
  const diaconosValidos = (users || []).filter(u => {
    const isTes = u.funcao === 'tesoureiro' || u.oficio === 'tesoureiro' || u.nome.toLowerCase().includes('gilson')
    return!isTes
  })

  // TRAVA 3: Pega último culto para saber quem está bloqueado
  const { data: ultimo } = await supabaseAdmin.from('records').select('data_culto, primeiro_diacono_id, segundo_diacono_id').order('data_culto', { ascending: false }).limit(1)
  const bloqueadosIds = ultimo?.[0]? [ultimo[0].primeiro_diacono_id, ultimo[0].segundo_diacono_id].filter(Boolean) : []

  const { data: datas } = await supabaseAdmin.from('records').select('data_culto')
  const datasBloqueadas = datas?.map(d => d.data_culto) || []

  return <FormNovo
    eu={eu}
    diaconos={diaconosValidos.filter(d => d.id!== eu.id)}
    todosDiaconos={diaconosValidos}
    bloqueadosIds={bloqueadosIds}
    datasBloqueadas={datasBloqueadas}
    ultimoCulto={ultimo?.[0]}
  />
}
