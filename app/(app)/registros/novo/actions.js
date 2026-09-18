'use server'

function agora() { return new Date().toISOString() }

function ehTesoureiro(user) {
  if(!user) return false
  const oficio = (user.oficio||'').toLowerCase().trim()
  const funcao = (user.funcao||'').toLowerCase().trim()
  return funcao === 'tesoureiro' || oficio === 'tesoureiro'
}
function ehPastor(user){
  return (user?.oficio||'').toLowerCase().trim() === 'pastor'
}

export async function abrirCultoAction(formData){
  const { supabaseAdmin } = await import("@/lib/supabaseAdmin")
  const { getSessionUser } = await import("@/lib/auth")
  const { revalidatePath } = await import("next/cache")
  const eu = await getSessionUser()
  if(!eu?.id) throw new Error('Sessão expirada')
  let igreja_id = formData.get('igreja_id') || eu?.igreja_id
  if(!igreja_id){
    const { data: perfil } = await supabaseAdmin.from('users').select('igreja_id').eq('id', eu.id).single()
    igreja_id = perfil?.igreja_id
  }
  const data = formData.get('data')
  const periodo = (formData.get('periodo')||'manha').toLowerCase()
  if(!data) throw new Error('Data obrigatória')
  if(!['manha','noite'].includes(periodo)) throw new Error('Período inválido')
  const { data: existe } = await supabaseAdmin.from('cultos').select('id').eq('igreja_id', igreja_id).eq('data', data).eq('periodo', periodo).maybeSingle()
  if(existe) throw new Error(`Culto ${periodo} de ${new Date(data+'T12:00:00').toLocaleDateString('pt-BR')} já está aberto.`)
  const { error } = await supabaseAdmin.from('cultos').insert({ igreja_id, data, periodo, status: 'aberto', criado_por: eu.id })
  if(error) throw new Error(error.message)
  revalidatePath('/registros/novo')
  return true
}

