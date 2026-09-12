"use server";
import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { redirect } from "next/navigation";

export async function criarDizimoAction(formData) {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);
  const nome_digitado = formData.get("nome_membro")?.trim();
  const valor = parseFloat(formData.get("valor"));
  const tipo = formData.get("tipo");

  // 1. Procura membro pelo nome, se não achar cria
  let { data: membro } = await supabaseAdmin.from("membros").select("id").eq("igreja_id", me.igreja_id).ilike("nome", nome_digitado).maybeSingle();

  if (!membro) {
    const { data: novo, error } = await supabaseAdmin.from("membros").insert({ igreja_id: me.igreja_id, nome: nome_digitado }).select("id").single();
    if (error) throw new Error("Erro ao criar membro: " + error.message);
    membro = novo;
  }

  // 2. Lança no dizimos (um valor por membro, nome se repete nas datas)
  const { error: e1 } = await supabaseAdmin.from("dizimos").insert({
    membro_id: membro.id,
    valor,
    tipo,
    data: new Date().toISOString().split('T')[0],
  });
  if (e1) throw new Error(e1.message);

  // 3. Lança no financeiro também
  await supabaseAdmin.from("lancamentos").insert({
    igreja_id: me.igreja_id,
    tipo: "entrada",
    historico: `${tipo.toUpperCase()} - ${nome_digitado} - R$ ${valor}`,
    valor,
    categoria: tipo,
    status: "rascunho",
    criado_por: me.id,
    criado_por_nome: me.nome,
  });

  redirect("/registros");
}
