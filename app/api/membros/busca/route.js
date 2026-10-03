import { createClient } from '@supabase/supabase-js'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Busca sem filtro de status pra garantir que acha
  const { data, error } = await supabase
   .from('membros_oficial')
   .select('*')
   .ilike('nome_completo', `%${q}%`)
   .limit(10)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
