export const dynamic = 'force-dynamic'

import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSessionUser } from "@/lib/auth"
import { isAdmin } from "@/lib/constants"
import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const funcaoPresb = (user.funcao_presbitero || '').toLowerCase()
    const isSecretario = funcaoPresb.includes('secretario')
    if (!isAdmin(user) &&!isSecretario) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    const body = await req.json()

    // 1. GARANTE NUMERAÇÃO CRESCENTE E ÚNICA
    let numero_rol = body.numero_rol? parseInt(body.numero_rol) : null

    // Se não informou número, pega o maior + 1
    if (!numero_rol) {
      const { data: maxData } = await supabaseAdmin
       .from('membros_oficial')
       .select('numero_rol')
       .order('numero_rol', { ascending: false })
       .limit(1)
       .single()

      numero_rol = (maxData?.numero_rol || 0) + 1
    } else {
      // Se informou, verifica se já existe (nunca pode repetir, mesmo demitido)
      const { data: existe } = await supabaseAdmin
       .from('membros_oficial')
       .select('id')
       .eq('numero_rol', numero_rol)
       .maybeSingle()

      if (existe) {
        return NextResponse.json({ error: `Número ${numero_rol} já existe e não pode repetir! Use outro.` }, { status: 400 })
      }
    }

    // 2. VINCULAÇÃO DE CÔNJUGE
    let conjuge_membro_id = null
    if (body.cpf_conjuge) {
      const cpfLimpo = body.cpf_conjuge.replace(/\D/g, '')
      // busca por CPF com ou sem máscara
      const { data: conjuge } = await supabaseAdmin
       .from('membros_oficial')
       .select('id')
       .or(`cpf.eq.${body.cpf_conjuge},cpf.eq.${cpfLimpo}`)
       .maybeSingle()

      if (conjuge) conjuge_membro_id = conjuge.id
    } else if (body.nome_conjuge) {
      // se não tem CPF, tenta pelo nome exato
      const { data: conjugeNome } = await supabaseAdmin
       .from('membros_oficial')
       .select('id')
       .ilike('nome_completo', body.nome_conjuge.trim())
       .maybeSingle()
      if (conjugeNome) conjuge_membro_id = conjugeNome.id
    }

    const insertData = {
      nome_completo: body.nome_completo,
      numero_rol,
      cpf: body.cpf || null,
      foto_url: body.foto_url || null,
      filiacao_pai: body.filiacao_pai || null,
      filiacao_mae: body.filiacao_mae || null,
      endereco: body.endereco || null,
      cep: body.cep || null,
      cidade: body.cidade || null,
      estado: body.estado || null,
      cidade_nasc: body.cidade_nasc || null,
      estado_nasc: body.estado_nasc || null,
      data_nascimento: body.data_nascimento || null,
      telefone: body.telefone || null,
      sexo: body.sexo || null,
      estado_civil: body.estado_civil || null,
      nome_conjuge: body.nome_conjuge || null,
      cpf_conjuge: body.cpf_conjuge || null,
      data_casamento: body.data_casamento || null,
      conjuge_membro_id,
      escolaridade: body.escolaridade || null,
      profissao: body.profissao || null,
      categoria_membro: body.categoria_membro || 'comungante',
      oficial_tipo: body.oficial_tipo || null,
      forma_admissao: body.forma_admissao || null,
      data_admissao: body.data_admissao || null,
      data_batismo: body.data_batismo || null,
      local_batismo: body.local_batismo || null,
      pastor_batismo: body.pastor_batismo || null,
      data_profissao_fe: body.data_profissao_fe || null,
      local_profissao_fe: body.local_profissao_fe || null,
      pastor_profissao_fe: body.pastor_profissao_fe || null,
      data_ordenacao: body.data_ordenacao || null,
      data_instalacao: body.data_instalacao || null,
      status: body.status || 'ativo',
      tipo_membro: body.categoria_membro || 'comungante'
    }

    const { data, error } = await supabaseAdmin
     .from('membros_oficial')
     .insert([insertData])
     .select()
     .single()

    if (error) {
      console.error(error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // 3. SE VINCULOU CÔNJUGE, VINCULA O OUTRO LADO TAMBÉM (mão dupla)
    if (conjuge_membro_id && data.id) {
      await supabaseAdmin
       .from('membros_oficial')
       .update({ conjuge_membro_id: data.id })
       .eq('id', conjuge_membro_id)
    }

    return NextResponse.json(data)

  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
