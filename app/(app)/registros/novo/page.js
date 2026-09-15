import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import FormNovo from "./FormNovoRegistro"

export default async function NovoPage() {
  const eu = await getSessionUser()
  const { data: users } = await supabaseAdmin.from('users').select('id,nome,oficio,funcao')

  const diaconosValidos = (users || []).filter(u => {
    const oficio = (u.oficio || '').toLowerCase()
    const funcao = (u.funcao || '').toLowerCase()
    const nome = (u.nome || '').toLowerCase()
    const isTesoureiro = funcao === 'tesoureiro' || oficio === 'tesoureiro' || nome.includes('gilson')
    const isDiacono = oficio === 'diacono'
    const isPresbitero = oficio === 'presbitero' || nome.includes('alzemir') || nome.includes('jairo magero') || nome.includes('nilo da silva')
    const isPastor = oficio === 'pastor' || nome.includes('glaucio')
    return isDiacono &&!isTesoureiro &&!isPresbitero &&!isPastor
  })

  const diaconosParaEscolher = diaconosValidos.filter(d => d.id!== eu.id)

  const { data: ultimo } = await supabaseAdmin.from('records').select('data_culto, primeiro_diacono_id, segundo_diacono_id').order('data_culto', { ascending: false }).limit(1)

  // === CORREÇÃO: LÊ QUEM O PASTOR LIBEROU ===
  const { data: liberados } = await supabaseAdmin.from('liberacoes_diaconos').select('diacono_id')
  const idsLiberados = (liberados||[]).map(l=>l.diacono_id)

  let bloqueadosIds = ultimo?.[0]? [ultimo[0].primeiro_diacono_id, ultimo[0].segundo_diacono_id].filter(Boolean) : []
  // TIRA DA LISTA DE BLOQUEADOS QUEM O PASTOR LIBEROU (genérico pra qualquer diácono)
  bloqueadosIds = bloqueadosIds.filter(id =>!idsLiberados.includes(id))

  const { data: datas } = await supabaseAdmin.from('records').select('data_culto')
  const datasBloqueadas = datas?.map(d => d.data_culto) || []

  return <FormNovo eu={eu} diaconos={diaconosParaEscolher} todosDiaconos={diaconosValidos} bloqueadosIds={bloqueadosIds} datasBloqueadas={datasBloqueadas} ultimoCulto={ultimo?.[0]} liberadosIds={idsLiberados} />
}
