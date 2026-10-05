export const dynamic = 'force-dynamic'
export const revalidate = 0

import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSessionUser } from "@/lib/auth"
import { isAdmin } from "@/lib/constants"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const user = await getSessionUser().catch(()=> null)
    if (!user) {
      // DEFINITIVO: não retorna 401 que quebra o filtro, retorna array vazio com 200
      console.log('relatorios/membros: sem sessão')
      return NextResponse.json([], { 
        status: 200,
        headers: { 'Cache-Control': 'no-store' }
      })
    }

    const { data, error } = await supabaseAdmin
      .from('membros_oficial')
      .select('id, nome_completo, cpf, categoria_membro, categoria, tipo_membro, oficial_tipo, status, status_membro, situacao, data_admissao, forma_admissao, forma_de_admissao, data_batismo, data_profissao_fe, sexo, data_demissao, forma_demissao, motivo_demissao, local_batismo, pastor_batismo, local_profissao_fe, pastor_profissao_fe, data_ordenacao, filiacao_pai, filiacao_mae')
      .order('nome_completo')
      .limit(5000)

    if (error) {
      console.error('supabaseAdmin erro', error)
      // DEFINITIVO: em vez de 400, retorna [] pra não quebrar o filtro
      return NextResponse.json([], { 
        status: 200,
        headers: { 'Cache-Control': 'no-store' }
      })
    }

    return NextResponse.json(data || [], {
      status: 200,
      headers: { 'Cache-Control': 'no-store' }
    })

  } catch (e) {
    console.error('api relatorios catch', e)
    // DEFINITIVO: nunca retorna 500 pro front, retorna [] 
    return NextResponse.json([], { 
      status: 200,
      headers: { 'Cache-Control': 'no-store' }
    })
  }
}
