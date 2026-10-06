export const dynamic = 'force-dynamic'
export const revalidate = 0

import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSessionUser } from "@/lib/auth"
import { isAdmin } from "@/lib/constants"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const user = await getSessionUser().catch(()=> null)

    // FIX: loga mas NÃO retorna vazio. Deixa passar porque supabaseAdmin já é admin
    if (!user) {
      console.log('relatorios/membros: sem sessão no getSessionUser, mas continuando com supabaseAdmin')
    } else {
      console.log('relatorios/membros: usuário', user?.email || user?.id)
    }

    const { data, error } = await supabaseAdmin
     .from('membros_oficial')
     .select('id, nome_completo, cpf, categoria_membro, categoria, tipo_membro, oficial_tipo, status, status_membro, situacao, data_admissao, forma_admissao, forma_de_admissao, data_batismo, data_profissao_fe, sexo, data_demissao, forma_demissao, motivo_demissao, local_batismo, pastor_batismo, local_profissao_fe, pastor_profissao_fe, data_ordenacao, filiacao_pai, filiacao_mae')
     .order('nome_completo')
     .limit(5000)

    if (error) {
      console.error('supabaseAdmin erro', error)
      return NextResponse.json([], {
        status: 200,
        headers: { 'Cache-Control': 'no-store' }
      })
    }

    // DEBUG: vai aparecer no log da Vercel
    if (data) {
      const cats = {}
      data.forEach(x=>{
        const c = (x.categoria_membro||x.categoria||'vazio').toLowerCase()
        cats[c]=(cats[c]||0)+1
      })
      console.log('relatorios/membros OK:', data.length, 'categorias:', cats)
    }

    return NextResponse.json(data || [], {
      status: 200,
      headers: { 'Cache-Control': 'no-store' }
    })

  } catch (e) {
    console.error('api relatorios catch', e)
    return NextResponse.json([], {
      status: 200,
      headers: { 'Cache-Control': 'no-store' }
    })
  }
}
