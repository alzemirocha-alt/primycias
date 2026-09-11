"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Btn, Field, Input } from "@/components/ui";
import { brl, fmtDate, today } from "@/lib/constants";
import { definirSaldoInicialAction, solicitarLiberacaoSaldoAction } from "../actions";

export default function FluxoClient({ me, financas, ledger }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [valor, setValor] = useState("");
  const [data, setData] = useState(today());
  const [msg, setMsg] = useState("");

  const podeEditarLivre = me.oficio === "pastor" || me.funcao_presbitero === "secretario_conselho";
  const precisaConfigurar = !financas || financas.saldo_inicial_valor === null;
  const bloqueado = financas?.bloqueado && !podeEditarLivre;

  const salvar = () => {
    startTransition(async () => {
      try {
        await definirSaldoInicialAction(valor, data);
        router.refresh();
      } catch (e) { setMsg(e.message); }
    });
  };

  const solicitar = () => {
    startTransition(async () => {
      await solicitarLiberacaoSaldoAction();
      setMsg("Solicitação enviada ao Pastor/Secretário.");
    });
  };

  return (
    <div>
      {(precisaConfigurar || !bloqueado) && (
        <div className="bg-white border border-line rounded-sm p-4 mb-4">
          <div className="text-sm font-medium mb-2">Saldo inicial</div>
          {precisaConfigurar ? (
            <>
              <p className="text-xs text-gray-500 mb-3">
                Lance o saldo inicial uma vez — a partir daqui o sistema calcula os saldos momentâneos.
                Depois de confirmado, só muda com liberação do Pastor/Secretário.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mb-2">
                <Field label="Valor"><Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} /></Field>
                <Field label="Data"><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></Field>
              </div>
              <Btn disabled={isPending || !valor} onClick={salvar}>Confirmar saldo inicial</Btn>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-3">Liberado para edição. Atual: {brl(financas.saldo_inicial_valor)} em {fmtDate(financas.saldo_inicial_data)}.</p>
              <div className="grid sm:grid-cols-2 gap-3 mb-2">
                <Field label="Novo valor"><Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} /></Field>
                <Field label="Nova data"><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></Field>
              </div>
              <Btn disabled={isPending || !valor} onClick={salvar}>Salvar novo saldo inicial</Btn>
            </>
          )}
          {msg && <div className="text-xs text-sage mt-2">{msg}</div>}
        </div>
      )}

      {bloqueado && (
        <div className="bg-white border border-line rounded-sm p-4 mb-4 text-sm">
          Saldo inicial: <b>{brl(financas.saldo_inicial_valor)}</b> em {fmtDate(financas.saldo_inicial_data)} — confirmado e bloqueado.
          <div className="mt-2">
            <Btn kind="subtle" disabled={isPending} onClick={solicitar}>Solicitar liberação para alterar</Btn>
          </div>
          {msg && <div className="text-xs text-sage mt-2">{msg}</div>}
        </div>
      )}

      <div className="bg-white border border-line rounded-sm p-4 overflow-x-auto">
        <div className="text-sm font-medium mb-3">Extrato</div>
        <table className="w-full text-xs" style={{ minWidth: 480 }}>
          <thead>
            <tr className="text-gray-500 text-left border-b border-paperDeep">
              <th className="py-1.5 pr-2">Data</th>
              <th className="py-1.5 pr-2">Histórico</th>
              <th className="py-1.5 pr-2 text-right">Entrada</th>
              <th className="py-1.5 pr-2 text-right">Saída</th>
              <th className="py-1.5 pr-2 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((r, idx) => (
              <tr key={idx} className="border-b border-paperDeep">
                <td className="py-1.5 pr-2">{fmtDate(r.data)}</td>
                <td className="py-1.5 pr-2">{r.historico}</td>
                <td className="py-1.5 pr-2 text-right text-sage">{r.tipo === "entrada" ? brl(r.valor) : ""}</td>
                <td className="py-1.5 pr-2 text-right text-rust">{r.tipo === "saida" ? brl(r.valor) : ""}</td>
                <td className="py-1.5 pr-2 text-right font-medium">{brl(r.saldo)}</td>
              </tr>
            ))}
            {ledger.length === 0 && (
              <tr><td colSpan={5} className="py-3 text-gray-500">Nenhuma movimentação ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
