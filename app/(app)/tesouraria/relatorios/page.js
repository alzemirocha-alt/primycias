"use client";

import { useState, useTransition } from "react";
import { Btn, Field, Input } from "@/components/ui";
import ExportExcelButton from "@/components/ExportExcelButton";
import { buscarDizimistaOfertanteAction, obterContribuicoesMesAction } from "../actions";

function reportLink(path, params) {
  return `${path}?${new URLSearchParams(params).toString()}`;
}
// fallbacks locais caso constants não tenha
function fmtDateLocal(v){ try{ return new Date(v+'T12:00:00').toLocaleDateString('pt-BR')}catch{ return v } }
function brlLocal(v){ return Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) }

// tenta usar os do constants, se não existir usa local
let brl = brlLocal;
let fmtDate = fmtDateLocal;
try {
  const c = require("@/lib/constants");
  if (c.brl) brl = c.brl;
  if (c.fmtDate) fmtDate = c.fmtDate;
} catch {}

export default function RelatoriosTesourariaPage() {
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
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

      {/* RECIBO DE DIZIMISTA/OFERTANTE - NOVA ROTINA */}
      <ReciboDizimistaOfertante />

      <div className="bg-white border border-line rounded-sm p-4 mt-4">
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

function ReciboDizimistaOfertante() {
  const [nomeBusca, setNomeBusca] = useState("");
  const [resultados, setResultados] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [mesAno, setMesAno] = useState(new Date().toISOString().slice(0, 7));
  const [contribuicoes, setContribuicoes] = useState(null);
  const [msg, setMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const buscar = () => {
    setMsg(""); setResultados([]); setSelecionado(null); setContribuicoes(null);
    startTransition(async () => {
      try {
        const res = await buscarDizimistaOfertanteAction(nomeBusca);
        if (res.length === 0) setMsg("Nenhum dizimista/ofertante encontrado com registros validados.");
        setResultados(res);
      } catch (e) { setMsg(e.message); }
    });
  };

  const carregarMes = () => {
    if (!selecionado || !mesAno) { setMsg("Selecione a pessoa e o mês/ano."); return; }
    setMsg(""); setContribuicoes(null);
    startTransition(async () => {
      try {
        const res = await obterContribuicoesMesAction(selecionado.nome, mesAno);
        setContribuicoes(res);
        if (res.contribuicoes.length === 0) setMsg(`Nenhuma contribuição validada para ${selecionado.nome} em ${mesAno}.`);
      } catch (e) { setMsg(e.message); }
    });
  };

  return (
    <div className="bg-white border border-line rounded-sm p-4 mb-4">
      <div className="text-sm font-medium mb-3">Recibo de Dizimista/Ofertante</div>
      
      <div className="flex flex-wrap gap-2 items-end mb-3">
        <div className="flex-1 min-w-[200px]">
          <Field label="Nome da pessoa">
            <Input value={nomeBusca} onChange={(e) => setNomeBusca(e.target.value)} placeholder="Digite o nome e clique em Buscar" onKeyDown={(e)=> e.key==='Enter' && buscar()} />
          </Field>
        </div>
        <Btn disabled={isPending || !nomeBusca} onClick={buscar}>Buscar</Btn>
      </div>

      {resultados.length > 0 && (
        <div className="border rounded-sm mb-3 max-h-48 overflow-auto">
          <div className="text-xs text-gray-500 p-2">Encontramos {resultados.length} pessoa(s) com registros validados. Selecione apenas 1 por recibo:</div>
          {resultados.map((p, i) => (
            <div key={i} className={`flex justify-between items-center p-2 text-sm cursor-pointer border-b hover:bg-gray-50 ${selecionado?.nome===p.nome?'bg-[#E9EFE7]':''}`} onClick={()=>{ setSelecionado(p); setContribuicoes(null); }}>
              <span><b>{p.nome}</b> <span className="text-xs text-gray-500">· {p.total_contribuicoes} contrib. · último: {p.ultimo_culto? fmtDate(p.ultimo_culto) : '-'}</span></span>
              {selecionado?.nome===p.nome && <span className="text-xs bg-green-700 text-white px-2 py-0.5 rounded">Selecionado</span>}
            </div>
          ))}
        </div>
      )}

      {selecionado && (
        <div className="flex flex-wrap gap-2 items-end mb-3 bg-[#F8FAF7] p-3 rounded-sm border">
          <Field label="Mês/Ano do recibo">
            <Input type="month" value={mesAno} onChange={(e)=>setMesAno(e.target.value)} />
          </Field>
          <Btn kind="subtle" disabled={isPending || !mesAno} onClick={carregarMes}>Carregar</Btn>
          <span className="text-xs mb-2">Pessoa: <b>{selecionado.nome}</b></span>
        </div>
      )}

      {contribuicoes && contribuicoes.contribuicoes.length > 0 && (
        <div className="border rounded-sm p-3 mb-3">
          <div className="text-sm font-medium mb-2">Contribuições em {mesAno} - Total: {brl(contribuicoes.total)}</div>
          <div className="space-y-1 text-xs max-h-40 overflow-auto">
            {contribuicoes.contribuicoes.map((c, i) => (
              <div key={i} className="flex justify-between border-b py-1">
                <span>{fmtDate(c.data)} · {c.tipo==='dizimo'?'Dízimo':'Oferta'} </span>
                <b>{brl(c.valor)}</b>
              </div>
            ))}
          </div>
        </div>
      )}

      {msg && <div className="text-xs text-red-700 mb-3">{msg}</div>}

      <div className="flex gap-2 items-center">
        <a href={selecionado && contribuicoes && contribuicoes.contribuicoes.length>0 ? reportLink("/api/reports/recibo-dizimista", { nome: selecionado.nome, mesAno, de: contribuicoes.periodo.inicio, ate: contribuicoes.periodo.fim }) : "#"} target="_blank" rel="noreferrer">
          <Btn kind="gold" disabled={!selecionado || !contribuicoes || contribuicoes.contribuicoes.length===0}>Emitir recibo</Btn>
        </a>
        <span className="text-xs text-gray-500">Busca apenas registros validados pelo Tesoureiro</span>
      </div>
    </div>
  );
}
