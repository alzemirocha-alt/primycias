import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
export async function POST(req){
  const { id, data_demissao, forma_demissao, pastor_demissao, motivo } = await req.json()
  const { data: membro } = await supabaseAdmin.from('membros_oficial').select('*').eq('id', id).single()
  await supabaseAdmin.from('membros_oficial').update({
    status: 'demitido', status_membro: 'demitido',
    data_demissao, forma_demissao, motivo_demissao: motivo, pastor_demissao
  }).eq('id', id)
  await supabaseAdmin.from('membros_historico').insert({
    membro_id: id, tipo: 'demissao', data_evento: data_demissao,
    forma: forma_demissao, pastor_nome: pastor_demissao, observacao: motivo, snapshot: membro
  })
  return NextResponse.json({ok:true})
}
