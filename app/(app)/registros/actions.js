"use server";
import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { redirect } from "next/navigation";

export async function criarDizimoAction(formData) {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);

  const membro_id = formData.get("membro_id");
  const valor = parseFloat(formData.get("valor"));
  const tipo = formData.get("tipo"); // dizimo ou oferta
  const segundoDiaconoId = formData.get("segundoDiaconoId");

  if (!membro_id ||!valor) throw new Error("Dados incompletos");

  // 1. Grava em dizimos (um valor por membro)
  const { data: membro } = await supabaseAdmin.from("membros").select("nome").eq("id", membro_id).single();
  const { error: err1 } = await supabaseAdmin.from("dizimos").insert({
    membro_id,
    valor,
    tipo,
    data: new Date().toISOString().split('T')[0],
  });
  if (err1) throw new Error("Erro dizimos: " + err1.message);

  // 2. Grava em lancamentos (financeiro) - tipo tem que ser 'entrada', status 'rascunho'
  const { data: lanc, error: err2 } = await supabaseAdmin.from("lancamentos").insert({
    igreja_id: me.igreja_id,
    tipo: "entrada",
    data: new Date().toISOString().split('T')[0],
    historico: `${tipo.toUpperCase()} - ${membro?.nome || membro_id} - R$ ${valor}`,
    valor,
    categoria: tipo,
    status: "rascunho",
    criado_por: me.id,
    criado_por_nome: me.nome,
  }).select().single();

  if (err2) throw new Error("Erro lancamentos: " + err2.message);

  // 3. Cria pedido de aprovação para o 2º diácono
  if (segundoDiaconoId && lanc) {
    await supabaseAdmin.from("approval_requests").insert({
      lancamento_id: lanc.id,
      igreja_id: me.igreja_id,
      solicitante_id: me.id,
      aprovador_id: segundoDiaconoId,
      status: "pendente",
    });
  }

  redirect("/registros");
}
