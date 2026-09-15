"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/constants";
import { revalidatePath } from "next/cache";

export async function criarAvisoAction(input) {
  const me = await getSessionUser();
  if (!isAdmin(me)) throw new Error("Apenas Pastor e Secretário do Conselho podem publicar avisos.");

  // Aceita tanto objeto {tipo,titulo,conteudo} quanto FormData do seu form com anexo
  let tipo, titulo, conteudo, arquivo_url, link_youtube, link_externo, integrar_com_agenda;

  if (input instanceof FormData) {
    tipo = input.get("tipo");
    titulo = input.get("titulo");
    conteudo = input.get("conteudo") || input.get("mensagem");
    arquivo_url = input.get("arquivo_url") || input.get("arquivo") || input.get("anexo");
    link_youtube = input.get("link_youtube") || input.get("youtube");
    link_externo = input.get("link_externo");
    integrar_com_agenda = input.get("integrar_com_agenda") === "on" || input.get("integrarAgenda") === "on";
  } else {
    tipo = input?.tipo;
    titulo = input?.titulo;
    conteudo = input?.conteudo;
    arquivo_url = input?.arquivo_url;
    link_youtube = input?.link_youtube;
    link_externo = input?.link_externo;
    integrar_com_agenda = input?.integrar_com_agenda;
  }

  if (!conteudo) throw new Error("Preencha o conteúdo do aviso.");

  // FIX DO ERRO: nunca deixa tipo ir null
  tipo = String(tipo || "lideranca").trim().toLowerCase() || "lideranca";

  const payload = {
    igreja_id: me.igreja_id,
    tipo, // agora sempre tem valor
    titulo: titulo || conteudo.slice(0, 80) || null,
    conteudo,
    criado_por: me.id,
    criado_por_nome: me.nome,
    // campos extras do seu print - se existirem na tabela salvam, se não, o Supabase ignora no insert abaixo
    ...(arquivo_url ? { arquivo_url: String(arquivo_url) } : {}),
    ...(link_youtube ? { link_youtube: String(link_youtube) } : {}),
    ...(link_externo ? { link_externo: String(link_externo) } : {}),
    ...(integrar_com_agenda !== undefined ? { integrar_com_agenda } : {}),
  };

  const { error } = await supabaseAdmin.from("avisos").insert(payload);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}

export async function excluirAvisoAction(id) {
  const me = await getSessionUser();
  if (!isAdmin(me)) throw new Error("Apenas Pastor e Secretário do Conselho podem remover avisos.");
  await supabaseAdmin.from("avisos").delete().eq("id", id).eq("igreja_id", me.igreja_id);
  revalidatePath("/dashboard");
}
