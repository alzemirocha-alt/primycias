"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPassword, verifyPassword, validarSenha } from "@/lib/password";
import { createSession, createDevSession } from "@/lib/auth";
import { uploadIgrejaDoc, slugify } from "@/lib/storage";
import { notificarNovaIgrejaAction } from "@/lib/email";
import { DEV_CPF, DEV_EMAIL } from "@/lib/constants";
import { redirect } from "next/navigation";

function onlyDigits(s) {
  return String(s || "").replace(/\D/g, "");
}

// CPF sempre com 11 posições — preserva zeros à esquerda que às vezes se
// perdem na digitação/máscara (ex.: "01234567890" virando "1234567890").
function normalizeCpf(s) {
  return onlyDigits(s).padStart(11, "0");
}

// Loga a mensagem REAL do Supabase no console do servidor (visível nos logs
// da Vercel / `next dev`), sem expor isso na tela do usuário.
function logSupabaseError(contexto, error) {
  if (!error) return;
  console.error(`[login] ${contexto}:`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });
}

// Busca o usuário pelo CPF na tabela `users` (nome usado em todo o app e no
// schema.sql). Se não encontrar nada por lá — nem erro, nem linha — tenta
// `usuarios` como fallback, caso o banco tenha sido montado com esse nome
// em algum momento. Retorna { user, error } com o erro real do Supabase
// (da última tentativa) para diagnóstico.
async function findUserByCpf(cpf) {
  const tentativa1 = await supabaseAdmin.from("users").select("*").eq("cpf", cpf).maybeSingle();
  logSupabaseError("consulta em public.users", tentativa1.error);
  if (tentativa1.data) return { user: tentativa1.data, error: null, tabela: "users" };
  if (tentativa1.error && tentativa1.error.code !== "42P01") {
    // Erro real (não é "tabela não existe") — não adianta tentar a outra tabela.
    return { user: null, error: tentativa1.error, tabela: "users" };
  }

  const tentativa2 = await supabaseAdmin.from("usuarios").select("*").eq("cpf", cpf).maybeSingle();
  logSupabaseError("consulta em public.usuarios (fallback)", tentativa2.error);
  if (tentativa2.data) return { user: tentativa2.data, error: null, tabela: "usuarios" };
  return { user: null, error: tentativa2.error || tentativa1.error, tabela: null };
}

// -------------------- Aba 1 — Acesso Igreja (CPF) --------------------