export async function criarRegistros(formData) {
  const { supabaseAdmin } = await import("@/lib/supabaseAdmin")
  const { getSessionUser } = await import("@/lib/auth")
  const { revalidatePath } = await import("next/cache")
  const { redirect } = await import("next/navigation")
  const eu = await getSessionUser()
  const culto_id = formData.get('culto_id')
  const segundo_id = formData.get('segundo_diacono_id')
  const itens = JSON.parse(formData.get('itens'))
  const isPastor = ehPastor(eu)
  if(!culto_id) throw new Error('Selecione o culto aberto.')
  let igreja_id = formData.get('igreja_id') || eu?.igreja_id
  if(!igreja_id){
    const { data: perfil } = await supabaseAdmin.from('users').select('igreja_id').eq('id', eu.id).single()
    igreja_id = perfil?.igreja_id
  }
  if(!igreja_id) throw new Error('Igreja não identificada')
  const { data: culto } = await supabaseAdmin.from('cultos').select('id,data,periodo,igreja_id,status').eq('id', culto_id).single()
  if(!culto) throw new Error('Culto não encontrado')
  if(culto.igreja_id!== igreja_id) throw new Error('Culto de outra igreja')
  const data_culto = culto.data
  const { data: existe } = await supabaseAdmin.from('records').select('id').eq('culto_id', culto_id).eq('igreja_id', igreja_id).limit(1)
  if (existe?.length > 0) throw new Error(`Já existe registro para ${new Date(data_culto).toLocaleDateString('pt-BR')} - ${culto.periodo}. Só 1 por culto.`)
  if (ehTesoureiro(eu)) throw new Error('Tesoureiro não pode elaborar registro. Você só valida.')
  const { data: segundoUser } = await supabaseAdmin.from('users').select('id,nome,funcao,oficio').eq('id', segundo_id).single()
  if (ehTesoureiro(segundoUser)) throw new Error(`${segundoUser.nome} é Tesoureiro e só pode validar, não pode ser 2º diácono.`)
  if (eu.id === segundo_id) throw new Error('Você não pode ser os 2 diáconos ao mesmo tempo.')
  if (!isPastor) {
    const { data: ultimo } = await supabaseAdmin.from('records').select('data_culto, primeiro_diacono_id, segundo_diacono_id').eq('igreja_id', igreja_id).order('created_at', { ascending: false }).limit(1)
    if (ultimo?.length > 0) {
      const ult = ultimo[0]
      let bloqueados = [ult.primeiro_diacono_id, ult.segundo_diacono_id].filter(Boolean)
      const { data: liberados } = await supabaseAdmin.from('liberacoes_diaconos').select('diacono_id').eq('igreja_id', igreja_id)
      const idsLiberados = (liberados||[]).map(l=>l.diacono_id)
      bloqueados = bloqueados.filter(id =>!idsLiberados.includes(id))
      if (bloqueados.includes(eu.id)) throw new Error(`Você participou do último culto (${new Date(ult.data_culto).toLocaleDateString('pt-BR')}). Só o Pastor pode liberar.`)
      if (bloqueados.includes(segundo_id)) throw new Error(`${segundoUser?.nome || 'Diácono'} participou do último culto e está bloqueado. Só o Pastor pode liberar.`)
    }
  }
  try{ await supabaseAdmin.from('liberacoes_diaconos').delete().in('diacono_id', [eu.id, segundo_id]).eq('igreja_id', igreja_id) }catch{}
  const hist = [{ acao: isPastor? 'CRIOU (Pastor)' : 'CRIOU', usuario: eu.nome, em: agora(), culto: `${data_culto} ${culto.periodo}` }]
  const paraInserir = itens.filter(i=>i.membro_nome && i.valor).map(it=>({
    tipo: it.tipo.toLowerCase(), membro_nome: it.membro_nome, valor: Number(it.valor), data_culto, culto_id,
    primeiro_diacono_id: eu.id, segundo_diacono_id: segundo_id, diacono_id: eu.id,
    diacono1_nome: eu.nome, diacono1_at: agora(), status: 'aguardando_segundo_diacono', historico: hist, igreja_id
  }))
  const { error } = await supabaseAdmin.from('records').insert(paraInserir)
  if(error) throw new Error(error.message)
  revalidatePath('/registros'); redirect('/registros')
}

export async function confirmarRegistro(id) {
  const { supabaseAdmin } = await import("@/lib/supabaseAdmin")
  const { getSessionUser } = await import("@/lib/auth")
  const { revalidatePath } = await import("next/cache")
  const eu = await getSessionUser()
  const { data: reg } = await supabaseAdmin.from('records').select('data_culto, culto_id, historico, igreja_id').eq('id', id).single()
  let query = supabaseAdmin.from('records').select('id,historico').eq('igreja_id', reg.igreja_id)
  if(reg.culto_id) query = query.eq('culto_id', reg.culto_id)
  else query = query.eq('data_culto', reg.data_culto)
  const { data: todos } = await query
  for (const r of todos) {
    const hist = [...(r.historico||[]), { acao: 'CONFIRMOU e enviou ao Tesoureiro', usuario: eu.nome, em: agora() }]
    await supabaseAdmin.from('records').update({ status: 'aguardando_tesoureiro', diacono2_nome: eu.nome, diacono2_at: agora(), historico: hist }).eq('id', r.id)
  }
  revalidatePath('/registros')
}

export async function validarRegistro(id) {
  const { supabaseAdmin } = await import("@/lib/supabaseAdmin")
  const { getSessionUser } = await import("@/lib/auth")
  const { revalidatePath } = await import("next/cache")
  const eu = await getSessionUser()
  const { data: reg } = await supabaseAdmin.from('records').select('data_culto, culto_id, historico, igreja_id').eq('id', id).single()
  let query = supabaseAdmin.from('records').select('id,historico').eq('igreja_id', reg.igreja_id)
  if(reg.culto_id) query = query.eq('culto_id', reg.culto_id)
  else query = query.eq('data_culto', reg.data_culto)
  const { data: todos } = await query
  for (const r of todos) {
    const hist = [...(r.historico||[]), { acao: 'VALIDOU como Tesoureiro', usuario: eu.nome, em: agora() }]
    await supabaseAdmin.from('records').update({ status: 'validado', tesoureiro_nome: eu.nome, tesoureiro_at: agora(), historico: hist }).eq('id', r.id)
  }
  try{ if(reg.culto_id) await supabaseAdmin.from('cultos').update({ status: 'validado' }).eq('id', reg.culto_id) }catch{}
  revalidatePath('/registros')
}

