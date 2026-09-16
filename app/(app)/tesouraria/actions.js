"use server";

import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUser, getChurch } from "@/lib/auth";
import { canAccessTesouraria, daysBetween, today } from "@/lib/constants";
import { revalidatePath } from "next/cache";

async function requireTesouraria() {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);
  if (!canAccessTesouraria(me, church)) throw new Error("Acesso restrito ao Tesoureiro e Pastor.");
  return { me, church };
}

function isPastor(u) {
  return u.oficio === "pastor";
}

// -------------------- Lançamentos --------------------

export async function criarLancamentoAction(payload) {
  const { me } = await requireTesouraria();
  const { tipo, data, historico, valor, categoria, recorrente, frequencia, data_fim_recorrencia } = payload;

  if (data < today()) {
    const dentro90 = daysBetween(data, today()) <= 90;
    if (!dentro90) {
      const liberado = await hasLiberacaoData(me.igreja_id, data);
      if (!liberado) {
        throw new Error("Data com mais de 90 dias no passado. Solicite liberação do Pastor abaixo.");
      }
    }
  }

  if (recorrente &&!data_fim_recorrencia) {
    throw new Error("Informe a data final da recorrência.");
  }

  const serieId = recorrente? randomUUID() : null;
  const datas = [data];

  if (recorrente && data_fim_recorrencia) {
    let d = new Date(data + "T00:00:00");
    const fim = new Date(data_fim_recorrencia + "T00:00:00");

    while (true) {
      if (frequencia === "semanal") d.setDate(d.getDate() + 7);
      else if (frequencia === "quinzenal") d.setDate(d.getDate() + 15);
      else if (frequencia === "mensal") d.setMonth(d.getMonth() + 1);
      else d.setFullYear(d.getFullYear() + 1);

      if (d > fim) break;
      datas.push(d.toISOString().slice(0, 10));
    }
  }

  const rows = datas.map((dt) => ({
    igreja_id: me.igreja_id,
    tipo, data: dt, historico, valor: Number(valor), categoria: categoria || null,
    recorrente:!!recorrente, frequencia: recorrente? frequencia : null,
    data_fim_recorrencia: recorrente? data_fim_recorrencia : null,
    serie_id: serieId,
    status: "rascunho", criado_por: me.id, criado_por_nome: me.nome,
  }));

  const { error } = await supabaseAdmin.from("lancamentos").insert(rows);
  if (error) throw new Error("Não foi possível criar o lançamento.");
  revalidatePath("/tesouraria/lancamentos");
}

async function hasLiberacaoData(igrejaId, data) {
  const { data: reqs } = await supabaseAdmin
 .from("approval_requests")
 .select("id")
 .eq("igreja_id", igrejaId)
 .eq("tipo", "liberacao_data_lancamento")
 .eq("status", "liberado")
 .contains("dados", { data });
  return (reqs || []).length > 0;
}

export async function solicitarLiberacaoDataAction(data) {
  const { me } = await requireTesouraria();
  await supabaseAdmin.from("approval_requests").insert({
    igreja_id: me.igreja_id,
    tipo: "liberacao_data_lancamento",
    dados: { data },
    solicitante_id: me.id,
    solicitante_nome: me.nome,
  });
  revalidatePath("/tesouraria/lancamentos");
}

async function addEvento(lancamentoId, nome, acao) {
  await supabaseAdmin.from("lancamento_eventos").insert({ lancamento_id: lancamentoId, nome, acao });
}

async function getLancamentoScoped(id, igrejaId) {
  const { data } = await supabaseAdmin.from("lancamentos").select("*").eq("id", id).eq("igreja_id", igrejaId).maybeSingle();
  return data;
}

export async function aprovarLancamentoAction(id) {
  const { me } = await requireTesouraria();
  const l = await getLancamentoScoped(id, me.igreja_id);
  if (!l) throw new Error("Lançamento não encontrado.");
  await supabaseAdmin.from("lancamentos").update({ status: "aprovado", data_aprovacao: today() }).eq("id", id);
  await addEvento(id, me.nome, "Aprovou o registro");
  revalidatePath("/tesouraria/lancamentos");
}

