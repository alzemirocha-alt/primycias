"use client";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { criarRegistroAction } from "../actions";
import { Btn, Field, Input, Select } from "@/components/ui";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Btn type="submit" disabled={pending}>{pending? "Enviando..." : "Lançar registro"}</Btn>;
}

export default function NovoRegistroPage() {
  const [state, formAction] = useFormState(criarRegistroAction, null);
  const [itens, setItens] = useState([{ tipo: "dizimo", nome: "", valor: "" }]);
  const [diaconos, setDiaconos] = useState([]);
  const [ultimoCultoIds, setUltimoCultoIds] = useState([]);

  useEffect(() => {
    async function carregarDiaconos() {
      // Pega a igreja do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      const { data: perfil } = await supabase.from("profiles").select("igreja_id").eq("id", user.id).single();

      // 1. Todos os diáconos da igreja que NÃO são tesoureiro
      const { data: todos } = await supabase.from("profiles").select("id, nome_completo").eq("igreja_id", perfil.igreja_id).eq("oficio", "diacono").eq("is_tesoureiro", false);

      // 2. Quem participou do último culto para o rodízio
      const { data: ultimoRegistro } = await supabase.from("records").select("diacono_id, segundo_diacono_id").eq("igreja_id", perfil.igreja_id).order("data_culto", { ascending: false }).limit(1).single();

      const idsUltimo = ultimoRegistro? [ultimoRegistro.diacono_id, ultimoRegistro.segundo_diacono_id].filter(Boolean) : [];
      setUltimoCultoIds(idsUltimo);

      // 3. Filtra - tira quem foi no último culto
      const elegiveis = (todos || []).filter(d =>!idsUltimo.includes(d.id) && d.id!== user.id);
      setDiaconos(elegiveis);
    }
    carregarDiaconos();
  }, []);

  const addItem = () => setItens([...itens, { tipo: "dizimo", nome: "", valor: "" }]);
  const removeItem = (idx) => setItens(itens.filter((_, i) => i!== idx));
  const updateItem = (idx, field, value) => {
    setItens(itens.map((it, i) => (i === idx? {...it, [field]: value } : it)));
  };

  return (
    <div>
      <h2 className="text-xl font-serif text-ink mb-3">Lançar registro de culto</h2>
      <p className="text-xs text-gray-500 mb-3">Depois de enviado, o registro vai para a confirmação do 2º Diácono.</p>
      <form action={formAction} className="bg-white border border-line rounded-sm p-4">

        <Field label="2º Diácono (Rodízio)">
          <Select name="segundo_diacono_id" required>
            <option value="">Selecione o 2º Diácono</option>
            {diaconos.map(d => (
              <option key={d.id} value={d.id}>{d.nome_completo}</option>
            ))}
          </Select>
          <p className="text-[11px] text-gray-500 mt-1">Lista já sem tesoureiros e sem quem foi no último culto. Rodízio automático.</p>
        </Field>

        {itens.map((it, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-2 mb-2">
            <Input value={it.nome} onChange={e => updateItem(idx, "nome", e.target.value)} placeholder="Nome" />
            <Input value={it.valor} onChange={e => updateItem(idx, "valor", e.target.value)} placeholder="Valor" type="number" />
            <Btn type="button" onClick={() => removeItem(idx)}>Remover</Btn>
          </div>
        ))}
        <Btn type="button" onClick={addItem}>+ Item</Btn>
        <input type="hidden" name="itens" value={JSON.stringify(itens)} />
        <div className="mt-4">
          <SubmitButton />
        </div>
        {state?.error && <p className="text-red-600 text-sm mt-2">{state.error}</p>}
      </form>
    </div>
  );
}
