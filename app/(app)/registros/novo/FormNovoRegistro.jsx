"use client";
import { useState } from "react";
import { criarRegistroCultoAction } from "../actions";

export default function FormNovoRegistro({ diaconos }){
  const [linhas, setLinhas] = useState([{ nome: "", valor: "", tipo: "dizimo" }]);

  const addLinha = () => setLinhas([...linhas, { nome: "", valor: "", tipo: "dizimo" }]);
  const update = (i, campo, val) => {
    const n = [...linhas]; n[i][campo] = val; setLinhas(n);
  };
  const remove = (i) => setLinhas(linhas.filter((_,idx)=> idx!==i));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Lançar Registro do Culto</h1>
      <form action={criarRegistroCultoAction} className="bg-white p-4 rounded shadow space-y-4">
        <input type="hidden" name="linhas_json" value={JSON.stringify(linhas)} />

        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-sm">Data do Culto</label><input type="date" name="data_culto" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full border p-2 rounded" /></div>
          <div><label className="text-sm">2º Diácono conferente do dia</label>
            <select name="segundoDiaconoId" required className="w-full border p-2 rounded">
              <option value="">Selecione</option>{diaconos.map(d=><option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>
        </div>

        <hr />
        <h2 className="font-bold">Dízimos e Ofertas do dia</h2>
        {linhas.map((l, i)=>(
          <div key={i} className="grid grid-cols-12 gap-2 items-end border p-2 rounded bg-gray-50">
            <div className="col-span-5"><label className="text-xs">Nome Membro (texto livre)</label><input value={l.nome} onChange={e=>update(i,"nome",e.target.value)} placeholder="Nome" required className="w-full border p-2 rounded" /></div>
            <div className="col-span-3"><label className="text-xs">Valor</label><input value={l.valor} onChange={e=>update(i,"valor",e.target.value)} type="number" step="0.01" required className="w-full border p-2 rounded" /></div>
            <div className="col-span-3"><label className="text-xs">Tipo</label><select value={l.tipo} onChange={e=>update(i,"tipo",e.target.value)} className="w-full border p-2 rounded"><option value="dizimo">Dízimo</option><option value="oferta">Oferta</option></select></div>
            <div className="col-span-1"><button type="button" onClick={()=>remove(i)} className="text-red-500">X</button></div>
          </div>
        ))}
        <button type="button" onClick={addLinha} className="w-full border border-dashed p-2 rounded text-blue-600">+ Adicionar outra pessoa / oferta</button>

        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded font-bold">Lançar Tudo do Culto</button>
      </form>
    </div>
  )
}
