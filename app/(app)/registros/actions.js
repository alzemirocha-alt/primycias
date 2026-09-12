"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUser, getChurch } from "@/lib/auth";
import { isAdmin, isCouncilSecretary, isTreasurer, officeLabel } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function addApproval(recordId, user, acao) {
  await supabaseAdmin.from("record_approvals").insert({
    record_id: recordId,
    user_id: user.id,
    nome: user.nome,
    cargo: officeLabel(user),
    acao,
  });
}

// Busca um registro garantindo que pertence à igreja de quem está agindo.
async function getRecordScoped(recordId, igrejaId) {
  const { data } = await supabaseAdmin.from("records").select("*").eq("id", recordId).eq("igreja_id", igrejaId).maybeSingle();
  return data;
}

export async function criarRegistroAction(prevState, formData) {
  const me = await getSessionUser();
  if (!me || me.oficio!== "diacono") return { error: "Apenas diáconos lançam registros de culto." };

  // REGRA QUE VOCÊ PEDIU: diácono que é tesoureiro não pode lançar
  const { data: church } = await supabaseAdmin.from("churches").select("*").eq("id", me.igreja_id).maybeSingle();
  const { isTreasurer } = await import("@/lib/permissions");
  if (isTreasurer(me, church)) return { error: "Tesoureiro não pode lançar, apenas validar." };

  const dataCulto = String(formData.get("dataCulto") || "");
  if (!dataCulto) return { error: "Informe a data do culto." };

  const segundoDiaconoId = String(formData.get("segundoDiaconoId") || "");
  if (!segundoDiaconoId) return { error: "Selecione o 2º Diácono que vai confirmar." };
  if (segundoDiaconoId === me.id) return { error: "O 2º Diácono deve ser diferente de você." };

  const nomes = formData.getAll("item_nome");
  const tipos = formData.getAll("item_tipo");
  const valores = formData.getAll("item_valor");

  const itens = nomes
 .map((nome, i) => ({ nome: String(nome || "").trim(), tipo: tipos[i], valor: Number(valores[i]) }))
 .filter((i) => i.nome && i.valor > 0);
  if (itens.length === 0) return { error: "Adicione ao menos um lançamento com nome e valor." };
  // REGRA DE RODÍZIO COM EXCEÇÃO DO PASTOR
  const { data: ultimoRegistro } = await supabaseAdmin
    .from("records")
    .select("diacono_id, segundo_diacono_id")
    .eq("igreja_id", me.igreja_id)
    .order("data_culto", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ultimoRegistro) {
    const participaramAntes = [ultimoRegistro.diacono_id, ultimoRegistro.segundo_diacono_id].filter(Boolean);
    const precisaRodizio = participaramAntes.includes(me.id) || participaramAntes.includes(segundoDiaconoId);

    if (precisaRodizio) {
      // verifica se foi liberado pelo pastor
      const liberadoPeloPastor = String(formData.get("liberado_pelo_pastor") || "") === "true";
      
      // Só pastor pode liberar, e tesoureiro nunca pode ser liberado
      if (liberadoPeloPastor) {
        if (me.oficio !== "pastor") {
          return { error: "Apenas o Pastor pode liberar diácono para quebrar o rodízio." };
        }
      } else {
        return { error: `Rodízio: Diácono do culto anterior não pode participar. Peça liberação ao Pastor.` };
      }
    }
  }

  const { data: record, error } = await supabaseAdmin
    .from("records")
      .insert({ igreja_id: me.igreja_id, data_culto: dataCulto, diacono_id: me.id, segundo_diacono_id: segundoDiaconoId, status: "lancado" })
    .select()
    .single();
  if (error) return { error: "Não foi possível criar o registro." };

  await supabaseAdmin.from("record_items").insert(itens.map((i) => ({ ...i, record_id: record.id })));
  await addApproval(record.id, me, "Lançou o registro do culto");

  revalidatePath("/registros");
  redirect(`/registros/${record.id}`);
}

