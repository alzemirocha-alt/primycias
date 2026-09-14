"use server";

import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function isPastor(me) {
  const cargo = (me?.role || me?.perfil || me?.cargo || me?.funcao || "").toLowerCase();
  return cargo.includes("pastor") || cargo.includes("admin") || cargo.includes("presidente");
}

export async function excluirRegistroAction(recordId) {
  const me = await getSessionUser();
  if (!me) throw new Error("Não logado");

  const { data: registro } = await supabaseAdmin
    .from("records")
    .select("id, status, igreja_id")
    .eq("id", recordId)
    .single();

  if (!registro) {
    redirect("/registros");
  }

  if (registro.status === "validado" && !isPastor(me)) {
    throw new Error("Este registro já foi validado pelo tesoureiro. Apenas o Pastor pode excluí-lo.");
  }

  await supabaseAdmin.from("record_items").delete().eq("record_id", recordId);
  await supabaseAdmin.from("record_approvals").delete().eq("record_id", recordId);
  await supabaseAdmin.from("error_reports").delete().eq("record_id", recordId);
  await supabaseAdmin.from("records").delete().eq("id", recordId).eq("igreja_id", me.igreja_id);

  revalidatePath("/registros");
  redirect("/registros");
}

export async function corrigirEReenviarAction(recordId, dados) {
  const me = await getSessionUser();
  if (!me) throw new Error("Não logado");
  await supabaseAdmin.from("records").update({ status: "pendente", ...dados }).eq("id", recordId).eq("igreja_id", me.igreja_id);
  revalidatePath(`/registros/${recordId}`);
  revalidatePath("/registros");
}

export async function confirmarSecretarioAction(recordId) {
  const me = await getSessionUser();
  if (!me) throw new Error("Não logado");
  await supabaseAdmin.from("records").update({ status: "confirmado_secretario" }).eq("id", recordId).eq("igreja_id", me.igreja_id);
  await supabaseAdmin.from("record_approvals").insert({ record_id: recordId, user_id: me.id, status: "confirmado_secretario" });
  revalidatePath(`/registros/${recordId}`);
}

export async function validarTesoureiroAction(recordId) {
  const me = await getSessionUser();
  if (!me) throw new Error("Não logado");
  await supabaseAdmin.from("records").update({ status: "validado" }).eq("id", recordId).eq("igreja_id", me.igreja_id);
  await supabaseAdmin.from("record_approvals").insert({ record_id: recordId, user_id: me.id, status: "validado" });
  revalidatePath("/registros");
  revalidatePath(`/registros/${recordId}`);
}

export async function validarRegistroAction(recordId) {
  return validarTesoureiroAction(recordId);
}

export async function reportarErroAction(recordId, motivo) {
  const me = await getSessionUser();
  if (!me) throw new Error("Não logado");
  await supabaseAdmin.from("error_reports").insert({ record_id: recordId, user_id: me.id, motivo });
  await supabaseAdmin.from("records").update({ status: "erro" }).eq("id", recordId).eq("igreja_id", me.igreja_id);
  revalidatePath(`/registros/${recordId}`);
}
