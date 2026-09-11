"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Btn, Field, Input, Select, Tag } from "@/components/ui";
import { STATUS_LABEL, brl, fmtDate, fmtDateTime, isAdmin, isCouncilSecretary, isTreasurer } from "@/lib/constants";
import {
  confirmarSecretarioAction,
  validarTesoureiroAction,
  reportarErroAction,
  corrigirEReenviarAction,
  excluirRegistroAction,
} from "../actions";

const TAG_TONE = { lancado: "neutral", confirmado_secretario: "gold", validado: "sage", erro_reportado: "rust" };

export default function RecordDetailClient({ me, church, record, aprovacoes, errorReport }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erroTxt, setErroTxt] = useState("");
  const [corrigindo, setCorrigindo] = useState(false);
  const [itens, setItens] = useState(record.record_items);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [msg, setMsg] = useState("");

  const souDiaconoResponsavel = record.diacono_id === me.id;
  const souSecretario = isCouncilSecretary(me) || me.oficio === "pastor";
  const souTesoureiro = isTreasurer(me, church) || me.oficio === "pastor";

  const dz = itens.filter((i) => i.tipo === "dizimo").reduce((s, i) => s + Number(i.valor), 0);
  const of = itens.filter((i) => i.tipo === "oferta").reduce((s, i) => s + Number(i.valor), 0);

  const podeExcluir = (souDiaconoResponsavel && record.status === "lancado") || me.oficio === "pastor";

  const run = (fn) => startTransition(async () => {
    try {
      await fn();
      router.refresh();
    } catch (e) {
      // Não capture os sinais internos do Next.js (redirect/notFound) —
      // eles precisam propagar para a navegação realmente acontecer.
      if (e?.digest?.startsWith?.("NEXT_REDIRECT") || e?.digest?.startsWith?.("NEXT_NOT_FOUND")) throw e;
      setMsg(e.message || "Não foi possível concluir a ação.");
    }
  });

  const updateItem = (idx, field, value) => setItens(itens.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  const addItem = () => setItens([...itens, { tipo: "dizimo", nome: "", valor: 0 }]);
  const removeItem = (idx) => setItens(itens.filter((_, i) => i !== idx));

  const enviarCorrecao = () => run(() =>
    corrigirEReenviarAction(
      record.id,
      itens.filter((i) => i.nome && Number(i.valor) > 0).map((i) => ({ tipo: i.tipo, nome: i.nome, valor: Number(i.valor) }))
    )
  );

  return (
    <div>
      <h2 className="text-xl font-serif text-ink mb-1">Culto de {fmtDate(record.data_culto)}</h2>
      <div className="flex items-center gap-2 mb-5">
        <Tag tone={TAG_TONE[record.status]}>{STATUS_LABEL[record.status]}</Tag>
        <span className="text-xs text-gray-500">Lançado por {record.diacono?.nome}</span>
      </div>

      {record.status === "erro_reportado" && errorReport && (
        <div className="text-sm p-3 mb-4 bg-[#F2E1DD] text-rust rounded-sm">{errorReport.descricao}</div>
      )}

      <div className="bg-white border border-line rounded-sm p-4 mb-4">
        {!corrigindo ? (
          <table className="w-full text-sm mb-2">
            <tbody>
              {itens.map((i) => (
                <tr key={i.id || i.nome} className="border-b border-paperDeep">
                  <td className="py-1.5"><Tag tone={i.tipo === "dizimo" ? "sage" : "gold"}>{i.tipo === "dizimo" ? "Dízimo" : "Oferta"}</Tag></td>
                  <td className="py-1.5">{i.nome}</td>
                  <td className="py-1.5 text-right">{brl(i.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="mb-3">
            {itens.map((it, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center flex-wrap">
                <Select value={it.tipo} onChange={(e) => updateItem(idx, "tipo", e.target.value)} className="w-28">
                  <option value="dizimo">Dízimo</option>
                  <option value="oferta">Oferta</option>
                </Select>
                <Input value={it.nome} onChange={(e) => updateItem(idx, "nome", e.target.value)} className="flex-1 min-w-[140px]" />
                <Input type="number" step="0.01" value={it.valor} onChange={(e) => updateItem(idx, "valor", e.target.value)} className="w-28" />
                <button onClick={() => removeItem(idx)} className="text-xs text-rust">Remover</button>
              </div>
            ))}
            <Btn kind="subtle" onClick={addItem}>+ Adicionar lançamento</Btn>
          </div>
        )}

        <div className="flex gap-4 text-sm mb-3 text-gray-700">
          <span>Dízimos: <b>{brl(dz)}</b></span>
          <span>Ofertas: <b>{brl(of)}</b></span>
          <span>Total: <b>{brl(dz + of)}</b></span>
        </div>

        {msg && <div className="text-xs text-rust mb-3">{msg}</div>}

        {/* Ações por status/papel */}
        {record.status === "lancado" && souSecretario && (
          <Btn kind="gold" disabled={isPending} onClick={() => run(() => confirmarSecretarioAction(record.id))}>
            Confirmar registro
          </Btn>
        )}
        {record.status === "lancado" && !souSecretario && (
          <span className="text-xs text-gray-500">Aguardando confirmação do Secretário do Conselho.</span>
        )}

        {record.status === "confirmado_secretario" && souTesoureiro && (
          <div className="space-y-2">
            <Btn kind="gold" disabled={isPending} onClick={() => run(() => validarTesoureiroAction(record.id))}>
              Validar registro
            </Btn>
            <div className="flex gap-2 items-center">
              <Input placeholder="Descrever erro encontrado…" value={erroTxt} onChange={(e) => setErroTxt(e.target.value)} />
              <Btn kind="danger" disabled={isPending || !erroTxt} onClick={() => run(() => reportarErroAction(record.id, erroTxt))}>
                Reportar erro
              </Btn>
            </div>
          </div>
        )}
        {record.status === "confirmado_secretario" && !souTesoureiro && (
          <span className="text-xs text-gray-500">Aguardando conferência do Tesoureiro da Igreja.</span>
        )}

        {record.status === "erro_reportado" && (souDiaconoResponsavel || isAdmin(me)) && (
          <div className="space-y-2">
            {!corrigindo ? (
              <Btn kind="ghost" onClick={() => setCorrigindo(true)}>Corrigir lançamentos</Btn>
            ) : (
              <Btn kind="gold" disabled={isPending} onClick={enviarCorrecao}>Reenviar para confirmação</Btn>
            )}
          </div>
        )}
        {record.status === "erro_reportado" && !souDiaconoResponsavel && !isAdmin(me) && (
          <span className="text-xs text-gray-500">Aguardando correção pelo diácono responsável.</span>
        )}

        {record.status === "validado" && (
          <span className="text-xs text-sage">Registro validado — bloqueado para edição.</span>
        )}

        {podeExcluir && (
          <div className="mt-4 pt-3 border-t border-paperDeep">
            {!confirmandoExclusao ? (
              <button onClick={() => setConfirmandoExclusao(true)} className="text-xs text-rust underline">
                Excluir registro
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rust">Excluir definitivamente este registro?</span>
                <Btn kind="danger" disabled={isPending} onClick={() => run(() => excluirRegistroAction(record.id))}>Excluir</Btn>
                <Btn kind="ghost" onClick={() => setConfirmandoExclusao(false)}>Cancelar</Btn>
              </div>
            )}
          </div>
        )}
      </div>

      {aprovacoes.length > 0 && (
        <details className="text-xs">
          <summary className="text-gray-500 cursor-pointer">Histórico de aprovações</summary>
          <div className="mt-2 space-y-1">
            {aprovacoes.map((a) => (
              <div key={a.id} className="text-gray-600">{a.nome} ({a.cargo}) — {a.acao} em {fmtDateTime(a.created_at)}</div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
