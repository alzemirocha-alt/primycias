import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - buscar membro
export async function GET(req, { params }) {
  const user = await getSessionUser()
  if (!user) return new Response('Não autorizado', { status: 401 })

  const { id } = await params
  const { data, error } = await supabaseAdmin.from('membros_oficial').select('*').eq('id', id).single()
  if (error) return new Response(error.message, { status: 400 })
  return Response.json(data)
}

// PUT - salvar membro (usado pela ficha)
export async function PUT(req, { params }) {
  const user = await getSessionUser()
  if (!user) return new Response('Não autorizado', { status: 401 })

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
    return new Response(error.message, { status: 400 })
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

  return Response.json(data)
}
