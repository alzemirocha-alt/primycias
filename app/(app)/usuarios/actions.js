"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/constants";
import { hashPassword, validarSenha } from "@/lib/password";
import { revalidatePath } from "next/cache";

// ===== SEU ORIGINAL PRESERVADO =====
async function requireAdmin() {
  const me = await getSessionUser();
  if (!isAdmin(me)) throw new Error("Acesso restrito ao Pastor e ao Secretário do Conselho.");
  return me;
}

async function requireSameChurch(me, userId) {
  const { data: alvo } = await supabaseAdmin.from("users").select("id, igreja_id, data_instalacao").eq("id", userId).maybeSingle();
  if (!alvo || alvo.igreja_id!== me.igreja_id) throw new Error("Usuário não encontrado nesta igreja.");
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

  if (fields.isTesoureiro!== undefined) {
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
  .update({ status: liberar? "liberado" : "negado", decidido_por_nome: me.nome, decided_at: new Date().toISOString() })
  .eq("id", requestId);

  if (liberar) {
    await supabaseAdmin.from("users").update({ senha_hash: reqRow.nova_senha_hash }).eq("id", reqRow.user_id);
  }
  await supabaseAdmin.from("password_history").insert({
    igreja_id: me.igreja_id,
    user_id: reqRow.user_id,
    acao: liberar? "Senha redefinida via solicitação — liberada" : "Solicitação de nova senha negada",
    por_nome: me.nome,
    por_cpf: me.cpf,
  });
  revalidatePath("/usuarios");
}

// ===== NOVO: CRIAÇÃO COM TRAVA DE FUNÇÃO ÚNICA - CORRIGIDO =====

export const FUNCOES_UNICAS = [
  "presidente_junta", "vice_presidente_junta", "secretario_junta", "tesoureiro_junta",
  "presidente_conselho", "vice_presidente_conselho", "secretario_conselho",
  "tesoureiro_igreja"
];

// Mapa para converter o label do select para a chave interna
const MAPA_FUNCOES = {
  "presidente da junta diaconal": "presidente_junta",
  "vice-presidente da junta diaconal": "vice_presidente_junta",
  "vice presidente da junta diaconal": "vice_presidente_junta",
  "secretario da junta diaconal": "secretario_junta",
  "secretário da junta diaconal": "secretario_junta",
  "tesoureiro da junta diaconal": "tesoureiro_junta",
  "presidente do conselho": "presidente_conselho",
  "vice-presidente do conselho": "vice_presidente_conselho",
  "secretario do conselho": "secretario_conselho",
  "secretário do conselho": "secretario_conselho",
  "tesoureiro da igreja": "tesoureiro_igreja",
};

function normalizarFuncao(valor) {
  if (!valor) return "";
  const lower = String(valor).toLowerCase().trim();
  return MAPA_FUNCOES[lower] || lower.replace(/ /g, "_").replace(/-/g, "_");
}

function parseDataMandato(valor) {
  if (!valor) return null;
  // Se já vier YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  // Se vier ISO
  const d = new Date(valor);
  if (!isNaN(d.getTime()) && String(valor).length >= 8 &&!String(valor).includes("nov")) {
    return d.toISOString().slice(0, 10);
  }
  // Se vier "6 de nov. de 2027" -> tenta extrair
  return null; // deixa null para não quebrar, o usuário edita depois
}

export async function criarUsuarioAction(formData) {
  try {
    const me = await requireAdmin();

    const nome = String(formData.get("nome") || "").trim();
    const cpf = String(formData.get("cpf") || "").replace(/\D/g, "");
    const cep = String(formData.get("cep") || "").trim();
    const endereco = String(formData.get("endereco") || "").trim();
    const telefone = String(formData.get("telefone") || "").trim();
    const mandatoRaw = String(formData.get("mandato") || formData.get("data_vencimento_mandato") || "").trim();
    const oficio = String(formData.get("oficio") || "").toLowerCase();
    const foto = String(formData.get("foto") || formData.get("foto_url") || "").trim() || null;

    const funcaoConselho = String(formData.get("funcao_conselho") || "").toLowerCase();
    const funcaoJunta = String(formData.get("funcao_junta") || "").toLowerCase();
    const funcaoTesouraria = String(formData.get("funcao_tesouraria") || "").toLowerCase();
    let funcaoFinalRaw = String(formData.get("funcao") || funcaoConselho || funcaoJunta || funcaoTesouraria || "").toLowerCase();
    let funcaoFinal = normalizarFuncao(funcaoFinalRaw);

    if (!nome ||!cpf ||!oficio) return { error: "Nome, CPF e Ofício são obrigatórios." };
    if (cpf.length!== 11) return { error: "CPF inválido." };

    // Verifica duplicidade de CPF
    const { data: cpfExiste } = await supabaseAdmin.from("users").select("id,nome").eq("cpf", cpf).maybeSingle();
    if (cpfExiste) return { error: `CPF já cadastrado para ${cpfExiste.nome}` };

    // Verifica se função já está ocupada
    if (funcaoFinal && FUNCOES_UNICAS.includes(funcaoFinal)) {
      if (funcaoFinal === "tesoureiro_igreja") {
        const { data: igreja } = await supabaseAdmin.from("igrejas").select("tesoureiro_user_id").eq("id", me.igreja_id).maybeSingle();
        if (igreja?.tesoureiro_user_id) {
          const { data: ocup } = await supabaseAdmin.from("users").select("nome").eq("id", igreja.tesoureiro_user_id).maybeSingle();
          return { error: `Tesoureiro da Igreja já ocupado por ${ocup?.nome || "outro usuário"}. Remova a função dele primeiro.` };
        }
      } else {
        const { data: ocupante } = await supabaseAdmin.from("users")
        .select("id,nome,funcao,funcao_diacono,funcao_presbitero")
        .eq("igreja_id", me.igreja_id)
        .neq("status", "excluido")
        .or(`funcao.eq.${funcaoFinal},funcao_diacono.eq.${funcaoFinal},funcao_presbitero.eq.${funcaoFinal}`)
        .maybeSingle();
        if (ocupante) {
          return { error: `Função "${funcaoFinal.replace(/_/g, " ")}" já ocupada por ${ocupante.nome}. Edite o usuário atual e remova a função para liberar.` };
        }
      }
    }

    const senhaPadrao = cpf.slice(-4);
    const erroSenha = validarSenha(senhaPadrao, null);
    if (erroSenha) return { error: "Não foi possível gerar senha padrão: " + erroSenha };

    const senhaHash = await hashPassword(senhaPadrao);
    const dataVenc = parseDataMandato(mandatoRaw);

    const novoUsuario = {
      igreja_id: me.igreja_id,
      nome,
      cpf,
      endereco: endereco? `${endereco}${cep? ` - CEP ${cep}` : ""}`.trim() : null,
      telefone: telefone || null,
      foto: foto || null,
      oficio,
      status: "ativo",
      data_instalacao: new Date().toISOString().slice(0, 10),
      data_vencimento_mandato: dataVenc,
      senha_hash: senhaHash,
    };

    if (funcaoFinal) {
      if (funcaoFinal.includes("junta")) novoUsuario.funcao_diacono = funcaoFinal;
      else if (funcaoFinal.includes("conselho")) novoUsuario.funcao_presbitero = funcaoFinal;
      else if (funcaoFinal === "tesoureiro_igreja") {
        // será vinculado depois
      } else {
        novoUsuario.funcao_diacono = funcaoFinal;
      }
    }

    const { data: criado, error } = await supabaseAdmin.from("users").insert(novoUsuario).select("id").single();
    if (error) return { error: error.message };

    if (funcaoFinal === "tesoureiro_igreja") {
      await supabaseAdmin.from("igrejas").update({ tesoureiro_user_id: criado.id }).eq("id", me.igreja_id);
    }

    await supabaseAdmin.from("password_history").insert({
      igreja_id: me.igreja_id,
      user_id: criado.id,
      acao: `Usuário criado - senha padrão ${senhaPadrao}`,
      por_nome: me.nome,
      por_cpf: me.cpf,
    });

    revalidatePath("/usuarios");
    return { success: true, senha: senhaPadrao, id: criado.id };

  } catch (e) {
    console.error("ERRO criarUsuarioAction:", e);
    return { error: e.message || "Erro interno ao criar usuário" };
  }
}
