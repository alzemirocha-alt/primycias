import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSessionUser } from "@/lib/auth"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(req) {
  const user = await getSessionUser()
  if(!user) return new Response('Não autorizado', { status: 401 })

  const { searchParams } = new URL(req.url)
  const membro_id = searchParams.get('membro_id')
  
  let query = supabaseAdmin.from('membros_historico').select('*').order('data_evento', { ascending: true })
  if (membro_id) query = query.eq('membro_id', membro_id)
  
  const { data, error } = await query
  if (error) return new Response(error.message, { status: 400 })
  return Response.json(data || [])
}

export async function POST(req) {
  const user = await getSessionUser()
  if(!user) return new Response('Não autorizado', { status: 401 })

  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('membros_historico').insert(body).select()
  if (error) return new Response(error.message, { status: 400 })
  return Response.json(data)
}
