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

  const { id, forma_admissao, data_evento, pastor_epoca, ata_numero, local_admissao } = await req.json()

  if(!data_evento) return NextResponse.json({error:"Data da readmissão é obrigatória"},{status:400})
  if(!pastor_epoca) return NextResponse.json({error:"Pastor na época da readmissão é obrigatório"},{status:400})

  const { data: membro } = await supabaseAdmin.from('membros_oficial').select('*').eq('id', id).single()
  if(!membro) return NextResponse.json({error:"Membro não encontrado"},{status:404})

  const primeiraAdmissao = membro.data_primeira_admissao || membro.data_admissao || data_evento

  const { error } = await supabaseAdmin.from('membros_oficial').update({
    status: 'ativo',
    status_membro: 'ativo',
    data_admissao: primeiraAdmissao,
    data_primeira_admissao: primeiraAdmissao,
    data_admissao_atual: data_evento,
    data_ultima_admissao: data_evento,
    forma_ultima_admissao: forma_admissao,
    data_demissao: null,
    forma_demissao: null,
    motivo_demissao: null,
    pastor_demissao: null,
    pastor_admissao_atual: pastor_epoca
  }).eq('id', id)

  if(error) return NextResponse.json({error:error.message},{status:400})

  const { error: histError } = await supabaseAdmin.from('membros_historico').insert({
    membro_id: id,
    igreja_id: membro.igreja_id || null,
    tipo: 'readmissao',
    data_evento: data_evento,
    forma: forma_admissao,
    pastor_nome: pastor_epoca,
    local_evento: local_admissao || (ata_numero ? `Ata nº ${ata_numero}` : null),
    observacao: ata_numero ? `Readmissão - Ata nº ${ata_numero}` : `Readmissão`,
    snapshot: membro
  })

  if(histError) return NextResponse.json({error: histError.message},{status:400})

  return NextResponse.json({ok:true})
}
