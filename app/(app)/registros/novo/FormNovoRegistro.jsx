"use client"
import { useState, useMemo } from "react"
import { criarRegistros } from "../actions"

export default function FormNovo({ eu, diaconos, todosDiaconos, bloqueadosIds, datasBloqueadas }) {
  const [data, setData] = useState('')
  const [segundo, setSegundo] = useState('')
  const [itens, setItens] = useState([{ tipo:'dizimo', membro_nome:'', valor:'' }])
  const [msg, setMsg] = useState('')
  const isPastor = eu.oficio === 'pastor'

  const getNome = (id) => todosDiaconos.find(d=>d.id===id)?.nome || 'Diácono'
  const liberadosLS = useMemo(()=>{ try{ return JSON.parse(localStorage.getItem('pastor_liberados')||'{}').ids||[] }catch{return []} },[segundo])

  // SUBTOTAL AUTOMATICO
  const totalDizimo = itens.filter(i=>i.tipo==='dizimo').reduce((s,i)=>s+(Number(i.valor)||0),0)
  const totalOferta = itens.filter(i=>i.tipo==='oferta').reduce((s,i)=>s+(Number(i.valor)||0),0)
  const totalGeral = totalDizimo + totalOferta

  const showMsg = (t)=>{ setMsg(t); setTimeout(()=>setMsg(''),4000) }

  if(isPastor){
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="font-bold text-lg mb-4">Liberar Diáconos</h1>
        {bloqueadosIds.length===0?<p>Nenhum bloqueado</p>:bloqueadosIds.map(id=>(
          <div key={id} className="flex justify-between border p-3 rounded mb-2 bg-white">
            <span>{getNome(id)}</span>
            <button onClick={()=>{
              const atual = JSON.parse(localStorage.getItem('pastor_liberados')||'{"ids":[]}').ids||[]
              const novo = atual.includes(id)?atual.filter(x=>x!==id):[...atual,id]
              localStorage.setItem('pastor_liberados',JSON.stringify({ids:novo})); location.reload()
            }} className="bg-blue-600 text-white px-3 py-1 rounded font-bold">
              {liberadosLS.includes(id)?'Liberado':'Liberar'}
            </button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <form action={async (fd)=>{
      if(datasBloqueadas.includes(data)){ showMsg('Já existe registro para essa data.'); return }
      const liberados = JSON.parse(localStorage.getItem('pastor_liberados')||'{"ids":[]}').ids||[]
      if(bloqueadosIds.includes(segundo) &&!liberados.includes(segundo)){ showMsg(`${getNome(segundo)} participou do último culto e está bloqueado. Peça ao pastor.`); return }
      fd.set('itens', JSON.stringify(itens))
      try{ await criarRegistros(fd) }catch(e){ showMsg(e.message) }
    }} className="p-6 max-w-2xl mx-auto space-y-4">

      {msg && <div className="bg-red-600 text-white p-3 rounded font-bold text-center animate-pulse">{msg}</div>}

      <div>
        <label className="block font-bold mb-2">Data do Culto</label>
        <input type="date" name="data_culto" value={data} onChange={e=>setData(e.target.value)} required className="border p-3 rounded w-full" />
      </div>

      <div>
        <label className="block font-bold mb-2">2º Diácono</label>
        <select name="segundo_diacono_id" value={segundo} onChange={e=>setSegundo(e.target.value)} required className="border p-3 rounded w-full bg-gray-100">
          <option value="">Selecione</option>
          {diaconos.map(d=>{
            const bloqueado = bloqueadosIds.includes(d.id) &&!liberadosLS.includes(d.id)
            return <option key={d.id} value={d.id} disabled={bloqueado}>{d.nome}{bloqueado?' - bloqueado':''}</option>
          })}
        </select>
      </div>

      {itens.map((it,i)=>(
        <div key={i} className="flex gap-2">
          <select value={it.tipo} onChange={e=>{const n=[...itens]; n[i].tipo=e.target.value; setItens(n)}} className="border p-2 rounded bg-gray-100">
            <option value="dizimo">Dízimo</option><option value="oferta">Oferta</option>
          </select>
          <input placeholder="Nome" value={it.membro_nome} onChange={e=>{const n=[...itens]; n[i].membro_nome=e.target.value; setItens(n)}} className="border p-2 rounded flex-1" />
          <input type="number" step="0.01" placeholder="0,00" value={it.valor} onChange={e=>{const n=[...itens]; n[i].valor=e.target.value; setItens(n)}} className="border p-2 rounded w-24" />
        </div>
      ))}

      <button type="button" onClick={()=>setItens([...itens,{tipo:'oferta',membro_nome:'',valor:''}])} className="text-blue-600 font-bold">+ Adicionar linha</button>

      {/* SUBTOTAL AUTOMATICO QUE VOCE PEDIU */}
      <div className="bg-gray-100 p-4 rounded border font-bold space-y-1">
        <div className="flex justify-between"><span>Dízimos:</span><span>R$ {totalDizimo.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Ofertas:</span><span>R$ {totalOferta.toFixed(2)}</span></div>
        <div className="flex justify-between border-t pt-2 mt-2 text-green-800 text-lg"><span>TOTAL GERAL:</span><span>R$ {totalGeral.toFixed(2)}</span></div>
      </div>

      <button className="bg-green-700 text-white w-full py-3 rounded font-bold">Salvar Registro</button>
    </form>
  )
}
