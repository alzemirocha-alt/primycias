"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/constants";
import { revalidatePath } from "next/cache";

export async function criarAvisoAction({ tipo, titulo, conteudo }) {
  const me = await getSessionUser();
  if (!isAdmin(me)) throw new Error("Apenas Pastor e Secretário do Conselho podem publicar avisos.");
  if (!conteudo) throw new Error("Preencha o conteúdo do aviso.");
  await supabaseAdmin.from("avisos").insert({
    igreja_id: me.igreja_id, tipo, titulo: titulo || null, conteudo, criado_por: me.id, criado_por_nome: me.nome,
  });
  revalidatePath("/dashboard");
}

export async function excluirAvisoAction(id) {
  const me = await getSessionUser();
  if (!isAdmin(me)) throw new Error("Apenas Pastor e Secretário do Conselho podem remover avisos.");
  await supabaseAdmin.from("avisos").delete().eq("id", id).eq("igreja_id", me.igreja_id);
  revalidatePath("/dashboard");
}
