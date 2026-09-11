"use client";

import { useRef, useState } from "react";
import { Btn } from "./ui";

const MAX_MB = 8;

export default function DocPicker({ value, onChange, label = "Escolher arquivo" }) {
  const ref = useRef();
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [erro, setErro] = useState("");

  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setErro("");
          if (f.size > MAX_MB * 1024 * 1024) {
            setErro(`Arquivo muito grande (máx. ${MAX_MB}MB).`);
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            onChange(reader.result);
            setNomeArquivo(f.name);
          };
          reader.onerror = () => setErro("Não foi possível ler esse arquivo.");
          reader.readAsDataURL(f);
        }}
      />
      <div className="flex items-center gap-2">
        <Btn type="button" kind="subtle" onClick={() => ref.current?.click()}>{label}</Btn>
        {value && <span className="text-xs text-sage">{nomeArquivo || "Arquivo selecionado"} ✓</span>}
      </div>
      {erro && <span className="text-xs text-rust block mt-1">{erro}</span>}
    </div>
  );
}