export async function devolverRegistro(id, motivo) {
  const { supabaseAdmin } = await import("@/lib/supabaseAdmin")
  const { getSessionUser } = await import("@/lib/auth")
  const { revalidatePath } = await import("next/cache")
  const eu = await getSessionUser()
  const { data: reg } = await supabaseAdmin.from('records').select('data_culto, culto_id, historico, igreja_id').eq('id', id).single()
  let query = supabaseAdmin.from('records').select('id,historico').eq('igreja_id', reg.igreja_id)
  if(reg.culto_id) query = query.eq('culto_id', reg.culto_id)
  else query = query.eq('data_culto', reg.data_culto)
  const { data: todos } = await query
  for (const r of todos) {
    const hist = [...(r.historico||[]), { acao: `DEVOLVEU: ${motivo}`, usuario: eu.nome, em: agora() }]
    await supabaseAdmin.from('records').update({ status: 'devolvido_com_erro', motivo_erro: motivo, historico: hist }).eq('id', r.id)
  }
  revalidatePath('/registros')
}

export async function excluirRegistro(id) {
  const { supabaseAdmin } = await import("@/lib/supabaseAdmin")
  const { revalidatePath } = await import("next/cache")
  const { data: reg } = await supabaseAdmin.from('records').select('data_culto, culto_id, igreja_id').eq('id', id).single()
  if(reg?.culto_id) await supabaseAdmin.from('records').delete().eq('culto_id', reg.culto_id).eq('igreja_id', reg.igreja_id)
  else await supabaseAdmin.from('records').delete().eq('data_culto', reg.data_culto).eq('igreja_id', reg.igreja_id)
  revalidatePath('/registros')
}

export async function corrigirRegistro(formData){
  const { supabaseAdmin } = await import("@/lib/supabaseAdmin")
  const { getSessionUser } = await import("@/lib/auth")
  const { revalidatePath } = await import("next/cache")
  const { redirect } = await import("next/navigation")
  const eu = await getSessionUser()
  const data_culto = formData.get('data_culto')
  const culto_id = formData.get('culto_id')
  const segundo_id = formData.get('segundo_diacono_id')
  const itens = JSON.parse(formData.get('itens'))
  let igreja_id = formData.get('igreja_id') || eu?.igreja_id
  if(!igreja_id){
    const { data: perfil } = await supabaseAdmin.from('users').select('igreja_id').eq('id', eu.id).single()
    igreja_id = perfil?.igreja_id
  }
  if(culto_id) await supabaseAdmin.from('records').delete().eq('culto_id', culto_id).eq('igreja_id', igreja_id)
  else await supabaseAdmin.from('records').delete().eq('data_culto', data_culto).eq('igreja_id', igreja_id)
  const hist = [{ acao: 'CORRIGIU e reenviou ao 2º Diácono', usuario: eu.nome, em: agora() }]
  const paraInserir = itens.filter(i=>i.membro_nome && i.valor).map(it=>({
    tipo: it.tipo.toLowerCase(), membro_nome: it.membro_nome, valor: Number(it.valor),
    data_culto, culto_id: culto_id || null, primeiro_diacono_id: eu.id, segundo_diacono_id: segundo_id,
    diacono_id: eu.id, diacono1_nome: eu.nome, diacono1_at: agora(),
    status: 'aguardando_segundo_diacono', motivo_erro: null, historico: hist, igreja_id
  }))
  const { error } = await supabaseAdmin.from('records').insert(paraInserir)
  if(error) throw new Error(error.message)
  revalidatePath('/registros'); redirect('/registros')
}

