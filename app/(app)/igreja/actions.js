"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/constants";
import { revalidatePath } from "next/cache";

export async function atualizarIgrejaAction(payload) {
  const me = await getSessionUser();
  if (!isAdmin(me)) throw new Error("Apenas Pastor e Secretário do Conselho podem editar os dados da igreja.");
  const patch = {
    nome: payload.nome, cnpj: payload.cnpj, cep: payload.cep,
    endereco: payload.endereco, contato: payload.contato,
  };
  if (payload.logo !== undefined) patch.logo = payload.logo;

  await supabaseAdmin.from("igrejas").update(patch).eq("id", me.igreja_id);

  revalidatePath("/igreja");
  revalidatePath("/dashboard");
}
