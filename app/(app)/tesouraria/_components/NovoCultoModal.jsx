"use client";
import { useState } from "react";

export default function NovoCultoModal({ igrejaId, onCreated }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(new Date().toISOString().slice(0,10));
  const [periodo, setPeriodo] = useState("noite");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function criarCulto() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/cultos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ igreja_id: igrejaId, data, periodo })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao criar culto");
      
      setMsg("✅ Culto aberto!");
      onCreated?.(json.culto);
      setTimeout(() => {
        setOpen(false);
        setMsg("");
      }, 800);
    } catch (e) {
      setMsg("❌ " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
      >
        + Abrir Culto
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-4">Abrir Novo Culto</h3>
            
            <label className="block text-sm font-medium mb-1">Data</label>
            <input
              type="date"
              value={data}
              onChange={e => setData(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
            />

            <label className="block text-sm font-medium mb-1">Período</label>
            <select
              value={periodo}
              onChange={e => setPeriodo(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
            >
              <option value="manha">Manhã - EBD</option>
              <option value="tarde">Tarde</option>
              <option value="noite">Noite</option>
            </select>

            {msg && <p className="text-sm mb-3">{msg}</p>}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={criarCulto}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {loading ? "Abrindo..." : "Abrir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
