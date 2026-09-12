"use client";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { criarRegistroAction } from "../actions";
import { Btn, Field, Input, Select } from "@/components/ui";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return <Btn type="submit" disabled={pending}>{pending? "Abrindo registro..." : "Abrir registro com 2º Diácono"}</Btn>;
}

export default function NovoRegistroForm({ diaconos, isPastor }) {
  const [state, formAction] = useFormState(criarRegistroAction, null);
  const [itens, setItens] = useState([{ nome: "", valor: "" }]);

  return (
    <div>
      <h2 className="text-xl font-serif mb-2">Abrir registro do culto</h2>
      <p className="text-xs text-gray-500 mb-4">
        {isPastor? "Pastor: você pode escolher qualquer diácono." : "Você PRECISA escolher o 2º Diácono para abrir o registro. Lista sem tesoureiro e sem quem foi no último culto."}
      </p>

      <form action={formAction} className="bg-white border rounded p-4 space-y-4">
        <Field label="2º Diácono * (Obrigatório)">
          <Select name="segundo_diacono_id" required>
            <option value="">-- Selecione o 2º Diácono --</option>
            {diaconos.map(d => (
              <option key={d.id} value={d.id}>{d.nome_completo}</option>
            ))}
          </Select>
          {diaconos.length === 0 && <p className="text-red-600 text-xs mt-1">Nenhum diácono disponível para rodízio. Peça ao Pastor para quebrar o rodízio.</p>}
        </Field>

        <Field label="Data do culto">
          <Input type="date" name="data_culto" required />
        </Field>

        <div>
          <p className="text-sm font-bold mb-2">Dízimos/Ofertas</p>
          {itens.map((it, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-2 mb-2">
              <Input placeholder="Nome / Tipo" value={it.nome} onChange={e => {
                const novo = [...itens]; novo[idx].nome = e.target.value; setItens(novo);
              }} />
              <Input placeholder="Valor" type="number" step="0.01" value={it.valor} onChange={e => {
                const novo = [...itens]; novo[idx].valor = e.target.value; setItens(novo);
              }} />
            </div>
          ))}
          <Btn type="button" onClick={() => setItens([...itens, { nome: "", valor: "" }])}>+ Adicionar</Btn>
          <input type="hidden" name="itens" value={JSON.stringify(itens)} />
        </div>

        <SubmitBtn />
        {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
      </form>
    </div>
  );
}
