"use client";

import { useState, useTransition } from "react";
import { Btn, Field, Input } from "@/components/ui";
import PhotoPicker from "@/components/PhotoPicker";
import CEPLookup from "@/components/CEPLookup";
import { atualizarIgrejaAction } from "./actions";

export default function IgrejaClient({ church }) {
  const [f, setF] = useState({ ...church });
  const [salvo, setSalvo] = useState(false);
  const [isPending, startTransition] = useTransition();

  const salvar = () => {
    startTransition(async () => {
      await atualizarIgrejaAction(f);
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    });
  };

  return (
    <div>
      <h2 className="text-xl font-serif text-ink mb-1">Dados da Igreja</h2>
      <p className="text-xs text-gray-500 mb-5">Edição exclusiva do Pastor e do Secretário do Conselho.</p>

      <div className="bg-white border border-line rounded-sm p-6">
        <Field label="Foto / logotipo">
          <PhotoPicker value={f.logo} onChange={(v) => setF({ ...f, logo: v })} round={false} />
        </Field>
        <Field label="Nome da igreja">
          <Input value={f.nome || ""} onChange={(e) => setF({ ...f, nome: e.target.value })} />
        </Field>
        <Field label="CNPJ">
          <Input value={f.cnpj || ""} onChange={(e) => setF({ ...f, cnpj: e.target.value })} />
        </Field>
        <Field label="Endereço">
          <CEPLookup onApply={(end, cep) => setF({ ...f, endereco: end, cep })} />
          <Input value={f.endereco || ""} onChange={(e) => setF({ ...f, endereco: e.target.value })} placeholder="Complete com número e complemento" />
        </Field>
        <Field label="CEP">
          <Input value={f.cep || ""} onChange={(e) => setF({ ...f, cep: e.target.value })} />
        </Field>
        <Field label="Contato (telefone/e-mail)">
          <Input value={f.contato || ""} onChange={(e) => setF({ ...f, contato: e.target.value })} />
        </Field>
        <div className="flex items-center gap-3">
          <Btn disabled={isPending} onClick={salvar}>Salvar alterações</Btn>
          {salvo && <span className="text-xs text-sage">Dados da igreja atualizados.</span>}
        </div>
      </div>
    </div>
  );
}
