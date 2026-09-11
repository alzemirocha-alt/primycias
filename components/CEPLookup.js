"use client";

import { useState } from "react";
import { Btn, Field, Input } from "./ui";

function onlyDigits(s) { return (s || "").replace(/\D/g, "").slice(0, 8); }
function formatCEP(s) { return onlyDigits(s).replace(/(\d{5})(\d)/, "$1-$2"); }

export default function CEPLookup({ onApply }) {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sugestao, setSugestao] = useState(null);
  const [sel, setSel] = useState({ rua: true, bairro: true, cidade: true, estado: true });

  const buscar = async () => {
    const clean = onlyDigits(cep);
    if (clean.length !== 8) { setErro("Informe um CEP com 8 dígitos."); return; }
    setLoading(true); setErro(""); setSugestao(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (data.erro) { setErro("CEP não encontrado."); return; }
      setSugestao({ rua: data.logradouro || "", bairro: data.bairro || "", cidade: data.localidade || "", estado: data.uf || "" });
      setSel({ rua: true, bairro: true, cidade: true, estado: true });
    } catch {
      setErro("Não foi possível buscar o CEP agora.");
    } finally {
      setLoading(false);
    }
  };

  const aplicar = () => {
    if (!sugestao) return;
    const linha1 = [sel.rua && sugestao.rua, sel.bairro && sugestao.bairro].filter(Boolean).join(", ");
    const linha2 = [sel.cidade && sugestao.cidade, sel.estado && sugestao.estado].filter(Boolean).join("/");
    const final = [linha1, linha2].filter(Boolean).join(" - ");
    onApply(final, formatCEP(cep));
    setSugestao(null); setCep("");
  };

  return (
    <div className="p-3 mb-3 bg-paperDeep rounded-sm">
      <div className="flex gap-2 items-end flex-wrap">
        <Field label="Buscar endereço pelo CEP">
          <Input value={cep} onChange={(e) => setCep(formatCEP(e.target.value))} placeholder="00000-000" className="w-32" />
        </Field>
        <Btn type="button" kind="subtle" onClick={buscar} disabled={loading}>{loading ? "Buscando…" : "Buscar"}</Btn>
      </div>
      {erro && <div className="text-xs text-rust mt-2">{erro}</div>}
      {sugestao && (
        <div className="mt-2">
          <div className="text-xs text-gray-600 mb-1.5">Marque o que deseja usar:</div>
          <div className="space-y-1 mb-2">
            {[["rua", "Rua/logradouro"], ["bairro", "Bairro"], ["cidade", "Cidade"], ["estado", "Estado"]].map(([k, label]) =>
              sugestao[k] ? (
                <label key={k} className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={sel[k]} onChange={(e) => setSel({ ...sel, [k]: e.target.checked })} />
                  {label}: <b>{sugestao[k]}</b>
                </label>
              ) : null
            )}
          </div>
          <Btn type="button" kind="gold" onClick={aplicar}>Usar endereço selecionado</Btn>
        </div>
      )}
    </div>
  );
}
