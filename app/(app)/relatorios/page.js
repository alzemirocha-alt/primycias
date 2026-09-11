"use client";

import { useState } from "react";
import { Btn, Field, Input } from "@/components/ui";
import ExportExcelButton from "@/components/ExportExcelButton";

export default function RelatoriosPage() {
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const href = `/api/reports/dizimos?${new URLSearchParams({ de, ate }).toString()}`;

  return (
    <div>
      <h2 className="text-xl font-serif text-ink mb-1">Relatórios</h2>
      <p className="text-xs text-gray-500 mb-5">Relatório de dízimos e ofertas por período, em PDF ou Excel.</p>

      <div className="bg-white border border-line rounded-sm p-4">
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <Field label="De"><Input type="date" value={de} onChange={(e) => setDe(e.target.value)} /></Field>
          <Field label="Até"><Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} /></Field>
        </div>
        <div className="flex flex-wrap gap-2 items-start">
          <a href={href} target="_blank" rel="noreferrer">
            <Btn>Baixar relatório em PDF</Btn>
          </a>
          <ExportExcelButton href={href} nomeArquivo="dizimos-ofertas" />
        </div>
      </div>
    </div>
  );
}
