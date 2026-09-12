"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Btn, Field, Input, Select, Tag } from "@/components/ui";
import {
  brl, fmtDate, fmtDateTime, today, daysBetween,
  CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA, FREQUENCIAS, LANCAMENTO_STATUS_LABEL,
} from "@/lib/constants";
import {
  criarLancamentoAction, aprovarLancamentoAction, reportarErroLancamentoAction,
  reabrirLancamentoAction, liberarLancamentoAction, excluirLancamentoAction,
  solicitarLiberacaoDataAction, decidirSolicitacaoAction,
} from "../actions";

const TAG_TONE = { rascunho: "neutral", aprovado: "sage", erro_reportado: "rust" };

export default function LancamentosClient({ me, church, lancamentos, solicitacoes }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  const run = (fn) => startTransition(async () => {
    try { await fn(); router.refresh(); } catch (e) { setMsg(e.message); }
  });

  const solicitacoesData = solicitacoes.filter((s) => s.tipo === "liberacao_data_lancamento");

  return (
    <div>
      {msg && <div className="text-xs text-rust mb-3">{msg}</div>}

      {solicitacoesData.length > 0 && (
        <div className="bg-white border rounded-sm p-4 mb-4" style={{ borderColor: "#6E736E" }}>
          <div className="text-sm font-medium mb-2">Solicitações de liberação de data ({solicitacoesData.length})</div>
          {solicitacoesData.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-1.5 text-sm border-b border-paperDeep">
              <span>{s.solicitante_nome} — data {fmtDate(s.dados?.data)}</span>
              <div className="flex gap-1.5">
                <Btn kind="subtle" disabled={isPending} onClick={() => run(() => decidirSolicitacaoAction(s.id, true))}>Liberar</Btn>
                <Btn kind="ghost" disabled={isPending} onClick={() => run(() => decidirSolicitacaoAction(s.id, false))}>Negar</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      <NovoLancamentoForm onCreated={() => router.refresh()} />

      <div className="mt-4 space-y-2">
        {lancamentos.map((l) => (
          <LancamentoCard key={l.id} l={l} me={me} run={run} isPending={isPending} />
        ))}
        {lancamentos.length === 0 && <div className="text-sm text-gray-500">Nenhum lançamento ainda.</div>}
      </div>
    </div>
  );
}

function NovoLancamentoForm({ onCreated }) {
  const [tipo, setTipo] = useState("entrada");
  const [data, setData] = useState(today());
  const [historico, setHistorico] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [recorrente, setRecorrente] = useState(false);
  const [frequencia, setFrequencia] = useState("mensal");
  const [erro, setErro] = useState("");
  const [bloqueadoPorData, setBloqueadoPorData] = useState(false);
  const [isPending, startTransition] = useTransition();

  const cats = tipo === "saida" ? CATEGORIAS_SAIDA : CATEGORIAS_ENTRADA;

  const submit = () => {
    setErro(""); setBloqueadoPorData(false);
    if (!historico || !valor) { setErro("Preencha histórico e valor."); return; }
    startTransition(async () => {
      try {
        await criarLancamentoAction({ tipo, data, historico, valor, categoria, recorrente, frequencia });
        setHistorico(""); setValor("");
        onCreated();
      } catch (e) {
        setErro(e.message);
        if (e.message?.includes("90 dias")) setBloqueadoPorData(true);
      }
    });
  };

  const solicitarLiberacao = () => {
    startTransition(async () => {
      await solicitarLiberacaoDataAction(data);
      setErro("Solicitação enviada ao Pastor. Tente lançar novamente após a liberação.");
      setBloqueadoPorData(false);
    });
  };

  return (
    <div className="bg-white border border-line rounded-sm p-4">
      <div className="text-sm font-medium mb-3">Novo lançamento (imediato, futuro ou recorrente)</div>
      <div className="grid sm:grid-cols-2 gap-3 mb-2">
        <Field label="Tipo">
          <Select value={tipo} onChange={(e) => { setTipo(e.target.value); setCategoria(""); }}>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </Select>
        </Field>
        <Field label="Data">
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </Field>
      </div>
      <Field label="Histórico">
        <Input value={historico} onChange={(e) => setHistorico(e.target.value)} />
      </Field>
      <div className="grid sm:grid-cols-2 gap-3 mb-2">
        <Field label="Valor (R$)">
          <Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
        </Field>
        <Field label="Categoria">
          <Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Selecione…</option>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm mb-2">
        <input type="checkbox" checked={recorrente} onChange={(e) => setRecorrente(e.target.checked)} />
        Lançamento recorrente
      </label>
      {recorrente && (
        <Field label="Frequência">
          <Select value={frequencia} onChange={(e) => setFrequencia(e.target.value)}>
            {Object.entries(FREQUENCIAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
      )}
      {erro && <div className="text-xs text-rust mb-2">{erro}</div>}
      {bloqueadoPorData && (
        <Btn kind="subtle" disabled={isPending} onClick={solicitarLiberacao} className="mb-2">Solicitar liberação para esta data</Btn>
      )}
      <div>
        <Btn disabled={isPending} onClick={submit}>Lançar</Btn>
      </div>
    </div>
  );
}

function LancamentoCard({ l, me, run, isPending }) {
  const [erroTxt, setErroTxt] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const soPastor = me.oficio === "pastor";
  const souCriador = l.criado_por === me.id;
  const dentroPrazoErro = l.data_aprovacao ? daysBetween(l.data_aprovacao, today()) <= 30 : true;

  const podeExcluir = (l.status === "rascunho") || soPastor;

  return (
    <div className="bg-white border border-line rounded-sm p-3">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
        <div className="text-sm">
          <b style={{ color: l.tipo === "entrada" ? "#3F7A52" : "#8C3B3B" }}>{l.tipo === "entrada" ? "Entrada" : "Saída"}</b>
          {" · "}{fmtDate(l.data)} {l.data > today() && <Tag tone="gold">futuro</Tag>} {l.recorrente && <Tag>recorrente · {FREQUENCIAS[l.frequencia]}</Tag>}
        </div>
        <div className="flex items-center gap-2">
          <Tag tone={TAG_TONE[l.status]}>{LANCAMENTO_STATUS_LABEL[l.status]}</Tag>
          {podeExcluir && !confirmando && <button onClick={() => setConfirmando(true)} className="text-xs text-rust underline">Excluir</button>}
        </div>
      </div>

      {confirmando && (
        <div className="flex items-center gap-2 mb-2 text-xs">
          <span className="text-rust">Excluir definitivamente?</span>
          <Btn kind="danger" disabled={isPending} onClick={() => run(() => excluirLancamentoAction(l.id))}>Excluir</Btn>
          <Btn kind="ghost" onClick={() => setConfirmando(false)}>Cancelar</Btn>
        </div>
      )}

      <div className="text-sm mb-1">{l.historico} — <b>{brl(l.valor)}</b> <span className="text-gray-500">({l.categoria || "sem categoria"})</span></div>

      {l.status === "erro_reportado" && (
        <div className="text-xs p-2 mb-2 bg-[#F2E1DD] text-rust rounded-sm">{l.erro_descricao}</div>
      )}

      <div className="flex gap-2 flex-wrap items-center">
        {l.status === "rascunho" && <Btn kind="gold" disabled={isPending} onClick={() => run(() => aprovarLancamentoAction(l.id))}>Aprovar registro</Btn>}

        {l.status === "aprovado" && dentroPrazoErro && !soPastor && (
          <div className="flex gap-2 items-center">
            <Input placeholder="Descrever erro…" value={erroTxt} onChange={(e) => setErroTxt(e.target.value)} className="w-48" />
            <Btn kind="danger" disabled={isPending || !erroTxt} onClick={() => run(() => reportarErroLancamentoAction(l.id, erroTxt))}>Reportar erro</Btn>
          </div>
        )}
        {l.status === "aprovado" && !dentroPrazoErro && !soPastor && (
          <span className="text-xs text-gray-500">Prazo de 30 dias encerrado — só o Pastor pode alterar.</span>
        )}
        {l.status === "aprovado" && soPastor && (
          <Btn kind="subtle" disabled={isPending} onClick={() => run(() => reabrirLancamentoAction(l.id))}>Reabrir para edição (Pastor)</Btn>
        )}

        {l.status === "erro_reportado" && soPastor && (
          <div className="flex gap-2">
            <Btn kind="subtle" disabled={isPending} onClick={() => run(() => liberarLancamentoAction(l.id, true))}>Liberar para edição</Btn>
            <Btn kind="ghost" disabled={isPending} onClick={() => run(() => liberarLancamentoAction(l.id, false))}>Negar</Btn>
          </div>
        )}
        {l.status === "erro_reportado" && !soPastor && (
          <span className="text-xs text-gray-500">Aguardando decisão do Pastor.</span>
        )}
      </div>

      {l.lancamento_eventos?.length > 0 && (
        <details className="mt-2 text-xs">
          <summary className="text-gray-500 cursor-pointer">Histórico</summary>
          {l.lancamento_eventos.map((e) => (
            <div key={e.id} className="text-gray-500">{e.nome} — {e.acao} em {fmtDateTime(e.created_at)}</div>
          ))}
        </details>
      )}
    </div>
  );
}
