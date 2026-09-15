"use client"
import { useState } from "react"
import { criarRegistros } from "../actions"

export default function FormNovoRegistro({ diaconos }) {
  const [itens, setItens] = useState([{ tipo: 'dizimo', membro_nome: '', valor: '' }])
  const [dataCulto, setDataCulto] = useState(new Date().toISOString().slice(0,10))
  const [segundo, setSegundo] = useState('')

  function addLinha() { setItens([...itens, { tipo: 'oferta', membro_nome: '', valor: '' }]) }
  function update(i, campo, val) { const c = [...itens]; c[i][campo]=val; setItens(c) }

  const totalDizimo = itens.filter(x=>x.tipo==='dizimo').reduce((s,x)=>s+Number(x.valor||0),0)
  const totalOferta = itens.filter(x=>x.tipo==='oferta').reduce((s,x)=>s+Number(x.valor||0),0)
  const totalGeral = totalDizimo + totalOferta

  return (
    <form action={async (fd) => {
      fd.set('data_culto', dataCulto)
      fd.set('segundo_diacono_id', segundo)
      fd.set('itens', JSON.stringify(itens))
      await criarRegistros(fd)
    }} className="p-4 max-w-2xl mx-auto space-y-4 bg-white rounded shadow">
      <h1 className="font-bold">Novo Registro - {dataCulto}</h1>

      <input type="date" value={dataCulto} onChange={e=>setDataCulto(e.target.value)} className="border p-2 w-full rounded" required />

      <select value={segundo} onChange={e=>setSegundo(e.target.value)} className="border p-2 w-full rounded" required>
        <option value="">Selecione o 2o Diacono</option>
        {diaconos?.map(d=> <option key={d.id} value={d.id}>{d.nome}</option>)}
      </select>

      <div className="border rounded">
        <div className="grid grid-cols-3 bg-green-800 text-white p-2 text-sm font-bold"><div>Tipo</div><div>Nome</div><div>Valor</div></div>
        {itens.map((it, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 p-2 border-b">
            <select value={it.tipo} onChange={e=>update(i,'tipo',e.target.value)} className="border p-1 rounded">
              <option value="dizimo">Dizimo</option><option value="oferta">Oferta</option>
            </select>
            <input value={it.membro_nome} onChange={e=>update(i,'membro_nome',e.target.value)} placeholder="Nome" className="border p-1 rounded" />
            <input type="number" step="0.01" value={it.valor} onChange={e=>update(i,'valor',e.target.value)} placeholder="0,00" className="border p-1 rounded" />
          </div>
        ))}
      </div>

      <button type="button" onClick={addLinha} className="bg-gray-200 w-full p-2 rounded">+ Adicionar linha</button>

      <div className="bg-gray-100 p-3 rounded font-bold text-sm">
        <p>Total Dizimos: R$ {totalDizimo.toFixed(2)}</p>
        <p>Total Ofertas: R$ {totalOferta.toFixed(2)}</p>
        <p className="text-base border-t pt-1">TOTAL GERAL: R$ {totalGeral.toFixed(2)}</p>
      </div>

      <button className="bg-green-700 text-white w-full p-3 rounded font-bold">Salvar e Enviar p/ 2o Diacono</button>
    </form>
  )
}