export async function loginAction(prevState, formData) {
  const cpf = normalizeCpf(formData.get("cpf"));
  const senha = String(formData.get("senha") || "");

  if (cpf.length !== 11) return { error: "Informe um CPF válido." };

  const { user, error, tabela } = await findUserByCpf(cpf);

  if (error) {
    // A mensagem real já foi para o log do servidor (logSupabaseError acima).
    return { error: `Erro ao consultar o cadastro (${error.code || "sem código"}: ${error.message || "erro desconhecido"}).` };
  }
  if (!user) return { error: "CPF não encontrado. Cadastre-se abaixo." };
  if (user.status === "pendente") {
    return { error: "Seu cadastro ainda aguarda aprovação do Pastor ou do Secretário do Conselho." };
  }
  if (user.status === "inativo") {
    return { error: "Este cadastro está inativo. Procure a liderança da igreja." };
  }

  const senhaCampo = user.senha_hash ?? user.senha ?? null;
  const ok = await verifyPassword(senha, senhaCampo);
  if (!ok) return { error: "Senha incorreta." };

  // Se a senha ainda estava em texto puro (conta antiga/legada), gera o
  // hash agora e regrava — daqui pra frente essa conta já fica protegida.
  const eraTextoPuro = senhaCampo && !/^\$2[aby]\$/.test(senhaCampo);
  if (eraTextoPuro) {
    const novoHash = await hashPassword(senha);
    await supabaseAdmin.from(tabela).update({ senha_hash: novoHash }).eq("id", user.id);
  }

  // Se a igreja do usuário não estiver ativa (suspensa/expirada/pendente),
  // ninguém entra — exceto o CPF do desenvolvedor, cuja conta na Igreja
  // Sucupira é sempre válida (é a igreja raiz da plataforma).
  if (cpf !== DEV_CPF) {
    const { data: igreja, error: erroIgreja } = await supabaseAdmin
      .from("igrejas")
      .select("status")
      .eq("id", user.igreja_id)
      .maybeSingle();
    logSupabaseError("consulta em public.igrejas", erroIgreja);
    if (erroIgreja) {
      return { error: `Erro ao consultar a igreja (${erroIgreja.code || "sem código"}: ${erroIgreja.message || "erro desconhecido"}).` };
    }
    if (!igreja || igreja.status !== "ativa") {
      return { error: "O acesso da sua igreja está indisponível no momento (pendente, suspenso ou expirado). Procure a liderança." };
    }
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function listIgrejasAtivasAction() {
  const { data } = await supabaseAdmin
    .from("igrejas")
    .select("id, nome")
    .eq("status", "ativa")
    .order("nome");
  return data || [];
}

export async function registerAction(prevState, formData) {
  const cpf = normalizeCpf(formData.get("cpf"));
  const nome = String(formData.get("nome") || "").trim();
  const senha = String(formData.get("senha") || "");
  const senha2 = String(formData.get("senha2") || "");
  const dataNascimento = String(formData.get("dataNascimento") || "") || null;
  const endereco = String(formData.get("endereco") || "") || null;
  const telefone = String(formData.get("telefone") || "") || null;
  const foto = String(formData.get("foto") || "") || null;
  const cep = String(formData.get("cep") || "") || null;
  const igrejaId = String(formData.get("igrejaId") || "") || null;

  if (!igrejaId) return { error: "Selecione a sua igreja." };
  if (cpf.length !== 11) return { error: "Informe um CPF válido (11 dígitos)." };
  if (!nome) return { error: "Informe o nome completo." };

  const { data: igreja } = await supabaseAdmin.from("igrejas").select("id, status").eq("id", igrejaId).maybeSingle();
  if (!igreja || igreja.status !== "ativa") return { error: "Igreja inválida ou inativa." };

  const erroSenha = validarSenha(senha, dataNascimento);
  if (erroSenha) return { error: erroSenha };
  if (senha !== senha2) return { error: "As senhas não coincidem." };

  const { data: existing } = await supabaseAdmin.from("users").select("id").eq("cpf", cpf).maybeSingle();
  if (existing) return { error: "Este CPF já possui cadastro." };

  const { count } = await supabaseAdmin
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("igreja_id", igrejaId);
  const isFirstOfChurch = (count || 0) === 0;

  const senhaHash = await hashPassword(senha);

  const { data: created, error: insertError } = await supabaseAdmin
    .from("users")
    .insert({
      igreja_id: igrejaId,
      cpf,
      nome,
      senha_hash: senhaHash,
      oficio: isFirstOfChurch ? "pastor" : "membro",
      data_nascimento: dataNascimento,
      endereco,
      cep,
      telefone,
      foto,
      status: isFirstOfChurch ? "ativo" : "pendente",
      data_instalacao: isFirstOfChurch ? new Date().toISOString().slice(0, 10) : null,
    })
    .select()
    .single();

  if (insertError) return { error: "Não foi possível concluir o cadastro. Tente novamente." };

  await supabaseAdmin.from("password_history").insert({
    igreja_id: igrejaId,
    user_id: created.id,
    acao: "Senha cadastrada no registro inicial",
    por_nome: nome,
    por_cpf: cpf,
  });

  if (isFirstOfChurch) {
    await createSession(created.id);
    redirect("/dashboard");
  }

  return { success: "Cadastro enviado! Aguarde a aprovação do Pastor ou do Secretário do Conselho da sua igreja." };
}

export async function forgotPasswordAction(prevState, formData) {
  const cpf = normalizeCpf(formData.get("cpf"));
  const senha = String(formData.get("senha") || "");
  const senha2 = String(formData.get("senha2") || "");

  const { user, error: erroBusca } = await findUserByCpf(cpf);
  if (erroBusca) {
    return { error: `Erro ao consultar o cadastro (${erroBusca.code || "sem código"}: ${erroBusca.message || "erro desconhecido"}).` };
  }
  if (!user) return { error: "CPF não encontrado." };

  const erroSenha = validarSenha(senha, user.data_nascimento);
  if (erroSenha) return { error: erroSenha };
  if (senha !== senha2) return { error: "As senhas não coincidem." };

  const novaSenhaHash = await hashPassword(senha);

  const { error } = await supabaseAdmin.from("password_reset_requests").insert({
    igreja_id: user.igreja_id,
    user_id: user.id,
    nova_senha_hash: novaSenhaHash,
    status: "pendente",
  });
  logSupabaseError("insert em password_reset_requests", error);
  if (error) return { error: `Não foi possível enviar a solicitação (${error.code || "sem código"}: ${error.message || "erro desconhecido"}).` };

  return { success: "Solicitação enviada! Assim que o Pastor ou o Secretário liberarem, a nova senha passa a valer." };
}

// -------------------- "Criar minha igreja" (nova igreja na plataforma) --------------------

export async function criarIgrejaAction(prevState, formData) {
  const nomeIgreja = String(formData.get("nomeIgreja") || "").trim();
  const cnpj = String(formData.get("cnpj") || "").trim();
  const nomePastor = String(formData.get("nomePastor") || "").trim();
  const cpfPastor = normalizeCpf(formData.get("cpfPastor"));
  const email = String(formData.get("email") || "").trim();
  const telefone = String(formData.get("telefone") || "").trim();
  const endereco = String(formData.get("endereco") || "").trim();
  const senha = String(formData.get("senha") || "");
  const senha2 = String(formData.get("senha2") || "");
  const docCnpj = String(formData.get("docCnpj") || "");
  const docResponsavel = String(formData.get("docResponsavel") || "");

  if (!nomeIgreja) return { error: "Informe o nome da igreja." };
  if (!cnpj) return { error: "Informe o CNPJ da igreja." };
  if (!nomePastor) return { error: "Informe o nome do pastor responsável." };
  if (cpfPastor.length !== 11) return { error: "Informe um CPF válido para o pastor responsável." };
  if (!email) return { error: "Informe um e-mail de contato." };
  if (!docCnpj) return { error: "Anexe o Cartão CNPJ." };
  if (!docResponsavel) return { error: "Anexe o documento do Pastor (RG/CNH, frente e verso)." };

  const erroSenha = validarSenha(senha, null);
  if (erroSenha) return { error: erroSenha };
  if (senha !== senha2) return { error: "As senhas não coincidem." };

  const { data: cpfExists } = await supabaseAdmin.from("users").select("id").eq("cpf", cpfPastor).maybeSingle();
  if (cpfExists) return { error: "Este CPF já possui cadastro em outra igreja." };

  const slug = `${slugify(nomeIgreja)}-${Date.now()}`;

  let pathCnpj, pathResponsavel;
  try {
    pathCnpj = await uploadIgrejaDoc(slug, "cnpj", docCnpj);
    pathResponsavel = await uploadIgrejaDoc(slug, "responsavel", docResponsavel);
  } catch (e) {
    return { error: e.message || "Não foi possível enviar os documentos. Tente novamente." };
  }

  const { data: igreja, error: igrejaError } = await supabaseAdmin
    .from("igrejas")
    .insert({
      nome: nomeIgreja,
      cnpj,
      nome_pastor_responsavel: nomePastor,
      cpf_pastor: cpfPastor,
      email,
      telefone,
      endereco,
      doc_cnpj_url: pathCnpj,
      doc_responsavel_url: pathResponsavel,
      status: "pendente_pagamento",
      tipo_licenca: "aguardando_aprovacao",
    })
    .select()
    .single();

  if (igrejaError) return { error: "Não foi possível criar a igreja. Tente novamente." };

  const senhaHash = await hashPassword(senha);
  await supabaseAdmin.from("users").insert({
    igreja_id: igreja.id,
    cpf: cpfPastor,
    nome: nomePastor,
    senha_hash: senhaHash,
    oficio: "pastor",
    telefone,
    status: "pendente", // libera automaticamente quando o Desenvolvedor aprovar a igreja
  });

  await notificarNovaIgrejaAction({
    igreja,
    urlCnpj: `(bucket privado) ${pathCnpj}`,
    urlResponsavel: `(bucket privado) ${pathResponsavel}`,
  });

  return {
    success:
      "Cadastro enviado! Sua igreja foi registrada e está aguardando aprovação do Desenvolvedor da Plataforma. Você será avisado assim que for liberada.",
  };
}

// -------------------- Aba 2 — Acesso Desenvolvedor da Plataforma (e-mail) --------------------

export async function devLoginAction(prevState, formData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const senha = String(formData.get("senha") || "");

  if (email !== DEV_EMAIL) {
    return { error: "Acesso restrito ao Desenvolvedor da Plataforma." };
  }

  const { data: admin } = await supabaseAdmin
    .from("plataforma_admins")
    .select("*")
    .eq("email", DEV_EMAIL)
    .maybeSingle();

  if (!admin) return { error: "Conta do desenvolvedor ainda não provisionada. Rode o script de seed." };

  const ok = await verifyPassword(senha, admin.senha_hash);
  if (!ok) return { error: "Senha incorreta." };

  await createDevSession(admin.id, admin.email);
  redirect("/desenvolvedor");
}
