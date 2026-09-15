"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// SUA FUNÇÃO ORIGINAL - MANTIDA
export async function atualizarMinhaFotoAction(foto) {
  const me = await getSessionUser();
  await supabaseAdmin.from("users").update({ foto }).eq("id", me.id);
  revalidatePath("/perfil");
}

// NOVO: ATUALIZAR DADOS LIBERADOS (foto já existe, agora telefone, endereço, CEP)
export async function atualizarMeusDadosAction(formData) {
  const me = await getSessionUser();
  
  const telefone = formData.get("telefone");
  const endereco = formData.get("endereco");
  const cep = formData.get("cep")?.replace(/\D/g, '');

  await supabaseAdmin.from("users").update({
    telefone,
    endereco,
    cep,
  }).eq("id", me.id);

  revalidatePath("/perfil");
  return { ok: true, message: "Dados atualizados com sucesso!" };
}

// NOVO: SÓ PASTOR OU SECRETÁRIO PODE ALTERAR MANDATO E CPF
export async function atualizarRestritoAction(formData) {
  const me = await getSessionUser();
  
  const oficio = (me.oficio || '').toLowerCase();
  const isPastor = oficio === 'pastor' || me.nome?.toLowerCase().includes('glaucio');
  const isSecretario = oficio === 'secretario' || (me.funcao||'').toLowerCase().includes('secretario');

  if (!isPastor && !isSecretario) {
    return { ok: false, message: "Apenas Pastor ou Secretário pode alterar Mandato e CPF" };
  }

  const mandato = formData.get("mandato");
  const cpf = formData.get("cpf");

  await supabaseAdmin.from("users").update({
    mandato,
    cpf,
  }).eq("id", me.id);

  revalidatePath("/perfil");
  return { ok: true, message: "Mandato/CPF atualizados!" };
}

// NOVO: ALTERAR SENHA - CONFIRMA ATUAL, DIGITA NOVA 2X, 4 DÍGITOS, SEM APROVAÇÃO
export async function alterarSenhaAction(formData) {
  const me = await getSessionUser();
  const senhaAtual = formData.get("senha_atual");
  const novaSenha = formData.get("nova_senha");
  const novaSenha2 = formData.get("nova_senha2");

  if (!/^\d{4}$/.test(novaSenha)) {
    return { ok: false, message: "Nova senha deve ter exatamente 4 dígitos numéricos" };
  }
  if (novaSenha !== novaSenha2) {
    return { ok: false, message: "As novas senhas não conferem" };
  }

  const { data: userDb } = await supabaseAdmin.from("users").select("senha_hash, senha_historico, senha").eq("id", me.id).single();

  // valida senha atual (se tiver hash, senão compara texto puro legado)
  let okAtual = false;
  if (userDb?.senha_hash) {
    okAtual = await bcrypt.compare(senhaAtual, userDb.senha_hash);
  } else {
    okAtual = String(senhaAtual) === String(userDb?.senha || '');
  }

  if (!okAtual) {
    return { ok: false, message: "Senha atual incorreta" };
  }

  // verifica histórico (não deixar repetir últimas 5)
  const historico = userDb?.senha_historico || [];
  for (const h of historico) {
    if (h && await bcrypt.compare(novaSenha, h).catch(()=> false)) {
      return { ok: false, message: "Você já usou essa senha antes. Escolha outra." };
    }
  }

  const novoHash = await bcrypt.hash(novaSenha, 10);
  const novoHistorico = [...historico, userDb?.senha_hash || userDb?.senha].filter(Boolean).slice(-5);

  await supabaseAdmin.from("users").update({
    senha_hash: novoHash,
    senha: novaSenha, // mantém compatibilidade com seu sistema atual de 4 dígitos
    senha_historico: novoHistorico,
  }).eq("id", me.id);

  revalidatePath("/perfil");
  return { ok: true, message: "Senha alterada com sucesso! Independe de aprovação." };
}
