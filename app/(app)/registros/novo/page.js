"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { criarRegistroAction } from "../actions";
import { Btn, Field, Input, Select } from "@/components/ui";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Btn type="submit" disabled={pending}>{pending ? "Enviando…" : "Lançar registro"}</Btn>;
}

export default function NovoRegistroPage() {
  const [state, formAction] = useFormState(criarRegistroAction, {});
  const [itens, setItens] = useState([{ tipo: "dizimo", nome: "", valor: "" }]);

  const addItem = () => setItens([...itens, { tipo: "dizimo", nome: "", valor: "" }]);
  const removeItem = (idx) => setItens(itens.filter((_, i) => i !== idx));
  const updateItem = (idx, field, value) => {
    setItens(itens.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };

  return (
    <div>
      <h2 className="text-xl font-serif text-ink mb-1">Lançar registro de culto</h2>
      <p className="text-xs text-gray-500 mb-5">Depois de enviado, o registro vai para a confirmação do 2º Diácono.</p>

      <form action={formAction} className="bg-white border border-line rounded-sm p-4">
        <Field label="Data do culto">
          <Input name="dataCulto" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </Field>

        <div className="text-xs text-gray-500 mb-2">Lançamentos</div>
        {itens.map((it, idx) => (
          <div key={idx} className="flex gap-2 mb-2 items-center flex-wrap">
            <Select
              name="item_tipo"
              value={it.tipo}
              onChange={(e) => updateItem(idx, "tipo", e.target.value)}
              className="w-28"
            >
              <option value="dizimo">Dízimo</option>
              <option value="oferta">Oferta</option>
            </Select>
            <Input
              name="item_nome"
              placeholder="Nome"
              value={it.nome}
              onChange={(e) => updateItem(idx, "nome", e.target.value)}
              className="flex-1 min-w-[140px]"
            />
            <Input
              name="item_valor"
              type="number"
              step="0.01"
              placeholder="Valor"
              value={it.valor}
              onChange={(e) => updateItem(idx, "valor", e.target.value)}
              className="w-28"
            />
            {itens.length > 1 && (
              <button type="button" onClick={() => removeItem(idx)} className="text-xs text-rust">Remover</button>
            )}
          </div>
        ))}

        <Btn type="button" kind="subtle" onClick={addItem} className="mb-4">+ Adicionar lançamento</Btn>

        {state?.error && <p className="text-xs text-rust mb-3">{state.error}</p>}

        <div>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
