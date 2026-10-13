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

  // VALIDAÇÃO NOVA - é isso que você pediu: data da readmissão + pastor da época
  if(!data_evento) return NextResponse.json({error:"Data da readmissão é obrigatória"},{status:400})
  if(!pastor_epoca) return NextResponse.json({error:"Pastor na época da readmissão é obrigatório"},{status:400})

  const { data: membro } = await supabaseAdmin.from('membros_oficial').select('*').eq('id', id).single()
  if(!membro) return NextResponse.json({error:"Membro não encontrado"},{status:404})

  // REMOVIDO: bloco que criava "Registro automático da demissão anterior" - causava duplicação
  // if(membro.data_demissao){ ... } -> APAGADO

  // CORREÇÃO PRINCIPAL: preserva a primeira admissão (30/12/1975 da Aleir)
  const primeiraAdmissao = membro.data_primeira_admissao || membro.data_admissao || data_evento

  const { error } = await supabaseAdmin.from('membros_oficial').update({
    status: 'ativo',
    status_membro: 'ativo',
    // PRESERVA a primeira admissão, nunca sobrescreve
    data_admissao: primeiraAdmissao, // 30/12/1975 continua
    data_primeira_admissao: primeiraAdmissao,
    // Data atual da readmissão vai em campo separado
    data_admissao_atual: data_evento, // 21/07/2005 ou a data que digitaram
    data_ultima_admissao: data_evento,
    forma_admissao: membro.forma_admissao || primeiraAdmissao ? membro.forma_admissao : forma_admissao, // mantém forma original
    forma_ultima_admissao: forma_admissao || 'Readmissão',
    data_demissao: null,
    forma_demissao: null,
    motivo_demissao: null,
    pastor_demissao: null,
    pastor_admissao_atual: pastor_epoca
  }).eq('id', id)

  if(error) return NextResponse.json({error:error.message},{status:400})

  // APENAS 1 REGISTRO, com data e pastor da ÉPOCA, não de hoje e não seu nome
  const { error: histError } = await supabaseAdmin.from('membros_historico').insert({
    membro_id: id,
    igreja_id: membro.igreja_id || null,
    tipo: 'readmissao',
    data_evento: data_evento, // DATA QUE FOI READMITIDA, não hoje
    forma: forma_admissao || 'Readmissão',
    pastor_nome: pastor_epoca, // PASTOR NA ÉPOCA, não user.nome
    local_evento: local_admissao || (ata_numero ? `Ata nº ${ata_numero}` : null),
    observacao: ata_numero ? `Readmissão - Ata nº ${ata_numero}` : `Readmissão`,
    // auditoria separada, não aparece na ficha
    usuario_lancamento: user.id,
    snapshot: {...membro, data_readmissao: data_evento, forma_readmissao: forma_admissao, pastor_epoca }
  })

  if(histError) return NextResponse.json({error: histError.message},{status:400})

  return NextResponse.json({ok:true})
}
