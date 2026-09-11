"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/constants";
import { revalidatePath } from "next/cache";

export async function criarEventoAction(data, titulo, visibilidade) {
  const me = await getSessionUser();
  const vis = isAdmin(me) ? visibilidade : "pessoal";
  await supabaseAdmin.from("events").insert({
    igreja_id: me.igreja_id, data, titulo, criado_por: me.id, criado_por_nome: me.nome, visibilidade: vis,
  });
  revalidatePath("/calendario");
}

export async function excluirEventoAction(id) {
  const me = await getSessionUser();
  const { data: ev } = await supabaseAdmin.from("events").select("*").eq("id", id).eq("igreja_id", me.igreja_id).maybeSingle();
  if (!ev) return;
  if (ev.criado_por !== me.id && !isAdmin(me)) throw new Error("Sem permissão para excluir este evento.");
  await supabaseAdmin.from("events").delete().eq("id", id);
  revalidatePath("/calendario");
}
