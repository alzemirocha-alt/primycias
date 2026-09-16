"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/constants";
import { revalidatePath } from "next/cache";

export async function criarEventoAction(data, titulo, visibilidade, hora = null) {
  const me = await getSessionUser();
  const vis = isAdmin(me) ? visibilidade : "pessoal";

  const payload = {
    igreja_id: me.igreja_id,
    data,
    titulo,
    criado_por: me.id,
    criado_por_nome: me.nome,
    visibilidade: vis,
  };

  if (hora) {
    payload.hora = hora;
    try {
      payload.data_evento = new Date(`${data}T${hora}:00-03:00`).toISOString();
    } catch {}
  }

  const { error } = await supabaseAdmin.from("events").insert(payload);
  
  if (error && error.message.includes("hora")) {
    delete payload.hora;
    delete payload.data_evento;
    await supabaseAdmin.from("events").insert(payload);
  }

  revalidatePath("/calendario");
  revalidatePath("/");
}

export async function excluirEventoAction(id) {
  const me = await getSessionUser();
  const { data: ev } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("igreja_id", me.igreja_id)
    .maybeSingle();
  
  if (!ev) {
    const { data: ev2 } = await supabaseAdmin.from("eventos").select("*").eq("id", id).maybeSingle();
    if (!ev2) return;
    if (ev2.criado_por !== me.id && !isAdmin(me)) throw new Error("Sem permissão para excluir este evento.");
    await supabaseAdmin.from("eventos").delete().eq("id", id);
  } else {
    if (ev.criado_por !== me.id && !isAdmin(me)) throw new Error("Sem permissão para excluir este evento.");
    await supabaseAdmin.from("events").delete().eq("id", id);
  }
  
  revalidatePath("/calendario");
  revalidatePath("/");
}

export async function adicionarEventoAction(formData) {
  const titulo = String(formData.get("titulo") || "").trim();
  const data = formData.get("data");
  const hora = formData.get("hora");
  const oficial = formData.get("oficial") === "on";
  
  if (!titulo || !data || !hora) throw new Error("Preencha título, data e hora");
  
  const visibilidade = oficial ? "conselho" : "pessoal";
  await criarEventoAction(data, titulo, visibilidade, hora);
}

// CORRIGIDO - ANTES ERA const, AGORA É async function
export async function removerEventoAction(id) {
  return excluirEventoAction(id);
}
