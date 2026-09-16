'use server'
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSessionUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

function agora() { return new Date().toISOString() }

function ehTesoureiro(user) {
  if(!user) return false
  return user.funcao === 'tesoureiro' || user.oficio === 'tesoureiro' || (user.nome||'').toLowerCase().includes('gilson')
}

export async function criarRegistros(formData) {
  const eu = await getSessionUser()
  const data_culto = formData.get('data_culto')
  const segundo_id = formData.get('segundo_diacono_id')
  const itens = JSON.parse(formData.get('itens'))
  const isPastor = (eu?.oficio||'').toLowerCase() === 'pastor'

  // PEGA IGREJA - FIX
  let igreja_id = formData.get('igreja_id') || eu?.igreja_id
  if(!igreja_id){
    const { data: perfil } = await supabaseAdmin.from('users').select('igreja_id').eq('id', eu.id).single()
    igreja_id = perfil?.igreja_id
  }
  if(!igreja_id) throw new Error('Igreja não identificada')

  const { data: existe } = await supabaseAdmin.from('records').select('id').eq('data_culto', data_culto).eq('igreja_id', igreja_id).limit(1)
  if (existe?.length > 0) {
    throw new Error(`Já existe registro em ${new Date(data_culto).toLocaleDateString('pt-BR')}. Só pode 1 culto por data.`)
  }

  if (ehTesoureiro(eu)) {
    throw new Error('Tesoureiro não pode elaborar registro. Você só valida.')
  }
  const { data: segundoUser } = await supabaseAdmin.from('users').select('id,nome,funcao,oficio').eq('id', segundo_id).single()
  if (ehTesoureiro(segundoUser)) {
    throw new Error(`${segundoUser.nome} é Tesoureiro e só pode validar, não pode ser 2º diácono.`)
  }
  if (eu.id === segundo_id) throw new Error('Você não pode ser os 2 diáconos ao mesmo tempo.')

  // === TRAVA 3 CORRIGIDA: AGORA RESPEITA O BOTÃO LIBERADO + IGREJA ===
  if (!isPastor) {
    const { data: ultimo } = await supabaseAdmin.from('records').select('data_culto, primeiro_diacono_id, segundo_diacono_id').eq('igreja_id', igreja_id).order('data_culto', { ascending: false }).limit(1)
    if (ultimo?.length > 0) {
      const ult = ultimo[0]
      let bloqueados = [ult.primeiro_diacono_id, ult.segundo_diacono_id].filter(Boolean)

      const { data: liberados } = await supabaseAdmin.from('liberacoes_diaconos').select('diacono_id').eq('igreja_id', igreja_id)
      const idsLiberados = (liberados||[]).map(l=>l.diacono_id)
      bloqueados = bloqueados.filter(id =>!idsLiberados.includes(id))

      if (bloqueados.includes(eu.id)) throw new Error(`Você participou do último culto (${new Date(ult.data_culto).toLocaleDateString('pt-BR')}). Só o Pastor pode liberar.`)
      if (bloqueados.includes(segundo_id)) {
        const nome = segundoUser?.nome || 'Diácono'
        throw new Error(`${nome} participou do último culto e está bloqueado. Só o Pastor pode liberar.`)
      }
    }
  }

  try{
    await supabaseAdmin.from('liberacoes_diaconos').delete().in('diacono_id', [eu.id, segundo_id]).eq('igreja_id', igreja_id)
  }catch{}

  const hist = [{ acao: isPastor? 'CRIOU (Pastor liberou revezamento)' : 'CRIOU', usuario: eu.nome, em: agora() }]

  const paraInserir = itens.map(it=>({
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
    historico: hist,
    igreja_id
  }))

  const { error } = await supabaseAdmin.from('records').insert(paraInserir)
  if(error) throw new Error(error.message)

  revalidatePath('/registros'); redirect('/registros')
}

export async function confirmarRegistro(id) {
  const eu = await getSessionUser()
  const { data: reg } = await supabaseAdmin.from('records').select('data_culto, historico, igreja_id').eq('id', id).single()
  const { data: todos } = await supabaseAdmin.from('records').select('id,historico').eq('data_culto', reg.data_culto).eq('igreja_id', reg.igreja_id)
  for (const r of todos) {
    const hist = [...(r.historico||[]), { acao: 'CONFIRMOU e enviou ao Tesoureiro', usuario: eu.nome, em: agora() }]
    await supabaseAdmin.from('records').update({ status: 'aguardando_tesoureiro', diacono2_nome: eu.nome, diacono2_at: agora(), historico: hist }).eq('id', r.id)
  }
  revalidatePath('/registros')
}

export async function validarRegistro(id) {
  const eu = await getSessionUser()
  const { data: reg } = await supabaseAdmin.from('records').select('data_culto, historico, igreja_id').eq('id', id).single()
  const { data: todos } = await supabaseAdmin.from('records').select('id,historico').eq('data_culto', reg.data_culto).eq('igreja_id', reg.igreja_id)
  for (const r of todos) {
    const hist = [...(r.historico||[]), { acao: 'VALIDOU como Tesoureiro', usuario: eu.nome, em: agora() }]
    await supabaseAdmin.from('records').update({ status: 'validado', tesoureiro_nome: eu.nome, tesoureiro_at: agora(), historico: hist }).eq('id', r.id)
  }
  revalidatePath('/registros')
}