export async function atualizarRegistros(data_culto_param, itens) {
  const { supabaseAdmin } = await import("@/lib/supabaseAdmin")
  const { getSessionUser } = await import("@/lib/auth")
  const { revalidatePath } = await import("next/cache")
  const { redirect } = await import("next/navigation")
  const eu = await getSessionUser()
  const data_culto = typeof data_culto_param === 'string'? data_culto_param.split('T')[0] : new Date(data_culto_param).toISOString().split('T')[0]
  let igreja_id = eu?.igreja_id
  if(!igreja_id){
    const { data: perfil } = await supabaseAdmin.from('users').select('igreja_id').eq('id', eu.id).single()
    igreja_id = perfil?.igreja_id
  }
  const { data: original } = await supabaseAdmin.from('records').select('segundo_diacono_id, culto_id, igreja_id').eq('data_culto', data_culto).eq('igreja_id', igreja_id).limit(1).single()
  const segundo_id = original?.segundo_diacono_id
  const culto_id = original?.culto_id
  if(culto_id) await supabaseAdmin.from('records').delete().eq('culto_id', culto_id).eq('igreja_id', igreja_id)
  else await supabaseAdmin.from('records').delete().eq('data_culto', data_culto).eq('igreja_id', igreja_id)
  const hist = [{ acao: 'CORRIGIU e reenviou ao 2º Diácono', usuario: eu.nome, em: agora() }]
  const paraInserir = itens.filter(i=>i.membro_nome && i.valor).map(it=>({
    tipo: it.tipo.toLowerCase(), membro_nome: it.membro_nome, valor: Number(it.valor),
    data_culto, culto_id, primeiro_diacono_id: eu.id, segundo_diacono_id: segundo_id,
    diacono_id: eu.id, diacono1_nome: eu.nome, diacono1_at: agora(),
    status: 'aguardando_segundo_diacono', motivo_erro: null, historico: hist, igreja_id
  }))
  const { error } = await supabaseAdmin.from('records').insert(paraInserir)
  if(error) throw new Error(error.message)
  revalidatePath('/registros'); redirect('/registros')
}

export async function liberarDiacono(id){
  const { supabaseAdmin } = await import("@/lib/supabaseAdmin")
  const { getSessionUser } = await import("@/lib/auth")
  const { revalidatePath } = await import("next/cache")
  const eu = await getSessionUser()
  if(!ehPastor(eu)) throw new Error('Só pastor pode liberar')
  let igreja_id = eu?.igreja_id
  if(!igreja_id){
    const { data: perfil } = await supabaseAdmin.from('users').select('igreja_id').eq('id', eu.id).single()
    igreja_id = perfil?.igreja_id
  }
  let { error } = await supabaseAdmin.from('liberacoes_diaconos').upsert({
    diacono_id: id, liberado_por: eu.id, liberado_em: new Date().toISOString(), igreja_id
  }, { onConflict: 'diacono_id' })
  if (error) {
    const { error: err2 } = await supabaseAdmin.from('liberacoes_diaconos').upsert({
      diacono_id: id, liberado_por: eu.id, liberado_em: new Date().toISOString()
    }, { onConflict: 'diacono_id' })
    if(err2) throw new Error("Erro ao liberar: " + err2.message)
  }
  revalidatePath('/registros/novo')
  return true
}

export async function bloquearDiacono(id){
  const { supabaseAdmin } = await import("@/lib/supabaseAdmin")
  const { getSessionUser } = await import("@/lib/auth")
  const { revalidatePath } = await import("next/cache")
  const eu = await getSessionUser()
  if(!ehPastor(eu)) throw new Error('Só pastor pode bloquear')
  const { error } = await supabaseAdmin.from('liberacoes_diaconos').delete().eq('diacono_id', id)
  if(error) throw new Error("Erro ao bloquear: " + error.message)
  revalidatePath('/registros/novo')
  return true
}
