import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import FormNovo from "./FormNovoRegistro"

export default async function NovoPage() {
  try {
    const eu = await getSessionUser()
    if (!eu?.id) {
      return <div className="p-6">Sessão expirada. Faça login novamente.</div>
    }

    const { data: users } = await supabaseAdmin.from('users').select('id,nome,oficio,funcao').limit(100)

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

    let ultimo = null
    try {
      const res = await supabaseAdmin.from('records').select('data_culto, primeiro_diacono_id, segundo_diacono_id').order('data_culto', { ascending: false }).limit(1)
      ultimo = res.data?.[0] || null
    } catch {}

    // LÊ QUEM O PASTOR LIBEROU - se não existir tabela, não quebra
    let idsLiberados = []
    try {
      const { data: liberados } = await supabaseAdmin.from('liberacoes_diaconos').select('diacono_id')
      idsLiberados = (liberados || []).map(l => l.diacono_id).filter(Boolean)
    } catch { idsLiberados = [] }

    let bloqueadosIds = ultimo? [ultimo.primeiro_diacono_id, ultimo.segundo_diacono_id].filter(Boolean) : []
    bloqueadosIds = bloqueadosIds.filter(id =>!idsLiberados.includes(id))

    let datasBloqueadas = []
    try {
      const { data: datas } = await supabaseAdmin.from('records').select('data_culto')
      datasBloqueadas = datas?.map(d => d.data_culto) || []
    } catch {}

    return <FormNovo
      eu={eu}
      diaconos={diaconosParaEscolher || []}
      todosDiaconos={diaconosValidos || []}
      bloqueadosIds={bloqueadosIds || []}
      datasBloqueadas={datasBloqueadas || []}
      ultimoCulto={ultimo}
      liberadosIds={idsLiberados || []}
    />
  } catch (e) {
    console.error("Erro NovoPage:", e)
    return <div className="p-6 text-sm text-red-600">Erro ao carregar página de registros: {String(e?.message || e)}. Tente recarregar.</div>
  }
}
