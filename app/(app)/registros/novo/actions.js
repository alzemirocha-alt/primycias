"use server"
import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { revalidatePath } from "next/cache"

export async function abrirCultoAction(formData){
  const eu = await getSessionUser()
  const data = formData.get('data')
  const periodo = formData.get('periodo')
  const igreja_id = formData.get('igreja_id') || eu?.igreja_id
  const { error } = await supabaseAdmin.from('cultos').insert({ data, periodo, igreja_id, status:'aberto', criado_por: eu.id })
  if(error) throw new Error(error.message)
  revalidatePath('/registros/novo')
}

export async function liberarDiacono(diocono_id){
  const eu = await getSessionUser()
  const { data: me } = await supabaseAdmin.from('users').select('oficio').eq('id', eu.id).single()
  if((me?.oficio||'').toLowerCase() !== 'pastor') throw new Error('Só pastor libera')
  const { data: euFull } = await supabaseAdmin.from('users').select('igreja_id').eq('id', eu.id).single()
  await supabaseAdmin.from('liberacoes_diaconos').upsert({ diacono_id, igreja_id: euFull?.igreja_id, liberado_por: eu.id }, { onConflict: 'diacono_id,igreja_id' })
  revalidatePath('/registros/novo')
}

export async function bloquearDiacono(diocono_id){
  const eu = await getSessionUser()
  const { data: me } = await supabaseAdmin.from('users').select('oficio').eq('id', eu.id).single()
  if((me?.oficio||'').toLowerCase() !== 'pastor') throw new Error('Só pastor libera')
  const { data: euFull } = await supabaseAdmin.from('users').select('igreja_id').eq('id', eu.id).single()
  await supabaseAdmin.from('liberacoes_diaconos').delete().eq('diacono_id', diocono_id).eq('igreja_id', euFull?.igreja_id)
  revalidatePath('/registros/novo')
}

export async function criarRegistros(formData){
  const eu = await getSessionUser()
  const igreja_id = formData.get('igreja_id')
  const culto_id = formData.get('culto_id')
  const data_culto = formData.get('data_culto')
  const segundo_id = formData.get('segundo_diacono_id')
  const itens = JSON.parse(formData.get('itens')||'[]')
  const { data: rec, error } = await supabaseAdmin.from('records').insert({ igreja_id, culto_id, data_culto, primeiro_diacono_id: eu.id, segundo_diacono_id: segundo_id }).select().single()
  if(error) throw new Error(error.message)
  if(itens?.length){
    const toInsert = itens.filter(i=>i.valor).map(i=>({ record_id: rec.id, igreja_id, tipo: i.tipo, membro_nome: i.membro_nome, valor: Number(i.valor)||0 }))
    if(toInsert.length) await supabaseAdmin.from('record_itens').insert(toInsert)
  }
  revalidatePath('/registros')
}
