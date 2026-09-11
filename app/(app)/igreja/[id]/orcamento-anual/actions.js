"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUser, getChurch } from "@/lib/auth";
import { isMaster, isTreasurer, canAccessTesouraria } from "@/lib/constants";
import { revalidatePath } from "next/cache";

async function requireEdit() {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);
  if (!canAccessTesouraria(me, church)) throw new Error("Acesso restrito à Tesouraria.");
  if (!(isMaster(me) || isTreasurer(me, church))) {
    throw new Error("Apenas Pastor e Tesoureiro podem editar o orçamento anual. O Secretário só visualiza.");
  }
  return me;
}

export async function salvarPrevistoAction(ano, categoria, valorPrevisto) {
  const me = await requireEdit();
  await supabaseAdmin
    .from("orcamento_anual")
    .upsert(
      { igreja_id: me.igreja_id, ano: Number(ano), categoria, valor_previsto: Number(valorPrevisto) || 0 },
      { onConflict: "igreja_id,ano,categoria" }
    );
  revalidatePath(`/igreja/${me.igreja_id}/orcamento-anual`);
}
