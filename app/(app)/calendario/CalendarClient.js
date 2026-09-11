"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Btn, Field, Input, Select } from "@/components/ui";
import { isAdmin } from "@/lib/constants";
import { criarEventoAction, excluirEventoAction } from "./actions";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function CalendarClient({ me, events }) {
  const router = useRouter();
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [modalDay, setModalDay] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [visibilidade, setVisibilidade] = useState("pessoal");
  const [isPending, startTransition] = useTransition();

  const first = new Date(cursor.y, cursor.m, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells = [...Array(startOffset).fill(null), ...Array(daysInMonth).keys()].map((d) => (d === null ? null : d + 1));

  const dayISO = (d) => `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const eventsFor = (iso) => events.filter((e) => e.data === iso);
  const today = new Date().toISOString().slice(0, 10);

  const addEvent = () => {
    if (!titulo || !modalDay) return;
    startTransition(async () => {
      await criarEventoAction(dayISO(modalDay), titulo, visibilidade);
      setTitulo(""); setModalDay(null);
      router.refresh();
    });
  };
  const removeEvent = (id) => startTransition(async () => { await excluirEventoAction(id); router.refresh(); });

  return (
    <div>
      <h2 className="text-xl font-serif text-ink mb-1">Calendário de Atividades</h2>
      <p className="text-xs text-gray-500 mb-5">Sua agenda pessoal. {isAdmin(me) && "Como Pastor/Secretário, você também pode criar eventos para todos."}</p>

      <div className="bg-white border border-line rounded-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))}>←</button>
          <div className="text-sm font-medium text-ink">{MONTHS[cursor.m]} {cursor.y}</div>
          <button onClick={() => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))}>→</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] mb-1 text-gray-500">
          {WEEKDAYS.map((w, i) => <div key={i}>{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, idx) => {
            if (d === null) return <div key={idx} />;
            const iso = dayISO(d);
            const evs = eventsFor(iso);
            const isToday = iso === today;
            return (
              <button
                key={idx}
                onClick={() => setModalDay(d)}
                className="text-left p-1.5 align-top rounded-sm"
                style={{ minHeight: 56, border: `1px solid ${isToday ? "#1E5631" : "#E8EAE5"}`, background: isToday ? "#E9F2EC" : "#fff" }}
              >
                <div className="text-[11px]" style={{ color: isToday ? "#1E5631" : "#9AA39C" }}>{d}</div>
                {evs.slice(0, 2).map((e) => (
                  <div key={e.id} className="text-[10px] truncate px-1 mb-0.5 rounded-sm" style={{ background: e.visibilidade === "todos" ? "#E7E9E5" : "#F5F6F3" }}>
                    {e.titulo}
                  </div>
                ))}
              </button>
            );
          })}
        </div>
      </div>

      {modalDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="max-w-sm w-full bg-paper rounded-sm p-6">
            <h3 className="text-base font-serif text-ink mb-3">{modalDay} de {MONTHS[cursor.m]}</h3>
            {eventsFor(dayISO(modalDay)).map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm py-1.5 border-b border-paperDeep">
                <span>{e.titulo} {e.visibilidade === "todos" && <span className="text-xs text-gray-500">(todos)</span>}</span>
                {(e.criado_por === me.id || isAdmin(me)) && (
                  <button onClick={() => removeEvent(e.id)} className="text-xs text-rust">Remover</button>
                )}
              </div>
            ))}
            <div className="mt-3">
              <Field label="Novo compromisso">
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Reunião do conselho" />
              </Field>
              {isAdmin(me) && (
                <Field label="Visibilidade">
                  <Select value={visibilidade} onChange={(e) => setVisibilidade(e.target.value)}>
                    <option value="pessoal">Apenas para mim</option>
                    <option value="todos">Para todos</option>
                  </Select>
                </Field>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <Btn disabled={isPending} onClick={addEvent}>Adicionar</Btn>
              <Btn kind="ghost" onClick={() => setModalDay(null)}>Fechar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
