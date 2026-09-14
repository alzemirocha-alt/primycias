"use server";
import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";

export async function criarRegistroCultoAction(formData){
  const me = await getSessionUser();
  const data_culto = formData.get("data_culto");
  const segundoDiaconoId = formData.get("segundoDiaconoId");
  const linhas = JSON.parse(formData.get("linhas_json"));
  const serie_id = randomUUID();

  for (const linha of linhas) {
    if (!linha.nome ||!linha.valor) continue;
    const valor = parseFloat(linha.valor);

    // 1. Acha ou cria membro pelo nome livre
    let { data: membro } = await supabaseAdmin.from("membros").select("id").eq("igreja_id", me.igreja_id).ilike("nome", linha.nome.trim()).maybeSingle();
    if (!membro) {
      const { data: novo } = await supabaseAdmin.from("membros").insert({ igreja_id: me.igreja_id, nome: linha.nome.trim() }).select("id").single();
      membro = novo;
    }

    // 2. Grava em dizimos
    await supabaseAdmin.from("dizimos").insert({ membro_id: membro.id, valor, tipo: linha.tipo, data: data_culto });

    // 3. Grava em lancamentos com mesmo serie_id (mesmo culto)
    const { data: lanc } = await supabaseAdmin.from("lancamentos").insert({
      igreja_id: me.igreja_id,
      tipo: "entrada",
      data: data_culto,
      historico: `${linha.tipo.toUpperCase()} - ${linha.nome} - R$ ${valor}`,
      valor,
      categoria: linha.tipo,
      status: "rascunho",
      serie_id,
      criado_por: me.id,
      criado_por_nome: me.nome,
    }).select().single();

    // 4. Aprovação - mesmo segundo diácono para todos do dia
    if (segundoDiaconoId && lanc) {
      await supabaseAdmin.from("approval_requests").insert({
        lancamento_id: lanc.id,
        igreja_id: me.igreja_id,
        solicitante_id: me.id,
        aprovador_id: segundoDiaconoId,
        status: "pendente",
      });
    }
  }
  redirect("/registros");
}
// FIX: Botão Excluir - Só Pastor apaga definitivo
export async function excluirRegistroAction(recordId) {
  const me = await getSessionUser()
  if (!me) throw new Error('Não logado')
  
  const funcao = (me.funcao || me.cargo || '').toLowerCase()
  if (funcao !== 'pastor' && funcao !== 'presidente') {
    throw new Error('Só o pastor pode excluir definitivamente')
  }

  // Apaga definitivo como você pediu
  await supabaseAdmin.from('record_items').delete().eq('record_id', recordId)
  await supabaseAdmin.from('record_approvals').delete().eq('record_id', recordId)
  await supabaseAdmin.from('aprovacoes_culto').delete().eq('culto_id', recordId)
  await supabaseAdmin.from('records').delete().eq('id', recordId)
}
