import { createClient } from '@supabase/supabase-js'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const nome = searchParams.get('nome')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: titular } = await supabase.from('membros_oficial').select('*').eq('id', id).single()
  if(!titular) return Response.json([])

  let fam = []

  // Busca por ID de cônjuge
  if(titular.conjuge_membro_id || titular.conjuge_id){
    const idConj = titular.conjuge_membro_id || titular.conjuge_id
    const { data } = await supabase.from('membros_oficial').select('*').eq('id', idConj)
    if(data) fam.push(...data)
  }
  // Busca cônjuge por nome
  if(titular.conjuge_nome || titular.nome_conjuge){
    const nomeConj = titular.conjuge_nome || titular.nome_conjuge
    const { data } = await supabase.from('membros_oficial').select('*').ilike('nome_completo', `%${nomeConj}%`).limit(3)
    if(data) fam.push(...data)
  }
  // Quem tem ele como cônjuge
  const { data: temEleComoConjuge } = await supabase.from('membros_oficial').select('*').ilike('conjuge_nome', `%${titular.nome_completo}%`)
  if(temEleComoConjuge) fam.push(...temEleComoConjuge)

  // Filhos - quem tem ele como pai ou mãe
  const { data: filhos } = await supabase.from('membros_oficial').select('*').or(`filiacao_pai.ilike.%${titular.nome_completo}%,filiacao_mae.ilike.%${titular.nome_completo}%`)
  if(filhos) fam.push(...filhos)

  // Pai e Mãe - se eles forem membros
  if(titular.filiacao_pai){
    const { data } = await supabase.from('membros_oficial').select('*').ilike('nome_completo', `%${titular.filiacao_pai}%`).limit(3)
    if(data) fam.push(...data)
  }
  if(titular.filiacao_mae){
    const { data } = await supabase.from('membros_oficial').select('*').ilike('nome_completo', `%${titular.filiacao_mae}%`).limit(3)
    if(data) fam.push(...data)
  }

  // FILTRO FINAL: só quem é membro da igreja (comungante ou não) e não demitido, e remove duplicado e o próprio titular
  const unicos = fam.filter((v,i,a)=>a.findIndex(t=>t.id===v.id)===i && v.id!== titular.id)
  const membrosAtivos = unicos.filter(m=>{
    const s = (m.status || m.situacao || m.status_membro || 'ativo').toLowerCase()
    const tipo = (m.tipo_membro || m.categoria_membro || '').toLowerCase()
    const isMembro = tipo.includes('comungante') || tipo.includes('nao_comungante') || tipo.includes('não comungante') || tipo.includes('oficial')
    return isMembro && s!== 'demitido' && s!== 'transferido'
  })

  return Response.json(membrosAtivos)
}
