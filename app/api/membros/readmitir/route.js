import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSessionUser } from "@/lib/auth"
import { isAdmin } from "@/lib/constants"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function POST(req){
  const user = await getSessionUser()
  if(!user) return NextResponse.json({error:"Não autenticado"},{status:401})

  const funcao = (user.funcao_presbitero||'').toLowerCase()
  const isSecretario = funcao.includes('secretario')
  if(!isAdmin(user) && !isSecretario) return NextResponse.json({error:"Sem permissão"},{status:403})

  const { id, forma_admissao, pastor_nome, local_admissao } = await req.json()

  const { data: membro } = await supabaseAdmin.from('membros_oficial').select('*').eq('id', id).single()
  if(!membro) return NextResponse.json({error:"Membro não encontrado"},{status:404})

  if(membro.data_demissao){
    await supabaseAdmin.from('membros_historico').insert({
      membro_id: id,
      tipo: 'demissao',
      data_evento: membro.data_demissao,
      forma: membro.forma_demissao || membro.motivo_demissao || 'Demissão',
      pastor_nome: membro.pastor_demissao || null,
      observacao: 'Registro automático da demissão anterior',
      snapshot: membro
    })
  }

  const hoje = new Date().toISOString().slice(0,10)
  const { error } = await supabaseAdmin.from('membros_oficial').update({
    status: 'ativo',
    status_membro: 'ativo',
    data_admissao: hoje,
    forma_admissao: forma_admissao || 'Readmissão',
    data_demissao: null,
    forma_demissao: null,
    motivo_demissao: null,
    pastor_demissao: null
  }).eq('id', id)

  if(error) return NextResponse.json({error:error.message},{status:400})

  await supabaseAdmin.from('membros_historico').insert({
    membro_id: id,
    tipo: 'readmissao',
    data_evento: hoje,
    forma: forma_admissao || 'Readmissão',
    pastor_nome: pastor_nome || membro.pastor_batismo || null,
    local_evento: local_admissao || membro.local_batismo || null,
    observacao: `Readmitido por ${user.nome || user.email}`,
    snapshot: {...membro, data_admissao: hoje, forma_admissao }
  })

  return NextResponse.json({ok:true})
}
