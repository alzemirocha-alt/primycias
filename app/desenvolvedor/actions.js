"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getDevSessionUser } from "@/lib/auth";
import { getSignedDocUrl } from "@/lib/storage";
import { revalidatePath } from "next/cache";

async function requireDev() {
  const admin = await getDevSessionUser();
  if (!admin) throw new Error("Acesso restrito ao Desenvolvedor da Plataforma.");
  return admin;
}

export async function listarIgrejasAction() {
  await requireDev();
  const { data } = await supabaseAdmin.from("igrejas").select("*").order("created_at", { ascending: false });
  return data || [];
}

export async function getDocUrlsAction(igrejaId) {
  await requireDev();
  const { data: igreja } = await supabaseAdmin
    .from("igrejas")
    .select("doc_cnpj_url, doc_responsavel_url")
    .eq("id", igrejaId)
    .maybeSingle();
  if (!igreja) return { urlCnpj: null, urlResponsavel: null };
  const [urlCnpj, urlResponsavel] = await Promise.all([
    getSignedDocUrl(igreja.doc_cnpj_url),
    getSignedDocUrl(igreja.doc_responsavel_url),
  ]);
  return { urlCnpj, urlResponsavel };
}

function calcularDataExpiracao(prazoDias) {
  if (!prazoDias) return null;
  const d = new Date();
  d.setDate(d.getDate() + Number(prazoDias));
  return d.toISOString().slice(0, 10);
}

// tipo: 'gratis' | 'paga'
// prazoDias: null (indeterminado) ou número de dias
export async function aprovarIgrejaAction(igrejaId, { tipo, prazoDias }) {
  await requireDev();
  if (!["gratis", "paga"].includes(tipo)) throw new Error("Tipo de licença inválido.");

  const dataExpiracao = calcularDataExpiracao(prazoDias);

  await supabaseAdmin
    .from("igrejas")
    .update({
      status: "ativa",
      tipo_licenca: tipo,
      data_expiracao: dataExpiracao,
      updated_at: new Date().toISOString(),
    })
    .eq("id", igrejaId);

  // Libera automaticamente o Pastor que criou a igreja (senão ninguém
  // consegue logar na igreja recém aprovada).
  await supabaseAdmin
    .from("users")
    .update({ status: "ativo", data_instalacao: new Date().toISOString().slice(0, 10) })
    .eq("igreja_id", igrejaId)
    .eq("oficio", "pastor")
    .eq("status", "pendente");

  revalidatePath("/desenvolvedor");
}

export async function reprovarIgrejaAction(igrejaId) {
  await requireDev();
  await supabaseAdmin.from("igrejas").update({ status: "reprovada" }).eq("id", igrejaId);
  revalidatePath("/desenvolvedor");
}

export async function suspenderIgrejaAction(igrejaId) {
  await requireDev();
  await supabaseAdmin.from("igrejas").update({ status: "suspensa" }).eq("id", igrejaId);
  revalidatePath("/desenvolvedor");
}

export async function reativarIgrejaAction(igrejaId) {
  await requireDev();
  await supabaseAdmin.from("igrejas").update({ status: "ativa" }).eq("id", igrejaId);
  revalidatePath("/desenvolvedor");
}

// novoPrazoDias: null (indeterminado) ou número de dias a partir de HOJE
export async function editarPrazoAction(igrejaId, novoPrazoDias) {
  await requireDev();
  const dataExpiracao = calcularDataExpiracao(novoPrazoDias);
  await supabaseAdmin.from("igrejas").update({ data_expiracao: dataExpiracao }).eq("id", igrejaId);
  revalidatePath("/desenvolvedor");
}
