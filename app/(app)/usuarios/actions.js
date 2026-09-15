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

// ===== NOVO: CRIAÇÃO COM TRAVA DE FUNÇÃO ÚNICA =====

// Funções que só podem ter 1 pessoa por igreja
export const FUNCOES_UNICAS = [
  "presidente_junta", "vice_presidente_junta", "secretario_junta", "tesoureiro_junta",
  "presidente_conselho", "vice_presidente_conselho", "secretario_conselho",
  "tesoureiro_igreja"
];

export async function criarUsuarioAction(formData) {
  const me = await requireAdmin();

  const nome = String(formData.get("nome")||"").trim();
  const cpf = String(formData.get("cpf")||"").replace(/\D/g,"");
  const cep = String(formData.get("cep")||"").trim();
  const endereco = String(formData.get("endereco")||"").trim();
  const telefone = String(formData.get("telefone")||"").trim();
  const mandato = String(formData.get("mandato")||"").trim(); // vai para data_vencimento_mandato
  const oficio = String(formData.get("oficio")||"").toLowerCase(); // diacono, presbitero, pastor, membro
  const foto = String(formData.get("foto")||formData.get("foto_url")||"").trim() || null;

  // junta diaconal / conselho / tesoureiro vêm separados no form e unificamos
  const funcaoConselho = String(formData.get("funcao_conselho")||"").toLowerCase();
  const funcaoJunta = String(formData.get("funcao_junta")||"").toLowerCase();
  const funcaoTesouraria = String(formData.get("funcao_tesouraria")||"").toLowerCase();
  let funcaoFinal = String(formData.get("funcao")||funcaoConselho||funcaoJunta||funcaoTesouraria||"").toLowerCase();

  if (!nome ||!cpf ||!oficio) throw new Error("Nome, CPF e Ofício são obrigatórios.");
  if (cpf.length!== 11) throw new Error("CPF inválido.");

  // Verifica se função já está ocupada (regra: função só 1 por igreja, ofício pode repetir)
  if (funcaoFinal && FUNCOES_UNICAS.includes(funcaoFinal)) {
    if (funcaoFinal === "tesoureiro_igreja") {
      const { data: igreja } = await supabaseAdmin.from("igrejas").select("tesoureiro_user_id").eq("id", me.igreja_id).maybeSingle();
      if (igreja?.tesoureiro_user_id) {
        const { data: ocup } = await supabaseAdmin.from("users").select("nome").eq("id", igreja.tesoureiro_user_id).maybeSingle();
        throw new Error(`Tesoureiro da Igreja já ocupado por ${ocup?.nome||"outro usuário"}. Remova a função dele primeiro para liberar.`);
      }
    } else {
      const { data: ocupante } = await supabaseAdmin.from("users")
       .select("id,nome,funcao,funcao_diacono,funcao_presbitero")
       .eq("igreja_id", me.igreja_id)
       .neq("status","excluido")
       .or(`funcao.eq.${funcaoFinal},funcao_diacono.eq.${funcaoFinal},funcao_presbitero.eq.${funcaoFinal}`)
       .maybeSingle();
      if (ocupante) {
        throw new Error(`Função "${funcaoFinal.replace(/_/g," ")}" já ocupada por ${ocupante.nome}. Para cadastrar outra pessoa, o Pastor ou Secretário deve editar o usuário atual e remover a função para liberar.`);
      }
    }
  }

  // Senha padrão 4 dígitos seguindo seu critério validarSenha - últimos 4 do CPF
  const senhaPadrao = cpf.slice(-4);
  const erroSenha = validarSenha(senhaPadrao, null);
  if (erroSenha) throw new Error("Não foi possível gerar senha padrão: "+erroSenha);

  const senhaHash = await hashPassword(senhaPadrao);

  // Monta patch compatível com seu schema original
  const novoUsuario = {
    igreja_id: me.igreja_id,
    nome,
    cpf,
    endereco: endereco || null,
    telefone: telefone || null,
    foto: foto || null,
    oficio, // diacono, presbitero, pastor, membro
    status: "ativo",
    data_instalacao: new Date().toISOString().slice(0,10),
    data_vencimento_mandato: mandato || null,
    senha_hash: senhaHash,
  };

  // salva cep no endereco se seu schema não tem coluna cep separada
  if (cep) novoUsuario.endereco = `${endereco} - CEP ${cep}`.trim();

  // decide onde salvar a função baseado no ofício
  if (funcaoFinal) {
    if (funcaoFinal.includes("junta")) novoUsuario.funcao_diacono = funcaoFinal;
    else if (funcaoFinal.includes("conselho")) novoUsuario.funcao_presbitero = funcaoFinal;
    else novoUsuario.funcao_diacono = funcaoFinal; // fallback
    // se for membro do conselho/junta (pode repetir) não entra na trava
    if (funcaoFinal === "membro_conselho" || funcaoFinal === "membro_junta") {
      // permite múltiplos, não faz checagem
    }
  }

  const { data: criado, error } = await supabaseAdmin.from("users").insert(novoUsuario).select("id").single();
  if (error) throw new Error(error.message);

  // se for tesoureiro da igreja, vincula na tabela igrejas (mesma lógica do seu updateUserAction)
  if (funcaoFinal === "tesoureiro_igreja") {
    await supabaseAdmin.from("igrejas").update({ tesoureiro_user_id: criado.id }).eq("id", me.igreja_id);
  }

  await supabaseAdmin.from("password_history").insert({
    igreja_id: me.igreja_id,
    user_id: criado.id,
    acao: `Usuário criado pelo administrador - senha padrão ${senhaPadrao}`,
    por_nome: me.nome,
    por_cpf: me.cpf,
  });

  revalidatePath("/usuarios");
  return { success: true, senha: senhaPadrao, id: criado.id };
}
