"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Btn, Card, Input } from "@/components/ui";
import ExportExcelButton from "@/components/ExportExcelButton";
import { CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA, brl } from "@/lib/constants";
import { salvarPrevistoAction } from "./actions";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function OrcamentoClient({ igrejaId, ano, categorias, mensal, canEdit }) {
  const [valores, setValores] = useState(Object.fromEntries(categorias.map((c) => [c.categoria, c.valor_previsto])));
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const previstoEntradasAno = CATEGORIAS_ENTRADA.reduce((s, cat) => s + (Number(valores[cat]) || 0), 0);
  const previstoSaidasAno = CATEGORIAS_SAIDA.reduce((s, cat) => s + (Number(valores[cat]) || 0), 0);
  const previstoEntradasMes = previstoEntradasAno / 12;
  const previstoSaidasMes = previstoSaidasAno / 12;

  const chartData = mensal.map((m, i) => ({
    mes: MESES[i],
    "Entradas previstas": Math.round(previstoEntradasMes),
    "Entradas realizadas": Math.round(m.entradas),
    "Saídas previstas": Math.round(previstoSaidasMes),
    "Saídas realizadas": Math.round(m.saidas),
  }));

  function salvar(categoria) {
    startTransition(async () => {
      await salvarPrevistoAction(ano, categoria, valores[categoria] || 0);
      router.refresh();
    });
  }

  function trocarAno(novoAno) {
    router.push(`/igreja/${igrejaId}/orcamento-anual?ano=${novoAno}`);
  }

  const totalPrevisto = previstoEntradasAno - previstoSaidasAno;
  const totalRealizado = categorias.reduce((s, c) => s + c.valor_realizado, 0);
  const jsonHref = `/api/reports/orcamento-anual?igrejaId=${igrejaId}&ano=${ano}`;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <h2 className="text-xl font-serif text-ink">Orçamento Anual</h2>
        <div className="flex items-center gap-2">
          <Btn kind="subtle" onClick={() => trocarAno(ano - 1)}>← {ano - 1}</Btn>
          <span className="text-sm font-medium">{ano}</span>
          <Btn kind="subtle" onClick={() => trocarAno(ano + 1)}>{ano + 1} →</Btn>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-5">
        {canEdit
          ? "Defina o valor previsto para o ano por categoria. O realizado é calculado automaticamente a partir dos registros e lançamentos validados."
          : "Visualização do orçamento do ano — apenas Pastor e Tesoureiro podem editar os valores previstos."}
      </p>

      <div className="flex flex-wrap gap-3 mb-4">
        <StatCard label="Previsto (entradas − saídas)" value={brl(totalPrevisto)} />
        <StatCard label="Saldo realizado no ano" value={brl(totalRealizado)} />
      </div>

      <Card className="mb-4">
        <div className="text-sm font-medium mb-3">Previsto × Realizado por mês</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => brl(v)} />
            <Legend />
            <Bar dataKey="Entradas previstas" fill="#9FE0B4" />
            <Bar dataKey="Entradas realizadas" fill="#1E5631" />
            <Bar dataKey="Saídas previstas" fill="#E7C9C9" />
            <Bar dataKey="Saídas realizadas" fill="#8C3B3B" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium">Relatório anual por categoria</div>
          <div className="flex gap-2">
            <a href={`/api/reports/orcamento-anual?igrejaId=${igrejaId}&ano=${ano}`} target="_blank" rel="noreferrer">
              <Btn kind="subtle">Baixar PDF</Btn>
            </a>
            <ExportExcelButton href={jsonHref} nomeArquivo={`orcamento-anual-${ano}`} />
          </div>
        </div>

        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500 border-b border-paperDeep">
              <th className="py-1.5">Categoria</th>
              <th className="py-1.5">Previsto (ano)</th>
              <th className="py-1.5">Realizado (ano)</th>
              {canEdit && <th className="py-1.5"></th>}
            </tr>
          </thead>
          <tbody>
            {categorias.map((c) => (
              <tr key={c.categoria} className="border-b border-paperDeep">
                <td className="py-1.5">{c.categoria}</td>
                <td className="py-1.5">
                  {canEdit ? (
                    <Input
                      type="number"
                      step="0.01"
                      className="!py-1 w-32"
                      value={valores[c.categoria] ?? ""}
                      onChange={(e) => setValores((v) => ({ ...v, [c.categoria]: e.target.value }))}
                    />
                  ) : (
                    brl(c.valor_previsto)
                  )}
                </td>
                <td className="py-1.5">{brl(c.valor_realizado)}</td>
                {canEdit && (
                  <td className="py-1.5">
                    <Btn kind="subtle" className="!py-1 !px-2 text-xs" disabled={isPending} onClick={() => salvar(c.categoria)}>
                      Salvar
                    </Btn>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-line rounded-sm p-4 flex-1 min-w-[180px]">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-serif" style={{ color: "#1E5631" }}>{value}</div>
    </div>
  );
}
