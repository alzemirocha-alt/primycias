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

  const { id, data_demissao, data_evento, forma_demissao, pastor_demissao, pastor_epoca, motivo, ata_numero, local_demissao } = await req.json()
  
  const dataFinal = data_evento || data_demissao
  const pastorFinal = pastor_epoca || pastor_demissao

  if(!dataFinal) return NextResponse.json({error:"Data da demissão é obrigatória"},{status:400})
  if(!pastorFinal) return NextResponse.json({error:"Pastor na época é obrigatório"},{status:400})

  const { data: membro } = await supabaseAdmin.from('membros_oficial').select('*').eq('id', id).single()
  if(!membro) return NextResponse.json({error:"Membro não encontrado"},{status:404})

  const primeiraAdmissao = membro.data_primeira_admissao || membro.data_admissao

  await supabaseAdmin.from('membros_oficial').update({
    status: 'demitido', 
    status_membro: 'demitido',
    data_primeira_admissao: primeiraAdmissao,
    data_demissao: dataFinal, 
    forma_demissao, 
    motivo_demissao: motivo || null, 
    pastor_demissao: pastorFinal
  }).eq('id', id)

  await supabaseAdmin.from('membros_historico').insert({
    membro_id: id, 
    igreja_id: membro.igreja_id || null,
    tipo: 'demissao', 
    data_evento: dataFinal,
    forma: forma_demissao, 
    pastor_nome: pastorFinal, 
    local_evento: local_demissao || (ata_numero ? `Ata nº ${ata_numero}` : null),
    observacao: motivo ? `${forma_demissao} - ${motivo}` : (ata_numero ? `Demissão - Ata nº ${ata_numero}` : `Demissão`),
    snapshot: membro
  })

  return NextResponse.json({ok:true})
}