export async function confirmarSegundoDiaconoAction(recordId) {
  const me = await getSessionUser();
  const record = await getRecordScoped(recordId, me.igreja_id);
  if (!record) throw new Error("Registro não encontrado.");

  if (record.segundo_diacono_id !== me.id) throw new Error("Apenas o 2º Diácono escolhido pode confirmar este registro.");

  const church = await getChurch(me.igreja_id);
  const { isTreasurer } = await import("@/lib/permissions");
  if (isTreasurer(me, church)) throw new Error("Tesoureiro não pode confirmar como 2º Diácono.");

  await supabaseAdmin.from("records").update({ status: "confirmado_segundo_diacono" }).eq("id", recordId);
  await addApproval(recordId, me, "Confirmou o registro como 2º Diácono");
  revalidatePath(`/registros/${recordId}`);
  revalidatePath("/registros");
}
export async function validarTesoureiroAction(recordId) {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);
  if (!isTreasurer(me, church) && me.oficio !== "pastor") throw new Error("Apenas o Tesoureiro da Igreja valida este registro.");
  const record = await getRecordScoped(recordId, me.igreja_id);
  if (!record) throw new Error("Registro não encontrado.");

  if (record.status !== "confirmado_segundo_diacono") throw new Error("Precisa ser confirmado pelo 2º Diácono antes do Tesoureiro validar.");

  await supabaseAdmin.from("records").update({ status: "validado" }).eq("id", recordId);
  await addApproval(recordId, me, "Validou o registro como Tesoureiro da Igreja");
  revalidatePath(`/registros/${recordId}`);
  revalidatePath("/registros");
  await addApproval(recordId, me, "Validou o registro como Tesoureiro da Igreja");
  revalidatePath(`/registros/${recordId}`);
  revalidatePath("/registros");
}

export async function reportarErroAction(recordId, descricao) {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);
  if (!isTreasurer(me, church) && me.oficio !== "pastor") throw new Error("Apenas o Tesoureiro da Igreja reporta erro.");
  if (!descricao) throw new Error("Descreva o erro encontrado.");
  const record = await getRecordScoped(recordId, me.igreja_id);
  if (!record) throw new Error("Registro não encontrado.");

  await supabaseAdmin.from("records").update({ status: "erro_reportado" }).eq("id", recordId);
  await supabaseAdmin.from("error_reports").insert({ record_id: recordId, reportado_por: me.id, descricao });
  await addApproval(recordId, me, `Reportou erro: ${descricao}`);
  revalidatePath(`/registros/${recordId}`);
  revalidatePath("/registros");
}

export async function corrigirEReenviarAction(recordId, itensAtualizados) {
  const me = await getSessionUser();
  const record = await getRecordScoped(recordId, me.igreja_id);
  if (!record) throw new Error("Registro não encontrado.");
  if (record.diacono_id !== me.id && !isAdmin(me)) {
    throw new Error("Apenas o diácono responsável (ou o Pastor) pode corrigir este registro.");
  }

  await supabaseAdmin.from("record_items").delete().eq("record_id", recordId);
  if (itensAtualizados.length > 0) {
    await supabaseAdmin.from("record_items").insert(itensAtualizados.map((i) => ({ ...i, record_id: recordId })));
  }

  await supabaseAdmin.from("records").update({ status: "lancado" }).eq("id", recordId);
  await addApproval(recordId, me, "Corrigiu e reenviou o registro");
  revalidatePath(`/registros/${recordId}`);
  revalidatePath("/registros");
}
  await supabaseAdmin
    .from("error_reports")
    .update({ status: "resolvido", resolved_at: new Date().toISOString() })
    .eq("record_id", recordId)
    .eq("status", "pendente");
  await addApproval(recordId, me, "Corrigiu o registro após erro reportado e reenviou para confirmação");

  revalidatePath(`/registros/${recordId}`);
revalidatePath(`/registros`);
}

export async function excluirRegistroAction(recordId) {
  const me = await getSessionUser();
  const record = await getRecordScoped(recordId, me.igreja_id);
  if (!record) return;

  const souDiaconoResponsavel = record.diacono_id === me.id;
  const podeExcluir =
    (souDiaconoResponsavel && (record.status === "lancado")) ||
    me.oficio === "pastor";

  if (!podeExcluir) throw new Error("Você não tem permissão para excluir este registro.");

  await supabaseAdmin.from("records").delete().eq("id", recordId);
  revalidatePath("/registros");
  redirect("/registros");
}
