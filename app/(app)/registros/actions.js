"use server";

import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";

// FUNÇÃO QUE ESTAVA QUEBRANDO - AGORA CORRIGIDA
export async function excluirRegistroAction(recordId) {
  const me = await getSessionUser();
  if (!me) throw new Error("Não logado");

  console.log("TENTANDO EXCLUIR COMO:", me.id, me.email);

  // apaga filhos primeiro para não dar erro de chave estrangeira
  await supabaseAdmin.from("record_items").delete().eq("record_id", recordId);
  await supabaseAdmin.from("record_approvals").delete().eq("record_id", recordId);
  await supabaseAdmin.from("error_reports").delete().eq("record_id", recordId);
  
  const { error } = await supabaseAdmin.from("records").delete().eq("id", recordId).eq("igreja_id", me.igreja_id);
  
  if (error) {
    console.error("ERRO SUPABASE AO EXCLUIR:", error);
    throw new Error(error.message);
  }

  revalidatePath("/registros");
}

// Mantém as outras funções que seu arquivo já tinha
// Se seu arquivo tinha mais funções, elas continuam abaixo. 
// Se não tinha, pode deixar só essa que já vai funcionar.

export async function validarRegistroAction(recordId) {
  const me = await getSessionUser();
  if (!me) throw new Error("Não logado");
  await supabaseAdmin.from("records").update({ status: "validado" }).eq("id", recordId).eq("igreja_id", me.igreja_id);
  await supabaseAdmin.from("record_approvals").insert({ record_id: recordId, user_id: me.id, status: "aprovado" });
  revalidatePath("/registros");
  revalidatePath(`/registros/${recordId}`);
}

export async function reportarErroAction(recordId, motivo) {
  const me = await getSessionUser();
  if (!me) throw new Error("Não logado");
  await supabaseAdmin.from("error_reports").insert({ record_id: recordId, user_id: me.id, motivo });
  await supabaseAdmin.from("records").update({ status: "erro" }).eq("id", recordId).eq("igreja_id", me.igreja_id);
  revalidatePath(`/registros/${recordId}`);
}