export async function reportarErroLancamentoAction(id, descricao) {
  const { me } = await requireTesouraria();
  const l = await getLancamentoScoped(id, me.igreja_id);
  if (!l) throw new Error("Lançamento não encontrado.");
  const dentroPrazo = l.data_aprovacao? daysBetween(l.data_aprovacao, today()) <= 30 : true;
  if (!dentroPrazo &&!isPastor(me)) {
    throw new Error("Prazo de 30 dias encerrado — só o Pastor pode alterar.");
  }
  await supabaseAdmin.from("lancamentos").update({ status: "erro_reportado", erro_descricao: descricao }).eq("id", id);
  await addEvento(id, me.nome, `Reportou erro: ${descricao}`);
  revalidatePath("/tesouraria/lancamentos");
}

export async function reabrirLancamentoAction(id) {
  const me = await getSessionUser();
  if (me.oficio!== "pastor") throw new Error("Apenas o Pastor pode reabrir um lançamento aprovado.");
  const l = await getLancamentoScoped(id, me.igreja_id);
  if (!l) throw new Error("Lançamento não encontrado.");
  await supabaseAdmin.from("lancamentos").update({ status: "rascunho" }).eq("id", id);
  await addEvento(id, me.nome, "Reabriu para edição (Pastor)");
  revalidatePath("/tesouraria/lancamentos");
}

export async function liberarLancamentoAction(id, liberar) {
  const me = await getSessionUser();
  if (me.oficio!== "pastor") throw new Error("Apenas o Pastor decide sobre erros reportados.");
  const l = await getLancamentoScoped(id, me.igreja_id);
  if (!l) throw new Error("Lançamento não encontrado.");
  await supabaseAdmin.from("lancamentos").update({ status: liberar? "rascunho" : "aprovado" }).eq("id", id);
  await addEvento(id, me.nome, liberar? "Liberou para edição" : "Negou a liberação");
  revalidatePath("/tesouraria/lancamentos");
}

export async function editarLancamentoAction(id, historico, valor) {
  const { me } = await requireTesouraria();
  const l = await getLancamentoScoped(id, me.igreja_id);
  if (!l) throw new Error("Lançamento não encontrado.");
  await supabaseAdmin.from("lancamentos").update({ historico, valor: Number(valor) }).eq("id", id);
  revalidatePath("/tesouraria/lancamentos");
}

export async function excluirLancamentoAction(id) {
  const me = await getSessionUser();
  const l = await getLancamentoScoped(id, me.igreja_id);
  if (!l) return;
  const souCriador = l.criado_por === me.id;
  const podeExcluir = (l.status === "rascunho" && (souCriador || me.oficio === "pastor"))
    || (me.oficio === "pastor" && l.status!== "rascunho");
  if (!podeExcluir) throw new Error("Você não tem permissão para excluir este lançamento.");
  await supabaseAdmin.from("lancamentos").delete().eq("id", id);
  revalidatePath("/tesouraria/lancamentos");
}

// -------------------- Saldo inicial --------------------

export async function definirSaldoInicialAction(valor, data) {
  const { me } = await requireTesouraria();
  const { data: existing } = await supabaseAdmin.from("financas").select("*").eq("igreja_id", me.igreja_id).maybeSingle();
  if (existing?.bloqueado && me.oficio!== "pastor") {
    throw new Error("Saldo inicial já confirmado — solicite liberação do Pastor.");
  }
  const payload = {
    igreja_id: me.igreja_id,
    saldo_inicial_valor: Number(valor), saldo_inicial_data: data,
    bloqueado: true, definido_por_nome: me.nome, definido_em: new Date().toISOString(),
  };
  if (existing) await supabaseAdmin.from("financas").update(payload).eq("id", existing.id);
  else await supabaseAdmin.from("financas").insert(payload);
  revalidatePath("/tesouraria/fluxo");
}

