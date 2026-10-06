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

    const statusValue = body.status || 'ativo'

    // atualiza tabela oficial (ficha completa)
    const { data, error } = await supabaseAdmin
      .from('membros_oficial')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error("ERRO SALVAR MEMBRO_OFICIAL:", error)
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // espelha status na tabela membros simples
    await supabaseAdmin.from('membros').update({ 
      status: statusValue, 
      situacao: statusValue 
    }).eq('id', id)

    // se demitiu, registra no histórico
    if (statusValue === 'demitido' && body.data_demissao) {
      await supabaseAdmin.from('membros_historico').insert({
        membro_id: id,
        tipo: 'demissao',
        data_evento: body.data_demissao,
        forma: body.forma_demissao,
        pastor_nome: body.pastor_demissao,
        observacao: body.motivo_demissao,
        snapshot: body
      })
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
