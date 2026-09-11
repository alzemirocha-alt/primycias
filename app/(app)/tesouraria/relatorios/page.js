"use client";

import { useState } from "react";
import { Btn, Field, Input } from "@/components/ui";
import ExportExcelButton from "@/components/ExportExcelButton";

function reportLink(path, params) {
  return `${path}?${new URLSearchParams(params).toString()}`;
}

export default function RelatoriosTesourariaPage() {
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [nomeDizimista, setNomeDizimista] = useState("");
  const [pag, setPag] = useState({ data: new Date().toISOString().slice(0, 10), historico: "", valor: "", recebedorNome: "", recebedorDoc: "" });

  const periodoParams = { de, ate };

  return (
    <div>
      <div className="bg-white border border-line rounded-sm p-4 mb-4">
        <div className="text-sm font-medium mb-3">Período</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="De"><Input type="date" value={de} onChange={(e) => setDe(e.target.value)} /></Field>
          <Field label="Até"><Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} /></Field>
        </div>
      </div>

      <div className="bg-white border border-line rounded-sm p-4 mb-4">
        <div className="text-sm font-medium mb-3">Relatórios por período</div>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <a href={reportLink("/api/reports/entradas", periodoParams)} target="_blank" rel="noreferrer"><Btn kind="subtle">Entradas</Btn></a>
            <ExportExcelButton href={reportLink("/api/reports/entradas", periodoParams)} nomeArquivo="entradas" />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <a href={reportLink("/api/reports/saidas", periodoParams)} target="_blank" rel="noreferrer"><Btn kind="subtle">Saídas/Despesas</Btn></a>
            <ExportExcelButton href={reportLink("/api/reports/saidas", periodoParams)} nomeArquivo="saidas" />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <a href={reportLink("/api/reports/fluxo", periodoParams)} target="_blank" rel="noreferrer"><Btn kind="subtle">Fluxo de caixa (realizado)</Btn></a>
            <ExportExcelButton href={reportLink("/api/reports/fluxo", periodoParams)} nomeArquivo="fluxo-caixa" />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <a href={reportLink("/api/reports/balancete", periodoParams)} target="_blank" rel="noreferrer"><Btn kind="subtle">Balancete</Btn></a>
            <ExportExcelButton href={reportLink("/api/reports/balancete", periodoParams)} nomeArquivo="balancete" />
          </div>
          <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-paperDeep mt-2">
            <a href={reportLink("/api/reports/entradas", { futuro: "1" })} target="_blank" rel="noreferrer"><Btn kind="subtle">Entradas futuras</Btn></a>
            <a href={reportLink("/api/reports/saidas", { futuro: "1" })} target="_blank" rel="noreferrer"><Btn kind="subtle">Saídas futuras</Btn></a>
            <a href={reportLink("/api/reports/fluxo", { futuro: "1" })} target="_blank" rel="noreferrer"><Btn kind="subtle">Fluxo de caixa futuro</Btn></a>
          </div>
        </div>
      </div>

      <div className="bg-white border border-line rounded-sm p-4 mb-4">
        <div className="text-sm font-medium mb-3">Recibo de Dizimista</div>
        <div className="flex flex-wrap gap-2 items-end">
          <Field label="Nome do dizimista">
            <Input value={nomeDizimista} onChange={(e) => setNomeDizimista(e.target.value)} className="w-56" />
          </Field>
          <a href={reportLink("/api/reports/recibo-dizimista", { nome: nomeDizimista, ...periodoParams })} target="_blank" rel="noreferrer">
            <Btn kind="gold" disabled={!nomeDizimista}>Emitir recibo</Btn>
          </a>
        </div>
      </div>

      <div className="bg-white border border-line rounded-sm p-4">
        <div className="text-sm font-medium mb-1">Recibo de Pagamento</div>
        <p className="text-xs text-gray-500 mb-3">A igreja entra como fonte pagadora. O recibo tem campo para assinatura do recebedor.</p>
        <div className="grid sm:grid-cols-2 gap-3 mb-2">
          <Field label="Data"><Input type="date" value={pag.data} onChange={(e) => setPag({ ...pag, data: e.target.value })} /></Field>
          <Field label="Valor (R$)"><Input type="number" step="0.01" value={pag.valor} onChange={(e) => setPag({ ...pag, valor: e.target.value })} /></Field>
        </div>
        <Field label="Histórico"><Input value={pag.historico} onChange={(e) => setPag({ ...pag, historico: e.target.value })} /></Field>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <Field label="Nome do recebedor"><Input value={pag.recebedorNome} onChange={(e) => setPag({ ...pag, recebedorNome: e.target.value })} /></Field>
          <Field label="CPF ou CNPJ do recebedor"><Input value={pag.recebedorDoc} onChange={(e) => setPag({ ...pag, recebedorDoc: e.target.value })} /></Field>
        </div>
        <a href={reportLink("/api/reports/recibo-pagamento", pag)} target="_blank" rel="noreferrer">
          <Btn kind="gold" disabled={!pag.historico || !pag.valor || !pag.recebedorNome}>Emitir recibo de pagamento</Btn>
        </a>
      </div>
    </div>
  );
}
