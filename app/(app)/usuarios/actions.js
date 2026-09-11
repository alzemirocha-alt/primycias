"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/constants";
import { hashPassword, validarSenha } from "@/lib/password";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const me = await getSessionUser();
  if (!isAdmin(me)) throw new Error("Acesso restrito ao Pastor e ao Secretário do Conselho.");
  return me;
}

// Garante que o usuário-alvo pertence à mesma igreja de quem está agindo —
// isolamento entre igrejas (multi-tenant).
async function requireSameChurch(me, userId) {
  const { data: alvo } = await supabaseAdmin.from("users").select("id, igreja_id, data_instalacao").eq("id", userId).maybeSingle();
  if (!alvo || alvo.igreja_id !== me.igreja_id) throw new Error("Usuário não encontrado nesta igreja.");
  return alvo;
}

export async function approveUserAction(userId) {
  const me = await requireAdmin();
  const alvo = await requireSameChurch(me, userId);
  await supabaseAdmin
    .from("users")
    .update({
      status: "ativo",
      data_instalacao: alvo.data_instalacao || new Date().toISOString().slice(0, 10),
    })
    .eq("id", userId);
  revalidatePath("/usuarios");
}

export async function rejectUserAction(userId) {
  const me = await requireAdmin();
  await requireSameChurch(me, userId);
  await supabaseAdmin.from("users").delete().eq("id", userId);
  revalidatePath("/usuarios");
}

export async function updateUserAction(userId, fields) {
  const me = await requireAdmin();
  await requireSameChurch(me, userId);
  const patch = {};
  ["oficio", "funcao_diacono", "funcao_presbitero", "status", "data_vencimento_mandato", "endereco", "telefone", "foto"].forEach((k) => {
    if (k in fields) patch[k] = fields[k] || null;
  });
  await supabaseAdmin.from("users").update(patch).eq("id", userId);

  if (fields.isTesoureiro !== undefined) {
    if (fields.isTesoureiro) {
      await supabaseAdmin.from("igrejas").update({ tesoureiro_user_id: userId }).eq("id", me.igreja_id);
    } else {
      await supabaseAdmin
        .from("igrejas")
        .update({ tesoureiro_user_id: null })
        .eq("id", me.igreja_id)
        .eq("tesoureiro_user_id", userId);
    }
  }
  revalidatePath("/usuarios");
}

export async function setPasswordAction(userId, novaSenha, dataNascimento) {
  const me = await requireAdmin();
  await requireSameChurch(me, userId);
  const erro = validarSenha(novaSenha, dataNascimento);
  if (erro) return { error: erro };
  const hash = await hashPassword(novaSenha);
  await supabaseAdmin.from("users").update({ senha_hash: hash }).eq("id", userId);
  await supabaseAdmin.from("password_history").insert({
    igreja_id: me.igreja_id,
    user_id: userId,
    acao: "Senha alterada pelo administrador",
    por_nome: me.nome,
    por_cpf: me.cpf,
  });
  revalidatePath("/usuarios");
  return { success: true };
}

export async function decidePasswordResetAction(requestId, liberar) {
  const me = await requireAdmin();
  const { data: reqRow } = await supabaseAdmin
    .from("password_reset_requests")
    .select("*")
    .eq("id", requestId)
    .eq("igreja_id", me.igreja_id)
    .maybeSingle();
  if (!reqRow) return;

  await supabaseAdmin
    .from("password_reset_requests")
    .update({ status: liberar ? "liberado" : "negado", decidido_por_nome: me.nome, decided_at: new Date().toISOString() })
    .eq("id", requestId);

  if (liberar) {
    await supabaseAdmin.from("users").update({ senha_hash: reqRow.nova_senha_hash }).eq("id", reqRow.user_id);
  }
  await supabaseAdmin.from("password_history").insert({
    igreja_id: me.igreja_id,
    user_id: reqRow.user_id,
    acao: liberar ? "Senha redefinida via solicitação — liberada" : "Solicitação de nova senha negada",
    por_nome: me.nome,
    por_cpf: me.cpf,
  });
  revalidatePath("/usuarios");
}
