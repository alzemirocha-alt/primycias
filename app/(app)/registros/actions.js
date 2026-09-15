'use server'
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSessionUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

function agoraBR() { return new Date().toISOString() }
function pushHist(historico, acao, usuario) {
  const lista = Array.isArray(historico) ? historico : []
  lista.push({ acao, usuario_nome: usuario.nome, usuario_id: usuario.id, em: agoraBR() })
  return lista
}

export async function criarRegistros(formData) {
  const eu = await getSessionUser()
  const data_culto = formData.get('data_culto')
  const segundo_id = formData.get('segundo_diacono_id')
  const itens = JSON.parse(formData.get('itens'))
  const histInicial = [{ acao: 'CRIOU registro inicial', usuario_nome: eu.nome, usuario_id: eu.id, em: agoraBR() }]

  for (const it of itens) {
    await supabaseAdmin.from('records').insert({
      tipo: it.tipo.toLowerCase(), // salva minusculo mas mostra maiusculo
      membro_nome: it.membro_nome,
      valor: Number(it.valor),
      data_culto,
      primeiro_diacono_id: eu.id,
      segundo_diacono_id: segundo_id,
      diacono_id: eu.id,
      diacono1_nome: eu.nome,
      diacono1_at: agoraBR(),
      status: 'aguardando_segundo_diacono',
      historico: histInicial
    })
  }
  revalidatePath('/registros'); redirect('/registros')
}

export async function confirmarRegistro(id) {
  const eu = await getSessionUser()
  const { data: reg } = await supabaseAdmin.from('records').select('*').eq('id', id).single()
  const novoHist = pushHist(reg.historico, 'CONFIRMOU e enviou para Tesoureiro', eu)
  await supabaseAdmin.from('records').update({ data_culto: reg.data_culto }).eq('data_culto', reg.data_culto).then(async () => {
    const { data: todos } = await supabaseAdmin.from('records').select('*').eq('data_culto', reg.data_culto)
    for (const r of todos) {
      await supabaseAdmin.from('records').update({ status: 'aguardando_tesoureiro', diacono2_nome: eu.nome, diacono2_at: agoraBR(), historico: pushHist(r.historico, 'CONFIRMOU e enviou para Tesoureiro', eu) }).eq('id', r.id)
    }
  })
  revalidatePath('/registros')
}

export async function validarRegistro(id) {
  const eu = await getSessionUser()
  const { data: reg } = await supabaseAdmin.from('records').select('*').eq('id', id).single()
  const { data: todos } = await supabaseAdmin.from('records').select('*').eq('data_culto', reg.data_culto)
  for (const r of todos) {
    await supabaseAdmin.from('records').update({ status: 'validado', tesoureiro_nome: eu.nome, tesoureiro_at: agoraBR(), historico: pushHist(r.historico, 'VALIDOU como Tesoureiro', eu) }).eq('id', r.id)
  }
  revalidatePath('/registros')
}

export async function devolverRegistro(id, motivo) {
  const eu = await getSessionUser()
  const { data: reg } = await supabaseAdmin.from('records').select('*').eq('id', id).single()
  const { data: todos } = await supabaseAdmin.from('records').select('*').eq('data_culto', reg.data_culto)
  for (const r of todos) {
    await supabaseAdmin.from('records').update({ status: 'devolvido_com_erro', motivo_erro: motivo, historico: pushHist(r.historico, `DEVOLVEU com erro: ${motivo}`, eu) }).eq('id', r.id)
  }
  revalidatePath('/registros')
}

export async function atualizarRegistros(data_culto, itens) {
  const eu = await getSessionUser()
  const { data: todos } = await supabaseAdmin.from('records').select('*').eq('data_culto', data_culto)
  for (const it of itens) {
    const regAnt = todos.find(t => t.id === it.id)
    await supabaseAdmin.from('records').update({ tipo: it.tipo.toLowerCase(), membro_nome: it.membro_nome, valor: Number(it.valor), status: 'aguardando_segundo_diacono', motivo_erro: null, historico: pushHist(regAnt.historico, `CORRIGIU valores - R$ ${it.valor}`, eu) }).eq('id', it.id)
  }
  revalidatePath('/registros'); redirect('/registros')
}

export async function excluirRegistro(id) {
  const { data: reg } = await supabaseAdmin.from('records').select('data_culto').eq('id', id).single()
  await supabaseAdmin.from('records').delete().eq('data_culto', reg.data_culto)
  revalidatePath('/registros')
}
