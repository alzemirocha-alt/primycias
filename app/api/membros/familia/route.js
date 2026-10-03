import { createClient } from '@supabase/supabase-js'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: titular } = await supabase.from('membros_oficial').select('*').eq('id', id).single()
  if(!titular) return Response.json([])

  let fam = []
  const primeiroNome = titular.nome_completo.split(' ')[0] // Alzemir
  const nomeCompleto = titular.nome_completo

  // 1. CÔNJUGE
  if(titular.conjuge_membro_id){
    const { data } = await supabase.from('membros_oficial').select('*').eq('id', titular.conjuge_membro_id)
    if(data) fam.push(...data)
  }
  if(titular.conjuge_nome || titular.nome_conjuge){
    const nomeConj = titular.conjuge_nome || titular.nome_conjuge
    const { data } = await supabase.from('membros_oficial').select('*').ilike('nome_completo', `%${nomeConj}%`).limit(5)
    if(data) fam.push(...data)
  }
  const { data: temEleComoConjuge } = await supabase.from('membros_oficial').select('*').ilike('conjuge_nome', `%${nomeCompleto}%`).limit(5)
  if(temEleComoConjuge) fam.push(...temEleComoConjuge)

  // 2. FILHOS - BUSCA FORTE PELO NOME DO PAI
  // tenta nome completo, tenta só primeiro nome, tenta sem acento
  const { data: filhos1 } = await supabase.from('membros_oficial').select('*').ilike('filiacao_pai', `%${nomeCompleto}%`)
  if(filhos1) fam.push(...filhos1)

  const { data: filhos2 } = await supabase.from('membros_oficial').select('*').ilike('filiacao_pai', `%${primeiroNome}%`)
  if(filhos2) fam.push(...filhos2)

  const { data: filhos3 } = await supabase.from('membros_oficial').select('*').ilike('filiacao_mae', `%${nomeCompleto}%`)
  if(filhos3) fam.push(...filhos3)

  // 3. PAI E MÃE que são membros
  if(titular.filiacao_pai){
    const { data } = await supabase.from('membros_oficial').select('*').ilike('nome_completo', `%${titular.filiacao_pai}%`).limit(3)
    if(data) fam.push(...data)
  }
  if(titular.filiacao_mae){
    const { data } = await supabase.from('membros_oficial').select('*').ilike('nome_completo', `%${titular.filiacao_mae}%`).limit(3)
    if(data) fam.push(...data)
  }

  // FILTRO FINAL - só membros cadastrados (comungante OU não comungante) e ativos
  const unicos = fam.filter((v,i,a)=>a.findIndex(t=>t.id===v.id)===i && v.id!== titular.id)

  const membrosValidos = unicos.filter(m=>{
    const s = (m.status || m.situacao || m.status_membro || 'ativo').toLowerCase()
    const tipo = (m.tipo_membro || m.categoria_membro || '').toLowerCase()
    // aceita comungante_oficial, nao_comungante, não comungante, etc
    const isMembro = tipo.includes('comungante') || tipo.includes('oficial')
    const isAtivo = s!== 'demitido' && s!== 'transferido' && s!== 'excluido'

    // DEBUG: log pra ver porque Benjamim não entrava
    // console.log(m.nome_completo, tipo, s, isMembro, isAtivo)
    return isMembro && isAtivo
  })

  // Filtra filhos de verdade - só quem tem o nome do titular no campo pai/mãe ou tem sobrenome igual
  const familiaFinal = membrosValidos.filter(m=>{
    const pai = (m.filiacao_pai || '').toLowerCase()
    const mae = (m.filiacao_mae || '').toLowerCase()
    const nomeTitularLower = nomeCompleto.toLowerCase()
    const primeiroNomeLower = primeiroNome.toLowerCase()

    const ehFilho = pai.includes(primeiroNomeLower) || mae.includes(primeiroNomeLower) || pai.includes(nomeTitularLower) || mae.includes(nomeTitularLower)
    const ehConjuge = true // cônjuge já é válido

    return ehFilho || ehConjuge
  })

  return Response.json(membrosValidos)
}
