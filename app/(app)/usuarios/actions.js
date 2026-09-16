"use server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/constants";
import { hashPassword, validarSenha } from "@/lib/password";
import { revalidatePath } from "next/cache";

// NÃO DÁ THROW MAIS - retorna null
async function requireAdmin() {
  try {
    const me = await getSessionUser();
    if (!me) return null;
    if (!isAdmin(me)) return null;
    return me;
  } catch { return null; }
}

async function requireSameChurch(me, userId) {
  if (!me) return null;
  const { data: alvo } = await supabaseAdmin.from("users").select("id, igreja_id, data_instalacao").eq("id", userId).maybeSingle();
  if (!alvo || alvo.igreja_id !== me.igreja_id) return null;
  return alvo;
}

export async function approveUserAction(userId) {
  const me = await requireAdmin();
  if (!me) return { error: "Sem permissão" };
  const alvo = await requireSameChurch(me, userId);
  if (!alvo) return { error: "Usuário não encontrado" };
  await supabaseAdmin.from("users").update({ status: "ativo", data_instalacao: alvo.data_instalacao || new Date().toISOString().slice(0,10) }).eq("id", userId);
  revalidatePath("/usuarios");
  return { success: true };
}

export async function rejectUserAction(userId) {
  const me = await requireAdmin();
  if (!me) return { error: "Sem permissão" };
  await supabaseAdmin.from("users").delete().eq("id", userId);
  revalidatePath("/usuarios");
  return { success: true };
}

export async function updateUserAction(userId, fields) {
  const me = await requireAdmin();
  if (!me) return { error: "Sem permissão" };
  const patch = {};
  ["oficio", "funcao_diacono", "funcao_presbitero", "status", "data_vencimento_mandato", "endereco", "telefone", "foto"].forEach((k) => {
    if (k in fields) patch[k] = fields[k] || null;
  });
  // Converte data vazia para null para não quebrar
  if (patch.data_vencimento_mandato === "" || patch.data_vencimento_mandato?.includes("nov")) {
    patch.data_vencimento_mandato = null;
  }
  await supabaseAdmin.from("users").update(patch).eq("id", userId);
  if (fields.isTesoureiro !== undefined) {
    if (fields.isTesoureiro) {
      await supabaseAdmin.from("igrejas").update({ tesoureiro_user_id: userId }).eq("id", me.igreja_id);
    } else {
      await supabaseAdmin.from("igrejas").update({ tesoureiro_user_id: null }).eq("id", me.igreja_id).eq("tesoureiro_user_id", userId);
    }
  }
  revalidatePath("/usuarios");
  return { success: true };
}

export async function setPasswordAction(userId, novaSenha, dataNascimento) {
  const me = await requireAdmin();
  if (!me) return { error: "Sem permissão" };
  const erro = validarSenha(novaSenha, dataNascimento);
  if (erro) return { error: erro };
  const hash = await hashPassword(novaSenha);
  await supabaseAdmin.from("users").update({ senha_hash: hash }).eq("id", userId);
  await supabaseAdmin.from("password_history").insert({ igreja_id: me.igreja_id, user_id: userId, acao: "Senha alterada", por_nome: me.nome, por_cpf: me.cpf });
  revalidatePath("/usuarios");
  return { success: true };
}

export async function decidePasswordResetAction(requestId, liberar) {
  const me = await requireAdmin();
  if (!me) return;
  const { data: reqRow } = await supabaseAdmin.from("password_reset_requests").select("*").eq("id", requestId).eq("igreja_id", me.igreja_id).maybeSingle();
  if (!reqRow) return;
  await supabaseAdmin.from("password_reset_requests").update({ status: liberar ? "liberado" : "negado", decidido_por_nome: me.nome, decided_at: new Date().toISOString() }).eq("id", requestId);
  if (liberar) await supabaseAdmin.from("users").update({ senha_hash: reqRow.nova_senha_hash }).eq("id", reqRow.user_id);
  revalidatePath("/usuarios");
}

const FUNCOES_UNICAS = ["presidente_junta","vice_presidente_junta","secretario_junta","tesoureiro_junta","presidente_conselho","vice_presidente_conselho","secretario_conselho","tesoureiro_igreja"];
const MAPA_FUNCOES = {
  "presidente da junta diaconal":"presidente_junta",
  "vice-presidente da junta diaconal":"vice_presidente_junta",
  "vice presidente da junta diaconal":"vice_presidente_junta",
  "secretario da junta diaconal":"secretario_junta",
  "secretário da junta diaconal":"secretario_junta",
  "tesoureiro da junta diaconal":"tesoureiro_junta",
  "presidente do conselho":"presidente_conselho",
  "vice-presidente do conselho":"vice_presidente_conselho",
  "secretario do conselho":"secretario_conselho",
  "secretário do conselho":"secretario_conselho",
  "tesoureiro da igreja":"tesoureiro_igreja",
};
function normalizarFuncao(v){ if(!v) return ""; const l=String(v).toLowerCase().trim(); return MAPA_FUNCOES[l] || l; }

