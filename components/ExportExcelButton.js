"use client";

import { useState } from "react";
import { Btn } from "./ui";

// Botão verde "Exportar Excel" — busca exatamente os mesmos dados filtrados
// que o relatório em PDF (mesma rota, com ?formato=json) e gera o .xlsx no
// navegador com a lib `xlsx`.
export default function ExportExcelButton({ href, nomeArquivo = "relatorio", label = "Exportar Excel" }) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function exportar() {
    setErro("");
    setCarregando(true);
    try {
      const url = href.includes("?") ? `${href}&formato=json` : `${href}?formato=json`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Falha ao buscar os dados do relatório.");
      const { rows } = await resp.json();
      if (!rows || rows.length === 0) {
        setErro("Nada para exportar com esse filtro.");
        setCarregando(false);
        return;
      }
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
      XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
    } catch (e) {
      setErro(e.message || "Não foi possível exportar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="inline-flex flex-col">
      <Btn
        type="button"
        kind="subtle"
        onClick={exportar}
        disabled={carregando}
        className="!bg-[#1E5631] !text-white hover:opacity-90"
      >
        {carregando ? "Exportando…" : `📥 ${label}`}
      </Btn>
      {erro && <span className="text-xs text-rust mt-1">{erro}</span>}
    </div>
  );
}
