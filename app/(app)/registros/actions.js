"use server"
import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

function getCargo(me){ 
  return (me?.role || me?.cargo || me?.perfil || "").toLowerCase() 
}

// 1. CRIAR - ESSA É A LINHA QUE CORRIGE O SUMIÇO
export async function criarRegistroAction(formData) {
  const me = await getSessionUser()
  if (!me) throw new Error("Não logado")
  
  const tipo = formData.get("tipo") // dizimo ou oferta
  const valor = formData.get("valor")
  const membro_nome = formData.get("membro_nome")
  const segundo_diacono_id = formData.get("segundo_diacono_id")
  const data_culto = formData.get("data_culto")

  const { data, error } = await supabaseAdmin
    .from("records")
    .insert({
      igreja_id: me.igreja_id, // <-- ESSA LINHA AQUI QUE FAZIA SUMIR QUANDO ERA NULL
      criado_por: me.id,
      primeiro_diacono_id: me.id,
      segundo_diacono_id: segundo_diacono_id || null,
      tipo: tipo,
      valor: Number(valor),
      membro_nome: membro_nome || null,
      data_culto: data_culto || new Date().toISOString(),
      status: segundo_diacono_id ? "aguardando_segundo_diacono" : "aguardando_tesoureiro",
    })
    .select()
    .single()

  if (error) {
    console.error("ERRO AO CRIAR:", error)
    throw new Error(error.message)
  }

  revalidatePath("/registros")
  redirect("/registros")
}

// 2. SEGUNDO DIÁCONO CONFIRMA
export async function confirmarSegundoDiaconoAction(recordId) {
  const me = await getSessionUser()
  if (!me) throw new Error("Não logado")

  await supabaseAdmin
    .from("records")
    .update({ 
      status: "aguardando_tesoureiro",
      confirmado_segundo_em: new Date().toISOString()
    })
    .eq("id", recordId)

  revalidatePath("/registros")
  redirect("/registros")
}

// 3. TESOUREIRO VALIDA - LEMBRANDO QUE ELE PODE VALIDAR
export async function validarTesoureiroAction(recordId) {
  const me = await getSessionUser()
  if (!me) throw new Error("Não logado")

  await supabaseAdmin
    .from("records")
    .update({ 
      status: "validado", 
      validado_por: me.id,
      validado_em: new Date().toISOString()
    })
    .eq("id", recordId)

  revalidatePath("/registros")
  redirect("/registros")
}

// 4. TESOUREIRO REPORTA ERRO - OU REPORTAR ERRO
export async function reportarErroAction(recordId, motivo) {
  const me = await getSessionUser()
  if (!me) throw new Error("Não logado")

  await supabaseAdmin
    .from("error_reports")
    .insert({ 
      record_id: recordId, 
      reportado_por: me.id, 
      motivo: motivo 
    })

  await supabaseAdmin
    .from("records")
    .update({ status: "erro_reportado" })
    .eq("id", recordId)

  revalidatePath("/registros")
  redirect("/registros")
}

// 5. EXCLUIR COM TRAVA
export async function excluirRegistroAction(recordId) {
  const me = await getSessionUser()
  if (!me) throw new Error("Não logado")

  const cargo = getCargo(me)
  const isPastor = cargo.includes("pastor") || cargo.includes("admin") || cargo.includes("presid")

  const { data: reg } = await supabaseAdmin
    .from("records")
    .select("status")
    .eq("id", recordId)
    .single()

  if (reg?.status === "validado" && !isPastor) {
    throw new Error("Apenas o Pastor pode excluir registro já validado pelo Tesoureiro")
  }

  await supabaseAdmin.from("records").delete().eq("id", recordId)
  
  revalidatePath("/registros")
  redirect("/registros")
}
