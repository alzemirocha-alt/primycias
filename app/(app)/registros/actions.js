"use server"
import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function criarRegistroAction(formData) {
  const me = await getSessionUser()
  console.log("USUARIO LOGADO:", me)

  const payload = {
    igreja_id: me.igreja_id,
    diacono_id: me.id,
    criado_por: me.id,
    primeiro_diacono_id: me.id,
    segundo_diacono_id: formData.get("segundo_diacono_id") || null,
    tipo: formData.get("tipo") || "dizimo",
    valor: Number(formData.get("valor") || 0),
    membro_nome: formData.get("membro_nome") || null,
    data_culto: new Date().toISOString().split('T')[0],
    status: "aguardando_segundo_diacono"
  }

  console.log("TENTANDO SALVAR:", payload)

  const { data, error } = await supabaseAdmin.from("records").insert(payload).select().single()

  if (error) {
    console.error("ERRO SUPABASE:", error)
    throw new Error(JSON.stringify(error))
  }

  revalidatePath("/registros")
  redirect("/registros")
}

export async function confirmarSegundoDiaconoAction(id){
  await supabaseAdmin.from("records").update({ status: "aguardando_tesoureiro" }).eq("id", id)
  revalidatePath("/registros"); redirect("/registros")
}
export async function validarTesoureiroAction(id){
  const me = await getSessionUser()
  await supabaseAdmin.from("records").update({ status: "validado", validado_por: me.id }).eq("id", id)
  revalidatePath("/registros"); redirect("/registros")
}
export async function reportarErroAction(id, motivo){
  const me = await getSessionUser()
  await supabaseAdmin.from("records").update({ status: "erro_reportado" }).eq("id", id)
  revalidatePath("/registros"); redirect("/registros")
}
export async function excluirRegistroAction(id){
  await supabaseAdmin.from("records").delete().eq("id", id)
  revalidatePath("/registros"); redirect("/registros")
}