export async function solicitarLiberacaoSaldoAction() {
  const { me } = await requireTesouraria();
  await supabaseAdmin.from("approval_requests").insert({
    igreja_id: me.igreja_id, tipo: "liberacao_saldo_inicial", solicitante_id: me.id, solicitante_nome: me.nome,
  });
  revalidatePath("/tesouraria/fluxo");
}

// -------------------- Decisões do Pastor sobre solicitações --------------------

export async function decidirSolicitacaoAction(requestId, liberar) {
  const me = await getSessionUser();
  if (me.oficio!== "pastor") {
    throw new Error("Apenas Pastor.");
  }
  const { data: reqRow } = await supabaseAdmin
 .from("approval_requests")
 .select("*")
 .eq("id", requestId)
 .eq("igreja_id", me.igreja_id)
 .maybeSingle();
  if (!reqRow) return;

  await supabaseAdmin
 .from("approval_requests")
 .update({ status: liberar? "liberado" : "negado", decidido_por_nome: me.nome, decided_at: new Date().toISOString() })
 .eq("id", requestId);

  if (liberar && reqRow.tipo === "liberacao_saldo_inicial") {
    const { data: fin } = await supabaseAdmin.from("financas").select("id").eq("igreja_id", me.igreja_id).maybeSingle();
    if (fin) await supabaseAdmin.from("financas").update({ bloqueado: false }).eq("id", fin.id);
  }
  revalidatePath("/tesouraria/fluxo");
  revalidatePath("/tesouraria/lancamentos");
  revalidatePath("/usuarios");
}

// -------------------- Recibo de Dizimista/Ofertante - CORRIGIDO PRO SEU SCHEMA REAL --------------------

export async function buscarDizimistaOfertanteAction(nomeBusca) {
  const { me } = await requireTesouraria();
  if (!nomeBusca || nomeBusca.trim().length < 2) return [];

  const { data, error } = await supabaseAdmin
   .from("records")
   .select("membro_nome, data_culto, valor")
   .eq("igreja_id", me.igreja_id)
   .eq("status", "validado")
   .ilike("membro_nome", `%${nomeBusca.trim()}%`)
   .limit(300);

  if (error) throw new Error("Erro ao buscar: " + error.message);
  if (!data || data.length === 0) return [];

  const mapa = new Map();
  data.forEach(r => {
    if (!r.membro_nome) return;
    const nomeLimpo = r.membro_nome.trim();
    if (!nomeLimpo) return;
    const key = nomeLimpo.toLowerCase();
    if (!mapa.has(key)) {
      mapa.set(key, { nome: nomeLimpo, total_contribuicoes: 0, ultimo_culto: r.data_culto });
    }
    const e = mapa.get(key);
    e.total_contribuicoes++;
    if (r.data_culto && (!e.ultimo_culto || r.data_culto > e.ultimo_culto)) {
      e.ultimo_culto = r.data_culto;
    }
  });

  return Array.from(mapa.values()).slice(0, 15);
}

export async function obterContribuicoesMesAction(nomeSelecionado, mesAno) {
  const { me } = await requireTesouraria();
  if (!nomeSelecionado) throw new Error("Selecione uma pessoa.");
  if (!mesAno) throw new Error("Selecione mês/ano.");

  const [ano, mes] = mesAno.split("-").map(Number);
  const inicio = new Date(ano, mes - 1, 1).toISOString().slice(0, 10);
  const fim = new Date(ano, mes, 0).toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin
   .from("records")
   .select("membro_nome, tipo, valor, data_culto")
   .eq("igreja_id", me.igreja_id)
   .eq("status", "validado")
   .ilike("membro_nome", nomeSelecionado.trim())
   .gte("data_culto", inicio)
   .lte("data_culto", fim)
   .order("data_culto", { ascending: true });

  if (error) throw new Error("Erro ao carregar: " + error.message);

  const contribuicoes = (data || []).map(r => ({
    data: r.data_culto,
    tipo: r.tipo,
    valor: Number(r.valor),
  }));

  const total = contribuicoes.reduce((s, c) => s + c.valor, 0);
  return { contribuicoes, total, periodo: { inicio, fim, mesAno } };
}