export async function devolverRegistro(id, motivo) {
  const eu = await getSessionUser()
  const { data: reg } = await supabaseAdmin.from('records').select('data_culto, historico, igreja_id').eq('id', id).single()
  const { data: todos } = await supabaseAdmin.from('records').select('id,historico').eq('data_culto', reg.data_culto).eq('igreja_id', reg.igreja_id)
  for (const r of todos) {
    const hist = [...(r.historico||[]), { acao: `DEVOLVEU: ${motivo}`, usuario: eu.nome, em: agora() }]
    await supabaseAdmin.from('records').update({ status: 'devolvido_com_erro', motivo_erro: motivo, historico: hist }).eq('id', r.id)
  }
  revalidatePath('/registros')
}

export async function excluirRegistro(id) {
  const { data: reg } = await supabaseAdmin.from('records').select('data_culto, igreja_id').eq('id', id).single()
  await supabaseAdmin.from('records').delete().eq('data_culto', reg.data_culto).eq('igreja_id', reg.igreja_id)
  revalidatePath('/registros')
}

export async function corrigirRegistro(formData){
  const eu = await getSessionUser()
  const data_culto = formData.get('data_culto')
  const segundo_id = formData.get('segundo_diacono_id')
  const itens = JSON.parse(formData.get('itens'))
  let igreja_id = formData.get('igreja_id') || eu?.igreja_id
  if(!igreja_id){
    const { data: perfil } = await supabaseAdmin.from('users').select('igreja_id').eq('id', eu.id).single()
    igreja_id = perfil?.igreja_id
  }
  await supabaseAdmin.from('records').delete().eq('data_culto', data_culto).eq('igreja_id', igreja_id)
  const hist = [{ acao: 'CORRIGIU e reenviou ao 2º Diácono', usuario: eu.nome, em: agora() }]
  const paraInserir = itens.filter(i=>i.membro_nome && i.valor).map(it=>({
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
    motivo_erro: null,
    historico: hist,
    igreja_id
  }))
  const { error } = await supabaseAdmin.from('records').insert(paraInserir)
  if(error) throw new Error(error.message)
  revalidatePath('/registros')
  redirect('/registros')
}

export async function atualizarRegistros(data_culto_param, itens) {
  const eu = await getSessionUser()
  const data_culto = typeof data_culto_param === 'string'? data_culto_param.split('T')[0] : new Date(data_culto_param).toISOString().split('T')[0]
  let igreja_id = eu?.igreja_id
  if(!igreja_id){
    const { data: perfil } = await supabaseAdmin.from('users').select('igreja_id').eq('id', eu.id).single()
    igreja_id = perfil?.igreja_id
  }
  const { data: original } = await supabaseAdmin.from('records').select('segundo_diacono_id, igreja_id').eq('data_culto', data_culto).eq('igreja_id', igreja_id).limit(1).single()
  const segundo_id = original?.segundo_diacono_id
  await supabaseAdmin.from('records').delete().eq('data_culto', data_culto).eq('igreja_id', igreja_id)
  const hist = [{ acao: 'CORRIGIU e reenviou ao 2º Diácono', usuario: eu.nome, em: agora() }]
  const paraInserir = itens.filter(i=>i.membro_nome && i.valor).map(it=>({
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
    motivo_erro: null,
    historico: hist,
    igreja_id
  }))
  const { error } = await supabaseAdmin.from('records').insert(paraInserir)
  if(error) throw new Error(error.message)
  revalidatePath('/registros')
  redirect('/registros')
}

// CORRIGIDO - TOLERANTE A TABELA COM OU SEM igreja_id
export async function liberarDiacono(id){
  const eu = await getSessionUser()
  if((eu?.oficio||'').toLowerCase()!== 'pastor') throw new Error('Só pastor pode liberar')
  let igreja_id = eu?.igreja_id
  if(!igreja_id){
    const { data: perfil } = await supabaseAdmin.from('users').select('igreja_id').eq('id', eu.id).single()
    igreja_id = perfil?.igreja_id
  }

  // Tenta com igreja_id primeiro, se falhar tenta sem
  let { error } = await supabaseAdmin.from('liberacoes_diaconos').upsert({
    diacono_id: id,
    liberado_por: eu.id,
    liberado_em: new Date().toISOString(),
    igreja_id
  }, { onConflict: 'diacono_id' })

  if (error) {
    // Fallback para tabela antiga sem igreja_id
    const { error: err2 } = await supabaseAdmin.from('liberacoes_diaconos').upsert({
      diacono_id: id,
      liberado_por: eu.id,
      liberado_em: new Date().toISOString()
    }, { onConflict: 'diacono_id' })
    if(err2) throw new Error("Erro ao liberar: " + err2.message)
  }

  revalidatePath('/registros/novo')
  return true
}

export async function bloquearDiacono(id){
  const eu = await getSessionUser()
  if((eu?.oficio||'').toLowerCase()!== 'pastor') throw new Error('Só pastor pode bloquear')
  const { error } = await supabaseAdmin.from('liberacoes_diaconos').delete().eq('diacono_id', id)
  if(error) throw new Error("Erro ao bloquear: " + error.message)
  revalidatePath('/registros/novo')
  return true
}
