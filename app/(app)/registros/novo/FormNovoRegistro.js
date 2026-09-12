"use client";
import { useState } from "react";

export default function FormNovoRegistro({ diaconos, igrejaId, action }) {
  const [linhas, setLinhas] = useState([
    { id: 1, tipo: "dizimo", nome: "", valor: "" }
  ]);

  function addLinha() {
    setLinhas([...linhas, { id: Date.now(), tipo: "dizimo", nome: "", valor: "" }]);
  }
  function removeLinha(id) {
    if (linhas.length === 1) return;
    setLinhas(linhas.filter((l) => l.id!== id));
  }
  function updateLinha(id, campo, valor) {
    setLinhas(linhas.map((l) => l.id === id? {...l, [campo]: valor } : l));
  }

  const totalDizimo = linhas.filter(l => l.tipo === 'dizimo').reduce((s, l) => s + (parseFloat(l.valor) || 0), 0);
  const totalOferta = linhas.filter(l => l.tipo === 'oferta').reduce((s, l) => s + (parseFloat(l.valor) || 0), 0);
  const totalGeral = totalDizimo + totalOferta;

  return (
    <form action={action} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <input type="hidden" name="igreja_id" value={igrejaId} />
      <input type="hidden" name="linhas_json" value={JSON.stringify(linhas)} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Data do culto</label>
          <input type="date" name="data_culto" required className="w-full border p-2.5 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">2º Diácono que vai confirmar</label>
          <select name="segundo_diacono_id" required className="w-full border p-2.5 rounded bg-white">
            <option value="">Selecione o diácono...</option>
            {diaconos.map((d) => (
              <option key={d.id} value={d.id}>{d.nome}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-bold">Dizimistas / Ofertantes</label>
        {linhas.map((linha) => (
          <div key={linha.id} className="grid grid-cols-12 gap-2 items-end border p-3 rounded bg-gray-50">
            <div className="col-span-3">
              <label className="text-xs text-gray-600">Tipo</label>
              <select value={linha.tipo} onChange={(e) => updateLinha(linha.id, "tipo", e.target.value)} className="w-full border p-2 rounded bg-white text-sm font-medium">
                <option value="dizimo">Dízimo</option>
                <option value="oferta">Oferta</option>
              </select>
            </div>
            <div className="col-span-6">
              <label className="text-xs text-gray-600">Nome</label>
              <input value={linha.nome} onChange={(e) => updateLinha(linha.id, "nome", e.target.value)} placeholder="Nome do dizimista/ofertante" required className="w-full border p-2 rounded text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-600">Valor R$</label>
              <input type="number" step="0.01" min="0" value={linha.valor} onChange={(e) => updateLinha(linha.id, "valor", e.target.value)} placeholder="0,00" required className="w-full border p-2 rounded text-sm" />
            </div>
            <div className="col-span-1">
              <button type="button" onClick={() => removeLinha(linha.id)} className="w-full p-2 text-red-500 hover:text-red-700 text-sm font-bold">X</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={addLinha} className="w-full border border-dashed border-gray-400 p-2.5 rounded text-sm hover:bg-gray-50 font-medium">+ Adicionar outro</button>
      </div>

      {/* SUBTOTAIS QUE VOCÊ PEDIU */}
      <div className="bg-gray-100 p-4 rounded-lg space-y-2 border">
        <div className="flex justify-between text-sm">
          <span>Subtotal Dízimos ({linhas.filter(l=>l.tipo==='dizimo').length}):</span>
          <span className="font-medium">R$ {totalDizimo.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Subtotal Ofertas ({linhas.filter(l=>l.tipo==='oferta').length}):</span>
          <span className="font-medium">R$ {totalOferta.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
          <span>Total do dia:</span>
          <span>R$ {totalGeral.toFixed(2)}</span>
        </div>
      </div>

      <button type="submit" className="w-full bg-black text-white p-3.5 rounded-lg font-bold hover:bg-gray-800">
        Lançar {linhas.length} registro(s) - R$ {totalGeral.toFixed(2)}
      </button>
    </form>
  );
}
