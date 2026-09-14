"use server"
import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

function getCargo(me){ return (me?.role || me?.cargo || me?.perfil || "").toLowerCase() }

// --- ARQUIVO 1: CRIA E NÃO SOME MAIS ---
export async function criarRegistroAction(formData) {
  const me = await getSessionUser()
  if (!me) throw new Error("Não logado")
  
  const tipo = formData.get("tipo")
  const valor = formData.get("valor")
  const membro_nome = formData.get("membro_nome")
  const segundo_diacono_id = formData.get("segundo_diacono_id")
  const data_culto = formData.get("data_culto")

  const { error } = await supabaseAdmin.from("records").insert({
    igreja_id: me.igreja_id, // ESSA LINHA QUE CORRIGE O SUMIÇO
    criado_por: me.id,
    primeiro_diacono_id: me.id,
    segundo_diacono_id: segundo_diacono_id || null,
    tipo, valor: Number(valor), membro_nome: membro_nome || null,
    data_culto: data_culto || new Date().toISOString(),
    status: segundo_diacono_id ? "aguardando_segundo_diacono" : "aguardando_tesoureiro",
  })
  if (error) throw new Error(error.message)
  revalidatePath("/registros")
  redirect("/registros")
}

// --- ARQUIVO 3: AÇÕES DO TESOUREIRO E PASTOR ---
export async function confirmarSegundoDiaconoAction(recordId) {
  await supabaseAdmin.from("records").update({ status: "aguardando_tesoureiro" }).eq("id", recordId)
  revalidatePath("/registros")
}

export async function validarTesoureiroAction(recordId) {
  const me = await getSessionUser()
  await supabaseAdmin.from("records").update({ status: "validado", validado_por: me.id }).eq("id", recordId)
  revalidatePath("/registros")
  redirect("/registros")
}

export async function reportarErroAction(recordId, motivo) {
  const me = await getSessionUser()
  await supabaseAdmin.from("error_reports").insert({ record_id: recordId, reportado_por: me.id, motivo })
  await supabaseAdmin.from("records").update({ status: "erro_reportado" }).eq("id", recordId)
  revalidatePath("/registros")
  redirect("/registros")
}

export async function excluirRegistroAction(recordId) {
  const me = await getSessionUser()
  const cargo = getCargo(me)
  const isPastor = cargo.includes("pastor") || cargo.includes("admin")
  const { data: reg } = await supabaseAdmin.from("records").select("status").eq("id", recordId).single()
  if (reg?.status === "validado" && !isPastor) throw new Error("Apenas o Pastor pode excluir registro já validado")
  await supabaseAdmin.from("records").delete().eq("id", recordId)
  revalidatePath("/registros")
  redirect("/registros")
}
