import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function PUT(req) {
  const cookieStore = await cookies()
  if (!cookieStore.has('primycias_session') && !cookieStore.has('primycias_dev_session')) {
    return new Response('Não autorizado', { status: 401 })
  }
  const body = await req.json()
  const { id, ...rest } = body
  const { data, error } = await supabaseAdmin.from('membros_oficial').update(rest).eq('id', id).select()
  if (error) return new Response(error.message, { status: 400 })
  return Response.json(data)
}
export async function POST(req) {
  const cookieStore = await cookies()
  if (!cookieStore.has('primycias_session') && !cookieStore.has('primycias_dev_session')) {
    return new Response('Não autorizado', { status: 401 })
  }
  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('membros_oficial').insert(body).select()
  if (error) return new Response(error.message, { status: 400 })
  return Response.json(data)
}
