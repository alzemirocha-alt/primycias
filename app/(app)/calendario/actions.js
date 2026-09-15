"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/constants";
import { revalidatePath } from "next/cache";

// FUNÇÃO ORIGINAL PRESERVADA - agora aceita hora também
export async function criarEventoAction(data, titulo, visibilidade, hora = null) {
  const me = await getSessionUser();
  const vis = isAdmin(me) ? visibilidade : "pessoal";

  // se vier data no formato YYYY-MM-DD e hora HH:MM, junta para salvar no data_evento se sua tabela usar
  // mantém compatibilidade com sua tabela events
  const payload = {
    igreja_id: me.igreja_id,
    data,
    titulo,
    criado_por: me.id,
    criado_por_nome: me.nome,
    visibilidade: vis,
  };

  // adiciona hora se a coluna existir (após o ALTER que te mandei)
  if (hora) {
    payload.hora = hora;
    // também salva data_evento completo para compatibilidade com tabela antiga eventos
    try {
      payload.data_evento = new Date(`${data}T${hora}:00-03:00`).toISOString();
    } catch {}
  }

  // tenta inserir em events (sua tabela original)
  const { error } = await supabaseAdmin.from("events").insert(payload);
  
  // se der erro porque ainda está em "eventos", tenta lá também (compatibilidade)
  if (error && error.message.includes("hora")) {
    delete payload.hora;
    delete payload.data_evento;
    await supabaseAdmin.from("events").insert(payload);
  }

  revalidatePath("/calendario");
  revalidatePath("/"); // para atualizar a Início
}

// FUNÇÃO ORIGINAL PRESERVADA
export async function excluirEventoAction(id) {
  const me = await getSessionUser();
  const { data: ev } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("igreja_id", me.igreja_id)
    .maybeSingle();
  
  if (!ev) {
    // tenta na tabela eventos também
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

// NOVA FUNÇÃO PARA O FORM COM DATA + HORA (usa a original por baixo)
export async function adicionarEventoAction(formData) {
  const titulo = String(formData.get("titulo") || "").trim();
  const data = formData.get("data"); // YYYY-MM-DD
  const hora = formData.get("hora"); // HH:MM
  const oficial = formData.get("oficial") === "on";
  
  if (!titulo || !data || !hora) throw new Error("Preencha título, data e hora");
  
  const visibilidade = oficial ? "conselho" : "pessoal";
  await criarEventoAction(data, titulo, visibilidade, hora);
}

// Alias para o client novo que você pediu
export const removerEventoAction = excluirEventoAction;
