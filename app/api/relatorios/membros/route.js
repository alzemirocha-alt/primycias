export const dynamic = 'force-dynamic'

import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSessionUser } from "@/lib/auth"
import { isAdmin } from "@/lib/constants"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('membros_oficial')
      .select('id, nome_completo, cpf, categoria_membro, categoria, tipo_membro, oficial_tipo, status, status_membro, situacao, data_admissao, data_batismo, data_profissao_fe, sexo, data_demissao, motivo_demissao')
      .order('nome_completo')
      .limit(5000)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
