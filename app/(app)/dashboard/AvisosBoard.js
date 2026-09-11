"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Btn, Field, Input, Select } from "@/components/ui";
import PhotoPicker from "@/components/PhotoPicker";
import { isAdmin, fmtDateTime } from "@/lib/constants";
import { criarAvisoAction, excluirAvisoAction } from "./avisos-actions";

const TIPOS = { texto: "Texto", imagem: "Imagem", link: "Link", video: "Vídeo (link)" };

export default function AvisosBoard({ me, avisos }) {
  const router = useRouter();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [tipo, setTipo] = useState("texto");
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [erro, setErro] = useState("");
  const [isPending, startTransition] = useTransition();

  const publicar = () => {
    setErro("");
    if (!conteudo) { setErro("Preencha o conteúdo do aviso."); return; }
    startTransition(async () => {
      try {
        await criarAvisoAction({ tipo, titulo, conteudo });
        setTitulo(""); setConteudo(""); setMostrarForm(false);
        router.refresh();
      } catch (e) { setErro(e.message); }
    });
  };

  const remover = (id) => startTransition(async () => { await excluirAvisoAction(id); router.refresh(); });

  return (
    <div className="bg-white border border-line rounded-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-ink">Avisos</div>
        {isAdmin(me) && (
          <button className="text-xs underline text-gray-600" onClick={() => setMostrarForm(!mostrarForm)}>
            {mostrarForm ? "Cancelar" : "+ Novo aviso"}
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="p-3 mb-3 bg-paperDeep rounded-sm">
          <div className="grid sm:grid-cols-2 gap-3 mb-2">
            <Field label="Tipo">
              <Select value={tipo} onChange={(e) => { setTipo(e.target.value); setConteudo(""); }}>
                {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
            <Field label="Título (opcional)">
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </Field>
          </div>
          {tipo === "texto" && (
            <Field label="Texto">
              <textarea className="w-full px-3 py-2 border border-line rounded-sm text-sm" rows={3} value={conteudo} onChange={(e) => setConteudo(e.target.value)} />
            </Field>
          )}
          {tipo === "imagem" && (
            <Field label="Imagem">
              <PhotoPicker value={conteudo} onChange={setConteudo} round={false} />
            </Field>
          )}
          {(tipo === "link" || tipo === "video") && (
            <Field label="URL">
              <Input value={conteudo} onChange={(e) => setConteudo(e.target.value)} placeholder="https://…" />
            </Field>
          )}
          {erro && <div className="text-xs text-rust mb-2">{erro}</div>}
          <Btn disabled={isPending} onClick={publicar}>Publicar</Btn>
        </div>
      )}

      {avisos.length === 0 && <div className="text-sm text-gray-500">Nenhum aviso no momento.</div>}
      <div className="space-y-3">
        {avisos.map((a) => (
          <div key={a.id} className="border-b border-paperDeep pb-3">
            {a.titulo && <div className="text-sm font-medium mb-1">{a.titulo}</div>}
            {a.tipo === "texto" && <p className="text-sm whitespace-pre-wrap">{a.conteudo}</p>}
            {a.tipo === "imagem" && <img src={a.conteudo} alt={a.titulo || ""} className="max-w-full rounded-sm" />}
            {a.tipo === "link" && <a href={a.conteudo} target="_blank" rel="noreferrer" className="text-sm text-ink underline break-all">{a.conteudo}</a>}
            {a.tipo === "video" && <a href={a.conteudo} target="_blank" rel="noreferrer" className="text-sm text-ink underline break-all">▶ {a.conteudo}</a>}
            <div className="text-xs text-gray-500 mt-1">
              {a.criado_por_nome} · {fmtDateTime(a.created_at)}
              {isAdmin(me) && <button onClick={() => remover(a.id)} className="text-rust ml-2 underline">Remover</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
