'use server'
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSessionUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

function agora() { return new Date().toISOString() }

// Verifica se é tesoureiro
function ehTesoureiro(user) {
  if(!user) return false
  return user.funcao === 'tesoureiro' || user.oficio === 'tesoureiro' || user.nome.toLowerCase().includes('gilson')
}

export async function criarRegistros(formData) {
  const eu = await getSessionUser()
  const data_culto = formData.get('data_culto')
  const segundo_id = formData.get('segundo_diacono_id')
  const itens = JSON.parse(formData.get('itens'))
  const isPastor = eu.oficio === 'pastor'

  // === TRAVA 1: SÓ 1 POR DATA ===
  const { data: existe } = await supabaseAdmin.from('records').select('id').eq('data_culto', data_culto).limit(1)
  if (existe?.length > 0) {
    throw new Error(`TRAVA 1: Já existe registro em ${new Date(data_culto).toLocaleDateString('pt-BR')}. Só pode 1 por data.`)
  }

  // === TRAVA 2: TESOUREIRO NUNCA PARTICIPA DA ELABORAÇÃO ===
  if (ehTesoureiro(eu)) {
    throw new Error('TRAVA 2: Tesoureiro não pode elaborar registro. Você só valida.')
  }
  const { data: segundoUser } = await supabaseAdmin.from('users').select('id,nome,funcao,oficio').eq('id', segundo_id).single()
  if (ehTesoureiro(segundoUser)) {
    throw new Error(`TRAVA 2: ${segundoUser.nome} é Tesoureiro e só pode validar, não pode ser 2º diácono.`)
  }
  if (eu.id === segundo_id) throw new Error('Você não pode ser os 2 diáconos ao mesmo tempo.')

  // === TRAVA 3: NÃO PODE REPETIR DIÁCONO EM DATA SEGUIDA, SALVO PASTOR LIBERAR ===
  if (!isPastor) {
    const { data: ultimo } = await supabaseAdmin.from('records').select('data_culto, primeiro_diacono_id, segundo_diacono_id').order('data_culto', { ascending: false }).limit(1)
    if (ultimo?.length > 0) {
      const ult = ultimo[0]
      const bloqueados = [ult.primeiro_diacono_id, ult.segundo_diacono_id].filter(Boolean)
      if (bloqueados.includes(eu.id)) throw new Error(`TRAVA 3: Você participou do último culto (${new Date(ult.data_culto).toLocaleDateString('pt-BR')}). Só o Pastor pode liberar.`)
      if (bloqueados.includes(segundo_id)) {
        const nome = segundoUser?.nome || 'Diácono'
        throw new Error(`TRAVA 3: ${nome} participou do último culto e está bloqueado. Só o Pastor pode liberar.`)
      }
    }
  }

  const hist = [{ acao: isPastor? 'CRIOU (Pastor liberou revezamento)' : 'CRIOU', usuario: eu.nome, em: agora() }]

  for (const it of itens) {
    await supabaseAdmin.from('records').insert({
      tipo: it.tipo.toLowerCase(),
      membro_nome: it.membro_nome,
      valor: Number(it.valor),
      data_culto,
      primeiro_diacono_id: eu.id,
      segundo_diacono_id: segundo_id,
      diacono_id: eu.id,
      diacono1_nome: eu.nome,
      diacono1_at: agora(),
      status: 'aguardando_segundo_diacono',
      historico: hist
    })
  }
  revalidatePath('/registros'); redirect('/registros')
}

export async function confirmarRegistro(id) {
  const eu = await getSessionUser()
  const { data: reg } = await supabaseAdmin.from('records').select('data_culto, historico').eq('id', id).single()
  const { data: todos } = await supabaseAdmin.from('records').select('id,historico').eq('data_culto', reg.data_culto)
  for (const r of todos) {
    const hist = [...(r.historico||[]), { acao: 'CONFIRMOU e enviou ao Tesoureiro', usuario: eu.nome, em: agora() }]
    await supabaseAdmin.from('records').update({ status: 'aguardando_tesoureiro', diacono2_nome: eu.nome, diacono2_at: agora(), historico: hist }).eq('id', r.id)
  }
  revalidatePath('/registros')
}

export async function validarRegistro(id) {
  const eu = await getSessionUser()
  const { data: reg } = await supabaseAdmin.from('records').select('data_culto, historico').eq('id', id).single()
  const { data: todos } = await supabaseAdmin.from('records').select('id,historico').eq('data_culto', reg.data_culto)
  for (const r of todos) {
    const hist = [...(r.historico||[]), { acao: 'VALIDOU como Tesoureiro', usuario: eu.nome, em: agora() }]
    await supabaseAdmin.from('records').update({ status: 'validado', tesoureiro_nome: eu.nome, tesoureiro_at: agora(), historico: hist }).eq('id', r.id)
  }
  revalidatePath('/registros')
}

export async function devolverRegistro(id, motivo) {
  const eu = await getSessionUser()
  const { data: reg } = await supabaseAdmin.from('records').select('data_culto, historico').eq('id', id).single()
  const { data: todos } = await supabaseAdmin.from('records').select('id,historico').eq('data_culto', reg.data_culto)
  for (const r of todos) {
    const hist = [...(r.historico||[]), { acao: `DEVOLVEU: ${motivo}`, usuario: eu.nome, em: agora() }]
    await supabaseAdmin.from('records').update({ status: 'devolvido_com_erro', motivo_erro: motivo, historico: hist }).eq('id', r.id)
  }
  revalidatePath('/registros')
}

export async function excluirRegistro(id) {
  const { data: reg } = await supabaseAdmin.from('records').select('data_culto').eq('id', id).single()
  await supabaseAdmin.from('records').delete().eq('data_culto', reg.data_culto)
  revalidatePath('/registros')
}
