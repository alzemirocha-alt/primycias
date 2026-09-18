import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import FormNovo from "./FormNovoRegistro"

export const dynamic = 'force-dynamic'

export default async function NovoPage() {
  try {
    const eu = await getSessionUser()
    if (!eu?.id) {
      return <div className="p-6">Sessão expirada. Faça login novamente.</div>
    }

    let igrejaId = eu?.igreja_id
    let euCompleto = null
    try {
      const { data } = await supabaseAdmin.from('users').select('id,igreja_id,nome,oficio,funcao,funcao_presbitero').eq('id', eu.id).single()
      euCompleto = data
      igrejaId = data?.igreja_id || igrejaId
    } catch {
      try {
        const { data: data2 } = await supabaseAdmin.from('users').select('id,igreja_id,nome,oficio,funcao').eq('id', eu.id).single()
        euCompleto = data2
        igrejaId = data2?.igreja_id || igrejaId
      } catch {}
    }

    if(!igrejaId) return <div className="p-6">Usuário sem igreja_id vinculada.</div>

    let users = []
    try {
      const { data } = await supabaseAdmin.from('users').select('id,nome,oficio,funcao,funcao_presbitero,igreja_id').eq('igreja_id', igrejaId).limit(100)
      users = data || []
    } catch {
      try {
        const { data: data2 } = await supabaseAdmin.from('users').select('id,nome,oficio,funcao,igreja_id').eq('igreja_id', igrejaId).limit(100)
        users = data2 || []
      } catch { users = [] }
    }

    const diaconosValidos = (users || []).filter(u => {
      const oficio = (u.oficio || '').toLowerCase().trim()
      const funcao = (u.funcao || '').toLowerCase().trim()
      const funcaoPresb = (u.funcao_presbitero || '').toLowerCase().trim()
      const isTesoureiro = funcao === 'tesoureiro' || oficio === 'tesoureiro'
      const isPresbitero = oficio === 'presbitero' || oficio === 'presbítero' || funcaoPresb!== ''
      const isPastor = oficio === 'pastor'
      const isDiacono = oficio === 'diacono' || oficio === 'diácono'
      return isDiacono &&!isTesoureiro &&!isPresbitero &&!isPastor
    })

    const diaconosParaEscolher = diaconosValidos.filter(d => d.id!== eu.id)

    let cultosAbertos = []
    try {
      const { data, error } = await supabaseAdmin.from('cultos').select('id, data, periodo, status').eq('igreja_id', igrejaId).eq('status', 'aberto').order('data', { ascending: true }).order('periodo', { ascending: true })
      if(!error) cultosAbertos = data || []
    } catch (e) {
      console.error("Erro cultos abertos:", e?.message)
      cultosAbertos = []
    }

    let ultimo = null
    try {
      const res = await supabaseAdmin.from('records').select('data_culto, culto_id, primeiro_diacono_id, segundo_diacono_id').eq('igreja_id', igrejaId).order('created_at', { ascending: false }).limit(1)
      ultimo = res.data?.[0] || null
    } catch {}

    let idsLiberados = []
    try {
      const { data: liberados, error } = await supabaseAdmin.from('liberacoes_diaconos').select('diacono_id').eq('igreja_id', igrejaId)
      if (error) throw error
      idsLiberados = (liberados || []).map(l => l.diacono_id).filter(Boolean)
    } catch {
      try {
        const { data: liberados2 } = await supabaseAdmin.from('liberacoes_diaconos').select('diacono_id')
        idsLiberados = (liberados2 || []).map(l => l.diacono_id).filter(Boolean)
      } catch { idsLiberados = [] }
    }

    // TRAVA CORRIGIDA: os 2 diáconos do último registro ficam bloqueados (manhã/noite mesmo dia inclusive)
    let bloqueadosIds = ultimo? [ultimo.primeiro_diacono_id, ultimo.segundo_diacono_id].filter(Boolean) : []
    bloqueadosIds = bloqueadosIds.filter(id =>!idsLiberados.includes(id))

    // CORREÇÃO BUG MANHÃ/NOITE: não bloqueia por data mais. Antes se manhã validava, a data 18/09 entrava em datasBloqueadas e bloqueava a noite.
    // Agora permite 18/09 manhã e 18/09 noite separados. Bloqueio é por culto_id e por bloqueadosIds
    let datasBloqueadas = []

    return <FormNovo
      eu={{...eu,...euCompleto, igreja_id: igrejaId}}
      diaconos={diaconosParaEscolher || []}
      todosDiaconos={diaconosValidos || []}
      bloqueadosIds={bloqueadosIds || []}
      datasBloqueadas={datasBloqueadas || []}
      ultimoCulto={ultimo}
      liberadosIds={idsLiberados || []}
      cultosAbertos={cultosAbertos || []}
    />
  } catch (e) {
    console.error("Erro NovoPage:", e)
    return <div className="p-6 text-sm">Erro ao carregar: {String(e?.message || e)}</div>
  }
}
