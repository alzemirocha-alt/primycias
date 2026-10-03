import { createClient } from '@supabase/supabase-js'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { data } = await supabase
  .from('membros_oficial')
  .select('*')
  .ilike('nome_completo', `%${q}%`)
  .limit(10)

  const ativos = (data||[]).filter(m=>{
    const s = (m.status || m.situacao || m.status_membro || 'ativo').toLowerCase()
    return s!== 'demitido' && s!== 'transferido' && s!== 'excluido'
  })
  return Response.json(ativos)
}
