"use server";
import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { redirect } from "next/navigation";

async function getMeuCargo(userId) {
  const { data } = await supabaseAdmin.from("users").select("cargo").eq("id", userId).single();
  return (data?.cargo || '').toLowerCase();
}

export async function criarRegistroAction(formData) {
  const user = await getSessionUser();
  const cargo = await getMeuCargo(user.id);
  if (cargo.includes('tesour') || cargo.includes('pastor') || cargo.includes('presb')) throw new Error("Apenas diáconos (exceto tesoureiro) podem lançar.");
  if (!cargo.includes('diacono')) throw new Error("Apenas diáconos podem lançar.");

  const data_culto = formData.get("data_culto");
  const igreja_id = formData.get("igreja_id");
  const segundo_diacono_id = formData.get("segundo_diacono_id");
  const linhas = JSON.parse(formData.get("linhas_json"));

  // Aqui você mantém sua regra do rodízio + exceção do pastor que já tinha
  // Ex: if (rodizioBloqueado &&!liberadoPeloPastor) throw...

  const registros = linhas.filter(l=>l.nome && parseFloat(l.valor)>0).map(l=>({
    igreja_id, data_culto, tipo: l.tipo, nome_dizimista: l.nome, valor: parseFloat(l.valor),
    lancado_por: user.id, segundo_diacono_id, status: 'pendente_confirmacao'
  }));
  const { error } = await supabaseAdmin.from("registros").insert(registros);
  if (error) throw new Error(error.message);
  redirect("/registros");
}

export async function confirmarRegistroAction(formData) {
  const user = await getSessionUser();
  const cargo = await getMeuCargo(user.id);
  if (cargo.includes('tesour')) throw new Error("Tesoureiro não pode confirmar, só validar.");

  const registroId = formData.get("registro_id");
  const { data: reg } = await supabaseAdmin.from("registros").select("segundo_diacono_id").eq("id", registroId).single();
  if (reg.segundo_diacono_id!== user.id) throw new Error("Apenas o 2º diácono selecionado pode conferir este registro.");

  await supabaseAdmin.from("registros").update({ status: 'pendente_validacao', confirmado_por: user.id, confirmado_em: new Date().toISOString() }).eq("id", registroId);
  redirect("/registros");
}

export async function validarRegistroAction(formData) {
  const user = await getSessionUser();
  const cargo = await getMeuCargo(user.id);
  if (!cargo.includes('tesour')) throw new Error("Apenas o tesoureiro pode validar.");

  const registroId = formData.get("registro_id");
  await supabaseAdmin.from("registros").update({ status: 'validado', validado_por: user.id, validado_em: new Date().toISOString() }).eq("id", registroId);
  redirect("/registros");
}

export async function reportarErroAction(formData) {
  const user = await getSessionUser();
  const cargo = await getMeuCargo(user.id);
  if (!cargo.includes('tesour')) throw new Error("Apenas o tesoureiro pode reportar erro.");

  const registroId = formData.get("registro_id");
  const motivo = formData.get("motivo");
  await supabaseAdmin.from("registros").update({ status: 'erro_reportado', erro_motivo: motivo, validado_por: user.id }).eq("id", registroId);
  redirect("/registros");
}
