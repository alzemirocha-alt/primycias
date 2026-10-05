import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req) {
  const cookieStore = await cookies()
  if (!cookieStore.has('primycias_session') && !cookieStore.has('primycias_dev_session')) {
    return new Response('Não autorizado', { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const membro_id = searchParams.get('membro_id')
  let query = supabaseAdmin.from('membros_historico').select('*').order('created_at', { ascending: false })
  if (membro_id) query = query.eq('membro_id', membro_id)
  const { data, error } = await query
  if (error) return new Response(error.message, { status: 400 })
  return Response.json(data)
}
export async function POST(req) {
  const cookieStore = await cookies()
  if (!cookieStore.has('primycias_session') && !cookieStore.has('primycias_dev_session')) {
    return new Response('Não autorizado', { status: 401 })
  }
  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('membros_historico').insert(body).select()
  if (error) return new Response(error.message, { status: 400 })
  return Response.json(data)
}
