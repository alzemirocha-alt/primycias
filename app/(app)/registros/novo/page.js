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

    // PEGA IGREJA DO LOGADO
    const { data: euCompleto } = await supabaseAdmin.from('users').select('id,igreja_id,nome,oficio,funcao').eq('id', eu.id).single()
    const igrejaId = euCompleto?.igreja_id || eu?.igreja_id

    const { data: users } = await supabaseAdmin.from('users').select('id,nome,oficio,funcao,igreja_id').eq('igreja_id', igrejaId).limit(100)

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
      const res = await supabaseAdmin.from('records').select('data_culto, primeiro_diacono_id, segundo_diacono_id').eq('igreja_id', igrejaId).order('data_culto', { ascending: false }).limit(1)
      ultimo = res.data?.[0] || null
    } catch {}

    // CORRIGIDO: TOLERANTE COM OU SEM igreja_id na tabela liberacoes_diaconos
    let idsLiberados = []
    try {
      const { data: liberados, error } = await supabaseAdmin.from('liberacoes_diaconos').select('diacono_id').eq('igreja_id', igrejaId)
      if (error) throw error
      idsLiberados = (liberados || []).map(l => l.diacono_id).filter(Boolean)
    } catch {
      // Fallback para tabela antiga sem igreja_id
      try {
        const { data: liberados2 } = await supabaseAdmin.from('liberacoes_diaconos').select('diacono_id')
        idsLiberados = (liberados2 || []).map(l => l.diacono_id).filter(Boolean)
      } catch { idsLiberados = [] }
    }

    let bloqueadosIds = ultimo? [ultimo.primeiro_diacono_id, ultimo.segundo_diacono_id].filter(Boolean) : []
    bloqueadosIds = bloqueadosIds.filter(id =>!idsLiberados.includes(id))

    let datasBloqueadas = []
    try {
      const { data: datas } = await supabaseAdmin.from('records').select('data_culto').eq('igreja_id', igrejaId)
      datasBloqueadas = datas?.map(d => d.data_culto) || []
    } catch {}

    return <FormNovo
      eu={{...eu, igreja_id: igrejaId}}
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