export async function criarUsuarioAction(formData) {
  try {
    const me = await requireAdmin();
    if (!me) return { error: "Sessão expirada. Faça login novamente." };

    const nome = String(formData.get("nome")||"").trim();
    const cpf = String(formData.get("cpf")||"").replace(/\D/g,"");
    const endereco = String(formData.get("endereco")||"").trim();
    const telefone = String(formData.get("telefone")||"").trim();
    const mandatoRaw = String(formData.get("mandato")||formData.get("data_vencimento_mandato")||"").trim();
    const oficio = String(formData.get("oficio")||"").toLowerCase().trim();
    const foto = String(formData.get("foto")||"").trim() || null;
    const funcaoRaw = String(formData.get("funcao")||formData.get("funcao_junta")||formData.get("funcao_conselho")||formData.get("funcao_tesouraria")||"").trim();
    const funcaoFinal = normalizarFuncao(funcaoRaw);

    if (!nome || !cpf || !oficio) return { error: "Nome, CPF e Ofício são obrigatórios." };
    if (cpf.length !== 11) return { error: "CPF inválido." };

    const { data: cpfExiste } = await supabaseAdmin.from("users").select("id,nome").eq("cpf", cpf).maybeSingle();
    if (cpfExiste) return { error: `CPF já cadastrado para ${cpfExiste.nome}` };

    // CORREÇÃO DO 500: não usa coluna funcao que não existe
    if (funcaoFinal && FUNCOES_UNICAS.includes(funcaoFinal)) {
      if (funcaoFinal === "tesoureiro_igreja") {
        const { data: igreja } = await supabaseAdmin.from("igrejas").select("tesoureiro_user_id").eq("id", me.igreja_id).maybeSingle();
        if (igreja?.tesoureiro_user_id) {
          const { data: ocup } = await supabaseAdmin.from("users").select("nome").eq("id", igreja.tesoureiro_user_id).maybeSingle();
          return { error: `Tesoureiro da Igreja já ocupado por ${ocup?.nome||"outro"}. Remova dele primeiro.` };
        }
      } else {
        // busca só nas colunas que existem
        const { data: ocupante } = await supabaseAdmin.from("users").select("id,nome").eq("igreja_id", me.igreja_id).neq("status","excluido")
          .or(`funcao_diacono.eq.${funcaoFinal},funcao_presbitero.eq.${funcaoFinal}`).maybeSingle();
        if (ocupante) return { error: `Função "${funcaoFinal.replace(/_/g," ")}" já ocupada por ${ocupante.nome}.` };
      }
    }

    const senhaPadrao = cpf.slice(-4);
    const senhaHash = await hashPassword(senhaPadrao);

    let dataVenc = null;
    if (mandatoRaw && /^\d{4}-\d{2}-\d{2}$/.test(mandatoRaw)) dataVenc = mandatoRaw;
    else if (mandatoRaw && mandatoRaw.includes("/")) {
      const [d,m,y] = mandatoRaw.split("/");
      if (y && m && d) dataVenc = `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
    }

    const novoUsuario = {
      igreja_id: me.igreja_id,
      nome, cpf, endereco: endereco||null, telefone: telefone||null, foto,
      oficio, status: "ativo",
      data_instalacao: new Date().toISOString().slice(0,10),
      data_vencimento_mandato: dataVenc,
      senha_hash: senhaHash,
    };

    if (funcaoFinal) {
      if (funcaoFinal.includes("junta")) novoUsuario.funcao_diacono = funcaoFinal;
      else if (funcaoFinal.includes("conselho")) novoUsuario.funcao_presbitero = funcaoFinal;
    }

    const { data: criado, error } = await supabaseAdmin.from("users").insert(novoUsuario).select("id").single();
    if (error) return { error: "Erro Supabase: "+error.message };

    if (funcaoFinal === "tesoureiro_igreja") {
      await supabaseAdmin.from("igrejas").update({ tesoureiro_user_id: criado.id }).eq("id", me.igreja_id);
    }

    revalidatePath("/usuarios");
    return { success: true, senha: senhaPadrao, id: criado.id };

  } catch (e) {
    console.error("ERRO criarUsuarioAction:", e);
    return { error: e.message || "Erro interno" };
  }
}
