"use client";
import { useState } from "react";
import { criarEventoAction, excluirEventoAction } from "./actions";
import { isAdmin } from "@/lib/constants";

export default function CalendarClient({ me, events }) {
  const [mes, setMes] = useState(new Date());
  const [diaSel, setDiaSel] = useState(null);
  const [loading, setLoading] = useState(false);

  const ano = mes.getFullYear();
  const m = mes.getMonth();
  const diasNoMes = new Date(ano, m + 1, 0).getDate();
  const primeiroDia = new Date(ano, m, 1).getDay();

  // agrupa por data
  const porDia = {};
  events.forEach(ev => {
    const key = ev.data; // YYYY-MM-DD
    if (!porDia[key]) porDia[key] = [];
    porDia[key].push(ev);
  });
  // ordena cada dia por hora
  Object.keys(porDia).forEach(k => {
    porDia[k].sort((a,b) => (a.hora||'00:00').localeCompare(b.hora||'00:00'));
  });

  const dataStrSelecionada = diaSel? `${ano}-${String(m+1).padStart(2,'0')}-${String(diaSel).padStart(2,'0')}` : null;

  async function handleCriar(e) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.target);
    const data = fd.get("data");
    const titulo = fd.get("titulo");
    const hora = fd.get("hora");
    const vis = fd.get("visibilidade") || "pessoal";
    try {
      await criarEventoAction(data, titulo, vis, hora);
      e.target.reset();
      setDiaSel(null);
    } catch(err){ alert(err.message); }
    setLoading(false);
  }

  return (
    <>
      <h2 className="text-xl font-serif text-ink mb-1">Agenda</h2>
      <p className="text-xs text-gray-500 mb-5">Toque no dia para adicionar com horário</p>

      <div className="bg-white border border-line rounded-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={()=>setMes(new Date(ano, m-1, 1))} className="px-3 py-1 border rounded">←</button>
          <div className="font-medium capitalize">{mes.toLocaleDateString('pt-BR',{month:'long', year:'numeric'})}</div>
          <button onClick={()=>setMes(new Date(ano, m+1, 1))} className="px-3 py-1 border rounded">→</button>
        </div>
        <div className="grid grid-cols-7 text-[11px] text-gray-500 text-center mb-2"><div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div></div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({length: primeiroDia}).map((_,i)=><div key={'v'+i}></div>)}
          {Array.from({length: diasNoMes}).map((_,i)=>{
            const d=i+1;
            const key = `${ano}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const evs = porDia[key]||[];
            return (
              <button key={d} onClick={()=>setDiaSel(d)} className={`border rounded-sm min-h-[58px] p-1 text-left text-xs ${diaSel===d?'border-ink ring-1':''} ${evs.length?'bg-[#1E5631]/5':''}`}>
                <div className="font-medium">{d}</div>
                {evs.slice(0,2).map(ev=><div key={ev.id} className="truncate text-[10px] mt-0.5">{(ev.hora||'').slice(0,5)} {ev.titulo}</div>)}
                {evs.length>2 && <div className="text-[9px] text-gray-500">+{evs.length-2}</div>}
              </button>
            );
          })}
        </div>
      </div>

      {diaSel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={()=>setDiaSel(null)}>
          <div className="bg-white w-full sm:max-w-md rounded-t sm:rounded p-4 max-h-[90vh] overflow-auto" onClick={e=>e.stopPropagation()}>
            <div className="font-serif text-base mb-3">{new Date(dataStrSelecionada+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long', day:'2-digit', month:'long'})}</div>

            <div className="space-y-2 mb-4">
              {(porDia[dataStrSelecionada]||[]).map(ev=>(
                <div key={ev.id} className="flex justify-between items-center border-b py-2 text-sm">
                  <div><span className="font-mono font-bold">{(ev.hora||'--:--').slice(0,5)}</span> - {ev.titulo} {ev.visibilidade!=='pessoal' && <span className="ml-1 text-[10px] bg-ink text-white px-1 rounded">{ev.visibilidade}</span>}</div>
                  <button onClick={async()=>{ if(confirm('Excluir?')) await excluirEventoAction(ev.id); }} className="text-xs text-red-600">Excluir</button>
                </div>
              ))}
              {!porDia[dataStrSelecionada]?.length && <div className="text-xs text-gray-500">Sem compromissos - adicione abaixo com hora</div>}
            </div>

            <form onSubmit={handleCriar} className="space-y-3 border-t pt-3">
              <div className="text-sm font-medium">Novo compromisso</div>
              <input name="titulo" required placeholder="Ex: Reunião do conselho" className="w-full border rounded p-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs">Data<input name="data" type="date" defaultValue={dataStrSelecionada} required className="w-full border rounded p-2 mt-1 text-sm" /></label>
                <label className="text-xs">Hora<input name="hora" type="time" required className="w-full border rounded p-2 mt-1 text-sm" /></label>
              </div>
              {isAdmin(me) && (
                <select name="visibilidade" className="w-full border rounded p-2 text-sm">
                  <option value="pessoal">Só para mim</option>
                  <option value="todos">Todos (aparece na Início)</option>
                  <option value="conselho">Conselho (oficial)</option>
                </select>
              )}
              <div className="flex gap-2">
                <button disabled={loading} className="bg-[#1E5631] text-white px-4 py-2 rounded text-sm flex-1">{loading?'Salvando...':'Adicionar'}</button>
                <button type="button" onClick={()=>setDiaSel(null)} className="border px-4 py-2 rounded text-sm">Fechar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
