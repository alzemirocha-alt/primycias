"use client"
import { useState } from "react"
import { criarRegistros, liberarDiacono, bloquearDiacono, abrirCultoAction } from "./actions"

export default function FormNovo({ eu, diaconos = [], todosDiaconos = [], bloqueadosIds = [], datasBloqueadas = [], liberadosIds = [], cultosAbertos = [] }) {
  const [cultoId, setCultoId] = useState('')
  const [dataNova, setDataNova] = useState(new Date().toISOString().slice(0,10))
  const [periodoNovo, setPeriodoNovo] = useState('manha')
  const [segundo, setSegundo] = useState('')
  const [itens, setItens] = useState([{ tipo:'dizimo', membro_nome:'', valor:'' }])
  const [msg, setMsg] = useState('')
  const [carregando, setCarregando] = useState(null)
  const [abrindo, setAbrindo] = useState(false)

  const safeEu = eu || {}
  const safeDiaconos = Array.isArray(diaconos)? diaconos : []
  const safeTodos = Array.isArray(todosDiaconos)? todosDiaconos : []
  const safeBloqueados = Array.isArray(bloqueadosIds)? bloqueadosIds : []
  const safeLiberados = Array.isArray(liberadosIds)? liberadosIds : []
  const safeCultos = Array.isArray(cultosAbertos)? cultosAbertos : []

  const oficio = (safeEu.oficio || '').toLowerCase().trim()
  const isPastor = oficio === 'pastor'
  const podeLiberar = isPastor

  const getNome = (id) => safeTodos.find(d=>d.id===id)?.nome || 'Diácono'
  const getCultoLabel = (c) => {
    const d = c.data? new Date(c.data + 'T12:00:00').toLocaleDateString('pt-BR') : ''
    return `${d} - ${c.periodo === 'manha'? 'Manhã' : c.periodo === 'noite'? 'Noite' : c.periodo}`
  }

  const totalDizimo = itens.filter(i=>i.tipo==='dizimo').reduce((s,i)=>s+(Number(i.valor)||0),0)
  const totalOferta = itens.filter(i=>i.tipo==='oferta').reduce((s,i)=>s+(Number(i.valor)||0),0)
  const totalGeral = totalDizimo + totalOferta
  const showMsg = (t)=>{ setMsg(t); setTimeout(()=>setMsg(''),4000) }

  const abrirCulto = async () => {
    if(!dataNova){ showMsg('Escolha a data'); return }
    setAbrindo(true)
    try {
      const fd = new FormData()
      fd.set('data', dataNova)
      fd.set('periodo', periodoNovo)
      fd.set('igreja_id', safeEu.igreja_id)
      await abrirCultoAction(fd)
      window.location.reload()
    } catch(e){ showMsg(e.message); setAbrindo(false) }
  }

  if(!eu) return <div className="p-6">Carregando sessão...</div>

  if(podeLiberar){
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="font-bold text-lg mb-4">Liberar Diáconos - Pastor</h1>
        {safeBloqueados.map(id=>(
          <div key={id} className="flex justify-between items-center border p-3 rounded mb-2 bg-white">
            <span>{getNome(id)} - bloqueado</span>
            <button disabled={carregando===id} onClick={async()=>{ setCarregando(id); try{ await liberarDiacono(id); window.location.reload() }catch(e){ alert(e.message); setCarregando(null) } }} className="bg-blue-600 text-white px-3 py-1 rounded">Liberar</button>
          </div>
        ))}
        {safeLiberados.map(id=>(
          <div key={id} className="flex justify-between items-center border p-3 rounded mb-2 bg-blue-50">
            <span>{getNome(id)} - Liberado</span>
            <button disabled={carregando===id} onClick={async()=>{ setCarregando(id); try{ await bloquearDiacono(id); window.location.reload() }catch(e){ alert(e.message); setCarregando(null) } }} className="bg-gray-500 text-white px-3 py-1 rounded">Bloquear</button>
          </div>
        ))}
        {safeBloqueados.length===0 && safeLiberados.length===0 && <p className="bg-green-100 p-3 rounded">Nenhum bloqueado no momento.</p>}
      </div>
    )
  }

  return (
    <form action={async (fd)=>{
      if(!cultoId){ showMsg('Selecione o culto aberto.'); return }
      if(safeBloqueados.includes(segundo)){ showMsg(`${getNome(segundo)} bloqueado.`); return }
      fd.set('itens', JSON.stringify(itens))
      fd.set('igreja_id', safeEu.igreja_id)
      fd.set('culto_id', cultoId)
      const cultoSel = safeCultos.find(c=>c.id===cultoId)
      if(cultoSel?.data) fd.set('data_culto', cultoSel.data)
      try{ await criarRegistros(fd) }catch(e){ showMsg(e.message) }
    }} className="p-6 max-w-2xl mx-auto space-y-4">
      {msg && <div className="bg-red-600 text-white p-3 rounded font-bold text-center">{msg}</div>}

      <div className="border rounded p-4 bg-[#faf9f6] space-y-3">
        <label className="block font-bold">Culto *</label>
        {safeCultos.length>0? (
          <select value={cultoId} onChange={e=>setCultoId(e.target.value)} required className="border p-3 rounded w-full bg-white">
            <option value="">Selecione o culto aberto</option>
            {safeCultos.map(c=><option key={c.id} value={c.id}>{getCultoLabel(c)}</option>)}
          </select>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Nenhum culto aberto. Abra o culto abaixo:</p>
            <div className="flex gap-2">
              <input type="date" value={dataNova} onChange={e=>setDataNova(e.target.value)} className="border p-2 rounded flex-1" />
              <select value={periodoNovo} onChange={e=>setPeriodoNovo(e.target.value)} className="border p-2 rounded">
                <option value="manha">Manhã</option>
                <option value="noite">Noite</option>
              </select>
              <button type="button" disabled={abrindo} onClick={abrirCulto} className="bg-[#1E5631] text-white px-4 rounded font-bold">{abrindo?'Abrindo...':'Abrir Culto'}</button>
            </div>
          </div>
        )}
        {safeCultos.length>0 && (
          <div className="flex gap-2 pt-2 border-t mt-2">
            <input type="date" value={dataNova} onChange={e=>setDataNova(e.target.value)} className="border p-2 rounded flex-1 text-sm" />
            <select value={periodoNovo} onChange={e=>setPeriodoNovo(e.target.value)} className="border p-2 rounded text-sm">
              <option value="manha">Manhã</option>
              <option value="noite">Noite</option>
            </select>
            <button type="button" disabled={abrindo} onClick={abrirCulto} className="bg-[#1E5631] text-white px-3 rounded text-sm font-bold">+ Novo Culto</button>
          </div>
        )}
      </div>

      <div>
        <label className="block font-bold mb-2">2º Diácono</label>
        <select name="segundo_diacono_id" value={segundo} onChange={e=>setSegundo(e.target.value)} required className="border p-3 rounded w-full bg-gray-100">
          <option value="">Selecione</option>
          {safeDiaconos.map(d=>{
            const bloqueado = safeBloqueados.includes(d.id)
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

      <div className="bg-gray-100 p-4 rounded border font-bold">
        <div className="flex justify-between"><span>Dízimos:</span><span>R$ {totalDizimo.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Ofertas:</span><span>R$ {totalOferta.toFixed(2)}</span></div>
        <div className="flex justify-between border-t pt-2 mt-2 text-green-800 text-lg"><span>TOTAL:</span><span>R$ {totalGeral.toFixed(2)}</span></div>
      </div>
      <button disabled={safeCultos.length===0 &&!cultoId} className="bg-green-700 text-white w-full py-3 rounded font-bold disabled:opacity-50">Salvar Registro</button>
    </form>
  )
}
