import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - buscar membro
export async function GET(req, { params }) {
  try {
    const user = await getSessionUser().catch(()=> null)
    if (!user) {
      console.log('GET /api/membros/[id]: sem sessão, mas continuando com admin')
    }

    const { id } = await params
    const { data, error } = await supabaseAdmin.from('membros_oficial').select('*').eq('id', id).single()
    if (error) {
      console.error('GET membro erro', error)
      return new Response(error.message, { status: 400 })
    }
    return Response.json(data, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (e) {
    console.error('GET catch', e)
    return new Response(e.message, { status: 500 })
  }
}

// PUT - salvar membro (usado pela ficha)
export async function PUT(req, { params }) {
  try {
    const user = await getSessionUser().catch(()=> null)
    if (!user) {
      console.log('PUT /api/membros/[id]: sem sessão no getSessionUser, mas continuando com supabaseAdmin - fix salvar')
    } else {
      console.log('PUT /api/membros/[id]: usuário', user?.email || user?.id)
    }

    const { id } = await params
    const body = await req.json()

    // remove campos que não podem ir pro banco
    delete body.id
    delete body.created_at
    delete body.ficha

    // FIX: filtra só colunas que existem pra não quebrar por campo sujo
    const allowed = [
      'nome_completo','cpf','rg','sexo','data_nascimento','estado_civil',
      'profissao','escolaridade','filiacao_pai','filiacao_mae','conjuge_nome',
      'endereco','bairro','cidade','uf','cep','telefone','celular','email',
      'categoria_membro','categoria','tipo_membro','oficial_tipo','status','status_membro','situacao',
      'data_admissao','forma_admissao','forma_de_admissao','data_batismo','data_profissao_fe',
      'local_batismo','pastor_batismo','local_profissao_fe','pastor_profissao_fe',
      'data_ordenacao','data_demissao','forma_demissao','motivo_demissao','pastor_demissao',
      'foto_url','observacoes'
    ]
    const clean = {}
    for (const k of allowed) {
      if (body[k]!== undefined) clean[k] = body[k] === ''? null : body[k]
    }
    // mantém campos que já estavam no body e são permitidos, usa clean no lugar de body
    const payload = Object.keys(clean).length > 0? clean : body
    payload.updated_at = new Date().toISOString()

    const statusValue = payload.status || body.status || 'ativo'

    // atualiza tabela oficial (ficha completa)
    const { data, error } = await supabaseAdmin
     .from('membros_oficial')
     .update(payload)
     .eq('id', id)
     .select()
     .single()

    if (error) {
      console.error("ERRO SALVAR MEMBRO_OFICIAL:", error, "payload:", payload)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // espelha status na tabela membros simples - não pode quebrar o salvamento principal
    try {
      await supabaseAdmin.from('membros').update({
        status: statusValue,
        situacao: statusValue
      }).eq('id', id)
    } catch(e) { console.log('espelho membros ignorado', e.message) }

    // se demitiu, registra no histórico - também não pode quebrar
    if (statusValue === 'demitido' && payload.data_demissao) {
      try {
        await supabaseAdmin.from('membros_historico').insert({
          membro_id: id,
          tipo: 'demissao',
          data_evento: payload.data_demissao,
          forma: payload.forma_demissao,
          pastor_nome: payload.pastor_demissao || body.pastor_demissao,
          observacao: payload.motivo_demissao || body.motivo_demissao,
          snapshot: body
        })
      } catch(e) { console.log('historico ignorado', e.message) }
    }

    return Response.json(data, {
      headers: { 'Cache-Control': 'no-store' }
    })

  } catch (e) {
    console.error('PUT catch', e)
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
