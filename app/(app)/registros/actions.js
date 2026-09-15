"use server"
import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function criarRegistros(formData) {
  const eu = await getSessionUser()
  const data_culto = formData.get('data_culto')
  const segundo_diacono_id = formData.get('segundo_diacono_id')
  const itens = JSON.parse(formData.get('itens') || '[]')

  const registros = itens.filter(x => Number(x.valor) > 0).map(x => ({
    igreja_id: eu.igreja_id,
    data_culto: data_culto,
    diacono_id: eu.id,
    primeiro_diacono_id: eu.id,
    segundo_diacono_id: segundo_diacono_id,
    tipo: x.tipo,
    valor: Number(x.valor),
    membro_nome: x.membro_nome || (x.tipo === 'oferta' ? 'Oferta' : '-'),
    descricao: x.membro_nome,
    status: 'aguardando_segundo_diacono',
    criado_por: eu.id,
    diacono1_nome: eu.nome,
    diacono1_at: new Date().toISOString(),
  }))

  if (registros.length > 0) {
    await supabaseAdmin.from('records').insert(registros)
  }
  revalidatePath('/registros')
  redirect('/registros')
}

export async function confirmarRegistro(id) {
  const eu = await getSessionUser()
  const { data } = await supabaseAdmin.from('records').select('data_culto').eq('id', id).single()
  if (!data) return
  await supabaseAdmin.from('records').update({
    status: 'aguardando_tesoureiro',
    diacono2_nome: eu.nome,
    diacono2_at: new Date().toISOString(),
  }).eq('data_culto', data.data_culto)
  revalidatePath('/registros')
}

export async function validarRegistro(id) {
  const eu = await getSessionUser()
  const { data } = await supabaseAdmin.from('records').select('data_culto').eq('id', id).single()
  if (!data) return
  await supabaseAdmin.from('records').update({
    status: 'validado',
    validado_por: eu.id,
    tesoureiro_nome: eu.nome,
    tesoureiro_at: new Date().toISOString(),
    validado_em: new Date().toISOString()
  }).eq('data_culto', data.data_culto)
  revalidatePath('/registros')
}

export async function devolverRegistro(id, motivo) {
  const { data } = await supabaseAdmin.from('records').select('data_culto').eq('id', id).single()
  if (!data) return
  await supabaseAdmin.from('records').update({
    status: 'devolvido_com_erro',
    motivo_erro: motivo
  }).eq('data_culto', data.data_culto)
  revalidatePath('/registros')
}

export async function excluirRegistro(id) {
  const { data } = await supabaseAdmin.from('records').select('data_culto').eq('id', id).single()
  if (!data) return
  await supabaseAdmin.from('records').delete().eq('data_culto', data.data_culto)
  revalidatePath('/registros')
}
export async function atualizarRegistros(data_culto, itens) {
  for (const it of itens) {
    await supabaseAdmin.from('records').update({
      tipo: it.tipo,
      membro_nome: it.membro_nome,
      valor: Number(it.valor),
      status: 'aguardando_segundo_diacono',
      motivo_erro: null
    }).eq('id', it.id)
  }
  revalidatePath('/registros')
  redirect('/registros')
}
