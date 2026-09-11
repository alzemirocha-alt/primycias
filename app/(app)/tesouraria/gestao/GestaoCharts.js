"use client";

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { brl } from "@/lib/constants";

const COLORS = ["#1E5631", "#6E736E", "#9FE0B4", "#8C3B3B", "#3F7A52", "#D3D8D0", "#454A45"];

export default function GestaoCharts({ ledger }) {
  const porMes = {};
  ledger.forEach((r) => {
    if (!r.tipo) return;
    const mes = r.data.slice(0, 7);
    porMes[mes] = porMes[mes] || { mes, entradas: 0, saidas: 0 };
    porMes[mes][r.tipo === "entrada" ? "entradas" : "saidas"] += r.valor;
  });
  const mensal = Object.values(porMes).sort((a, b) => (a.mes < b.mes ? -1 : 1)).slice(-12);

  const evolucao = ledger.filter((r) => r.saldo !== undefined).map((r) => ({ data: r.data, saldo: r.saldo }));

  const porCategoria = {};
  ledger.filter((r) => r.tipo === "saida").forEach((r) => {
    const cat = r.categoria || "Sem categoria";
    porCategoria[cat] = (porCategoria[cat] || 0) + r.valor;
  });
  const pizza = Object.entries(porCategoria).map(([name, value]) => ({ name, value }));

  const totalEntradas = ledger.filter((r) => r.tipo === "entrada").reduce((s, r) => s + r.valor, 0);
  const totalSaidas = ledger.filter((r) => r.tipo === "saida").reduce((s, r) => s + r.valor, 0);
  const saldoAtual = ledger.length ? ledger[ledger.length - 1].saldo : 0;

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <StatCard label="Total de entradas" value={brl(totalEntradas)} />
        <StatCard label="Total de saídas" value={brl(totalSaidas)} />
        <StatCard label="Saldo atual" value={brl(saldoAtual)} />
      </div>

      <div className="bg-white border border-line rounded-sm p-4 mb-4">
        <div className="text-sm font-medium mb-3">Entradas × Saídas por mês</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={mensal}>
            <XAxis dataKey="mes" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip formatter={(v) => brl(v)} />
            <Legend />
            <Bar dataKey="entradas" fill="#3F7A52" name="Entradas" />
            <Bar dataKey="saidas" fill="#8C3B3B" name="Saídas" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-line rounded-sm p-4 mb-4">
        <div className="text-sm font-medium mb-3">Evolução do saldo</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={evolucao}>
            <XAxis dataKey="data" fontSize={10} tickFormatter={(d) => d.slice(5)} />
            <YAxis fontSize={11} />
            <Tooltip formatter={(v) => brl(v)} />
            <Line type="monotone" dataKey="saldo" stroke="#1E5631" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-line rounded-sm p-4">
        <div className="text-sm font-medium mb-3">Saídas por categoria</div>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={pizza} dataKey="value" nameKey="name" outerRadius={100} label>
              {pizza.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => brl(v)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-line rounded-sm p-4 flex-1 min-w-[150px]">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-serif text-ink">{value}</div>
    </div>
  );
}
