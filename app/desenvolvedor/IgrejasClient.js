"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Btn, Card, Field, Input, Select, Tag } from "@/components/ui";
import {
  getDocUrlsAction,
  aprovarIgrejaAction,
  reprovarIgrejaAction,
  suspenderIgrejaAction,
  reativarIgrejaAction,
  editarPrazoAction,
} from "./actions";
import { IGREJA_STATUS_LABEL, fmtDate, fmtDateTime } from "@/lib/constants";

const TABS = [
  { key: "pendente_pagamento", label: "Pendentes" },
  { key: "ativa", label: "Ativas" },
  { key: "suspensa", label: "Suspensas" },
  { key: "expirada", label: "Expiradas" },
  { key: "reprovada", label: "Reprovadas" },
];

const TAG_TONE = {
  pendente_pagamento: "gold",
  ativa: "sage",
  suspensa: "rust",
  expirada: "rust",
  reprovada: "neutral",
};

export default function IgrejasClient({ igrejasIniciais }) {
  const [tab, setTab] = useState("pendente_pagamento");
  const [expandedId, setExpandedId] = useState(null);
  const [docs, setDocs] = useState({});
  const [modalIgreja, setModalIgreja] = useState(null); // igreja sendo aprovada
  const [prazoEdit, setPrazoEdit] = useState(null); // igreja com prazo em edição
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const igrejas = igrejasIniciais.filter((i) => i.status === tab);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function toggleExpand(igreja) {
    if (expandedId === igreja.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(igreja.id);
    if (!docs[igreja.id]) {
      const urls = await getDocUrlsAction(igreja.id);
      setDocs((d) => ({ ...d, [igreja.id]: urls }));
    }
  }

  return (
    <div>
      <h2 className="text-xl font-serif text-ink mb-1">Igrejas na plataforma</h2>
      <p className="text-xs text-gray-500 mb-5">Aprove, reprove, suspenda ou ajuste o prazo de acesso de cada igreja.</p>

      <div className="flex flex-wrap gap-1 mb-4 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-3 py-2 text-sm border-b-2"
            style={{
              borderColor: tab === t.key ? "#1E5631" : "transparent",
              color: tab === t.key ? "#1E5631" : "#6b7280",
            }}
          >
            {t.label} ({igrejasIniciais.filter((i) => i.status === t.key).length})
          </button>
        ))}
      </div>

      {igrejas.length === 0 && <div className="text-sm text-gray-500">Nenhuma igreja nesta situação.</div>}

      {igrejas.map((igreja) => (
        <Card key={igreja.id} className="mb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-sm font-medium">{igreja.nome}</div>
              <div className="text-xs text-gray-500">CNPJ: {igreja.cnpj || "—"} · Pastor: {igreja.nome_pastor_responsavel || "—"}</div>
            </div>
            <div className="flex items-center gap-2">
              <Tag tone={TAG_TONE[igreja.status]}>{IGREJA_STATUS_LABEL[igreja.status]}</Tag>
              <Btn kind="subtle" onClick={() => toggleExpand(igreja)}>{expandedId === igreja.id ? "Fechar" : "Detalhes"}</Btn>
            </div>
          </div>

          {expandedId === igreja.id && (
            <div className="mt-4 pt-4 border-t border-paperDeep text-sm space-y-3">
              <div className="grid sm:grid-cols-2 gap-2 text-xs text-gray-600">
                <div><b>E-mail:</b> {igreja.email || "—"}</div>
                <div><b>Telefone:</b> {igreja.telefone || "—"}</div>
                <div><b>CPF do Pastor:</b> {igreja.cpf_pastor || "—"}</div>
                <div><b>Endereço:</b> {igreja.endereco || "—"}</div>
                <div><b>Licença:</b> {igreja.tipo_licenca || "—"}</div>
                <div><b>Expira em:</b> {igreja.data_expiracao ? fmtDate(igreja.data_expiracao) : "Indeterminado"}</div>
                <div><b>Cadastrada em:</b> {fmtDateTime(igreja.created_at)}</div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-medium mb-1">Cartão CNPJ</div>
                  <DocPreview url={docs[igreja.id]?.urlCnpj} />
                </div>
                <div>
                  <div className="text-xs font-medium mb-1">Documento do Pastor (RG/CNH)</div>
                  <DocPreview url={docs[igreja.id]?.urlResponsavel} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {igreja.status === "pendente_pagamento" && (
                  <>
                    <Btn onClick={() => setModalIgreja(igreja)}>Aprovar</Btn>
                    <Btn kind="danger" onClick={() => startTransition(async () => { await reprovarIgrejaAction(igreja.id); refresh(); })}>
                      Reprovar
                    </Btn>
                  </>
                )}
                {igreja.status === "ativa" && (
                  <>
                    <Btn kind="danger" onClick={() => startTransition(async () => { await suspenderIgrejaAction(igreja.id); refresh(); })}>
                      Suspender
                    </Btn>
                    <Btn kind="subtle" onClick={() => setPrazoEdit(igreja)}>Editar prazo</Btn>
                  </>
                )}
                {(igreja.status === "suspensa" || igreja.status === "expirada") && (
                  <Btn onClick={() => startTransition(async () => { await reativarIgrejaAction(igreja.id); refresh(); })}>
                    Reativar
                  </Btn>
                )}
              </div>
            </div>
          )}
        </Card>
      ))}

      {modalIgreja && (
        <AprovarModal
          igreja={modalIgreja}
          onClose={() => setModalIgreja(null)}
          onConfirm={async (dados) => {
            await aprovarIgrejaAction(modalIgreja.id, dados);
            setModalIgreja(null);
            refresh();
          }}
        />
      )}

      {prazoEdit && (
        <PrazoModal
          igreja={prazoEdit}
          onClose={() => setPrazoEdit(null)}
          onConfirm={async (novoPrazoDias) => {
            await editarPrazoAction(prazoEdit.id, novoPrazoDias);
            setPrazoEdit(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function DocPreview({ url }) {
  if (!url) return <div className="text-xs text-gray-400 border border-line rounded-sm p-3">Carregando…</div>;
  const isPdf = url.split("?")[0].toLowerCase().endsWith(".pdf");
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block border border-line rounded-sm overflow-hidden">
      {isPdf ? (
        <div className="p-4 text-xs text-center text-gray-500">Abrir PDF ↗</div>
      ) : (
        <img src={url} alt="documento" className="w-full h-40 object-cover" />
      )}
    </a>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-sm p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function AprovarModal({ igreja, onClose, onConfirm }) {
  const [tipo, setTipo] = useState("paga");
  const [prazo, setPrazo] = useState("indeterminado");
  const [dias, setDias] = useState("30");
  const [pending, setPending] = useState(false);

  return (
    <Modal onClose={onClose}>
      <h3 className="text-sm font-medium mb-3">Aprovar {igreja.nome}</h3>
      <Field label="Tipo de licença">
        <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="gratis">Grátis</option>
          <option value="paga">Paga</option>
        </Select>
      </Field>
      <Field label="Prazo">
        <Select value={prazo} onChange={(e) => setPrazo(e.target.value)}>
          <option value="indeterminado">Indeterminado</option>
          <option value="dias">Por dias</option>
        </Select>
      </Field>
      {prazo === "dias" && (
        <Field label="Quantos dias?" hint="Ex.: 30, 90, 365">
          <Input type="number" min="1" value={dias} onChange={(e) => setDias(e.target.value)} />
        </Field>
      )}
      <div className="flex gap-2 mt-2">
        <Btn
          className="flex-1"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            await onConfirm({ tipo, prazoDias: prazo === "dias" ? Number(dias) : null });
          }}
        >
          {pending ? "Aprovando…" : "Confirmar aprovação"}
        </Btn>
        <Btn kind="ghost" onClick={onClose}>Cancelar</Btn>
      </div>
    </Modal>
  );
}

function PrazoModal({ igreja, onClose, onConfirm }) {
  const [prazo, setPrazo] = useState(igreja.data_expiracao ? "dias" : "indeterminado");
  const [dias, setDias] = useState("30");
  const [pending, setPending] = useState(false);

  return (
    <Modal onClose={onClose}>
      <h3 className="text-sm font-medium mb-3">Editar prazo — {igreja.nome}</h3>
      <Field label="Prazo">
        <Select value={prazo} onChange={(e) => setPrazo(e.target.value)}>
          <option value="indeterminado">Indeterminado</option>
          <option value="dias">Por dias (a partir de hoje)</option>
        </Select>
      </Field>
      {prazo === "dias" && (
        <Field label="Quantos dias a partir de hoje?">
          <Input type="number" min="1" value={dias} onChange={(e) => setDias(e.target.value)} />
        </Field>
      )}
      <div className="flex gap-2 mt-2">
        <Btn
          className="flex-1"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            await onConfirm(prazo === "dias" ? Number(dias) : null);
          }}
        >
          {pending ? "Salvando…" : "Salvar"}
        </Btn>
        <Btn kind="ghost" onClick={onClose}>Cancelar</Btn>
      </div>
    </Modal>
  );
}
