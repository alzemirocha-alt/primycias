"use client"
import { useState } from "react"
import { atualizarRegistros } from "../../actions"

export default function FormEditarRegistro({ registros, data_culto, culto }) {
  const [itens, setItens] = useState(registros.map(r => ({ id: r.id, tipo: r.tipo, membro_nome: r.membro_nome, valor: r.valor })))
  const [salvando, setSalvando] = useState(false)

  function update(i, campo, val) {
    const c = [...itens]; c[i][campo] = val; setItens(c)
  }

  const totalDiz = itens.filter(x => x.tipo.toLowerCase().includes('dizimo')).reduce((s,x)=>s+Number(x.valor||0),0)
  const totalOfe = itens.filter(x => x.tipo.toLowerCase().includes('oferta')).reduce((s,x)=>s+Number(x.valor||0),0)

  async function handleSalvar(){
    setSalvando(true)
    try{
      // CORREÇÃO: passa culto.id (e7eaa01a... ou 498a51ff...) e não a data 2026-09-18
      const cultoId = culto?.id || registros[0]?.culto_id
      await atualizarRegistros(cultoId, itens)
    }catch(e){
      alert(e.message)
      setSalvando(false)
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h1 className="font-bold text-lg">Corrigir culto de {new Date(data_culto).toLocaleDateString('pt-BR')} {culto?.periodo? `- ${culto.periodo}` : ''}</h1>
      <p className="text-sm bg-red-100 p-2 rounded">Motivo do erro: {registros[0]?.motivo_erro || culto?.motivo_erro}</p>

      {itens.map((it, i) => (
        <div key={i} className="grid grid-cols-3 gap-2">
          <select value={it.tipo} onChange={e=>update(i,'tipo',e.target.value)} className="border p-2 rounded"><option value="dizimo">dizimo</option><option value="oferta">oferta</option></select>
          <input value={it.membro_nome} onChange={e=>update(i,'membro_nome',e.target.value)} className="border p-2 rounded" />
          <input type="number" value={it.valor} onChange={e=>update(i,'valor',e.target.value)} className="border p-2 rounded" />
        </div>
      ))}

      <div className="bg-gray-100 p-3 rounded font-bold">
        <p>Dizimos: R$ {totalDiz.toFixed(2)}</p><p>Ofertas: R$ {totalOfe.toFixed(2)}</p><p>TOTAL: R$ {(totalDiz+totalOfe).toFixed(2)}</p>
        <p className="text-xs font-normal mt-1">Culto ID: {culto?.id || registros[0]?.culto_id}</p>
      </div>

      <button disabled={salvando} onClick={handleSalvar} className="bg-green-700 text-white w-full py-3 rounded font-bold disabled:opacity-50">
        {salvando? 'Salvando...' : 'Salvar Correção e reenviar p/ 2º Diácono'}
      </button>
    </div>
  )
}
