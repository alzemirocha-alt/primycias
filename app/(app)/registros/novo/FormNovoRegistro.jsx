"use client"
import { useState } from "react"
import { criarRegistros, liberarDiacono, bloquearDiacono, abrirCultoAction, deletarCultoAction } from "./actions"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function FormNovo({ eu, diaconos = [], todosDiaconos = [], bloqueadosIds = [], datasBloqueadas = [], liberadosIds = [], cultosAbertos = [] }) {
  const [cultoId, setCultoId] = useState('')
  const [dataNova, setDataNova] = useState(new Date().toISOString().slice(0,10))
  const [periodoNovo, setPeriodoNovo] = useState('manha')
  const [segundo, setSegundo] = useState('')
  const [itens, setItens] = useState([{ tipo:'dizimo', membro_nome:'', membro_id:'', valor:'' }])
  const [msg, setMsg] = useState('')
  const [carregando, setCarregando] = useState(null)
  const [abrindo, setAbrindo] = useState(false)
  const [buscaAtiva, setBuscaAtiva] = useState(null)
  const [sugestoes, setSugestoes] = useState([])
  const [excluindo, setExcluindo] = useState(false)

  const safeEu = eu || {}
  const safeDiaconos = Array.isArray(diaconos)? diaconos : []
  const safeTodos = Array.isArray(todosDiaconos)? todosDiaconos : []
  const safeBloqueados = Array.isArray(bloqueadosIds)? bloqueadosIds : []
  const safeLiberados = Array.isArray(liberadosIds)? liberadosIds : []
  const safeCultos = Array.isArray(cultosAbertos)? cultosAbertos : []

  const oficio = (safeEu.oficio || '').toLowerCase().trim()
  const funcao = (safeEu.funcao || '').toLowerCase().trim()
  const funcaoPresb = (safeEu.funcao_presbitero || '').toLowerCase().trim()

  const isPastor = oficio === 'pastor'
  const isTesoureiro = funcao === 'tesoureiro' || oficio === 'tesoureiro'
  const isPresbitero = oficio === 'presbitero' || oficio === 'presbítero' || funcaoPresb!== ''
  const isDiacono = oficio === 'diacono' || oficio === 'diácono'
  const isDiaconoNaoTesoureiro = isDiacono &&!isTesoureiro &&!isPastor &&!isPresbitero
  const estouBloqueado = safeBloqueados.includes(safeEu.id)

  const podeLiberar = isPastor

  const getNome = (id) => safeTodos.find(d=>d.id===id)?.nome || 'Diácono'
  const getCultoLabel = (c) => {
    const d = c.data? new Date(c.data + 'T12:00:00').toLocaleDateString('pt-BR') : ''
    return `${d} - ${c.periodo === 'manha'? 'Manhã' : c.periodo === 'noite'? 'Noite' : c.periodo}`
  }
  const cultoSelecionado = safeCultos.find(c=>c.id===cultoId)

  const totalDizimo = itens.filter(i=>i.tipo==='dizimo').reduce((s,i)=>s+(Number(i.valor)||0),0)
  const totalOferta = itens.filter(i=>i.tipo==='oferta').reduce((s,i)=>s+(Number(i.valor)||0),0)
  const totalGeral = totalDizimo + totalOferta
  const showMsg = (t)=>{ setMsg(t); setTimeout(()=>setMsg(''),4000) }

  const buscarMembro = async (texto, index) => {
    const n = [...itens]; n[index].membro_nome = texto; n[index].membro_id = ''; setItens(n)
    setBuscaAtiva(index)
    if(texto.length < 2){ setSugestoes([]); return }
    const { data } = await supabase.from('membros').select('id, nome').ilike('nome', `%${texto}%`).order('nome').limit(10)
    setSugestoes(data || [])
  }

  const selecionarMembro = (index, membro) => {
    const n = [...itens]; n[index].membro_nome = membro.nome; n[index].membro_id = membro.id; setItens(n)
    setSugestoes([]); setBuscaAtiva(null)
  }

  const abrirCulto = async () => {
    if(!dataNova){ showMsg('Escolha a data'); return }
    if(estouBloqueado){ showMsg('Você está bloqueado por ter participado do registro anterior'); return }
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

  const excluirCulto = async () => {
    if(!cultoId) return
    if(!confirm('Excluir este culto aberto? Só pode excluir antes de enviar para o 2º diácono.')) return
    setExcluindo(true)
    try {
      await deletarCultoAction(cultoId)
      window.location.reload()
    } catch(e){
      showMsg(e.message)
      setExcluindo(false)
    }
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

  if(isTesoureiro){
    return <div className="p-6 max-w-2xl mx-auto bg-yellow-50 border rounded">Tesoureiro: você não abre culto e não cria registro. Aguarde o 2º diácono confirmar para você validar em Dízimos/Ofertas.</div>
  }

  if(isPresbitero ||!isDiaconoNaoTesoureiro){
    return <div className="p-6 max-w-2xl mx-auto bg-gray-100 border rounded">Apenas Diácono que não é tesoureiro abre culto e inicia registro. Seu ofício: {safeEu.oficio || 'não definido'}</div>
  }

  if(estouBloqueado){
    return (
      <div className="relative p-6 max-w-2xl mx-auto">
        <div className="opacity-20 pointer-events-none select-none">
          <div className="border rounded p-4 bg-[#faf9f6] h-32"></div>
        </div>
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-red-600 text-white p-6 rounded-lg font-bold text-center shadow-xl max-w-md">
            <div className="text-3xl mb-2">⛔</div>
            <p className="text-lg">Você está bloqueado para iniciar um novo registro por ter participado do registro anterior.</p>
            <p className="text-sm mt-3 font-normal opacity-90">Aguarde o Pastor liberar. Quando o Pastor liberar, esse aviso some automaticamente.</p>
            <p className="text-xs mt-2">Diácono: {safeEu.nome}</p>
          </div>
        </div>
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
        {cultoId && cultoSelecionado? (
          <div className="bg-green-50 border border-green-600 p-3 rounded">
            <div className="font-bold text-green-800">Culto selecionado: {getCultoLabel(cultoSelecionado)}</div>
            <div className="flex gap-3 mt-2">
              <button type="button" onClick={()=>setCultoId('')} className="text-sm text-blue-600 underline">Trocar culto</button>
              <button type="button" disabled={excluindo} onClick={excluirCulto} className="text-sm text-red-600 underline font-bold">{excluindo?'Excluindo...':'Excluir este culto'}</button>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Só o diácono que abriu pode excluir, e só antes de enviar para o 2º diácono.</p>
          </div>
        ) : (
          <>
            {safeCultos.length>0? (
              <select value={cultoId} onChange={e=>setCultoId(e.target.value)} required className="border p-3 rounded w-full bg-white">
                <option value="">Selecione o culto aberto</option>
                {safeCultos.map(c=><option key={c.id} value={c.id}>{getCultoLabel(c)}</option>)}
              </select>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Nenhum culto aberto. Abra o culto abaixo:</p>
              </div>
            )}
            <div className="flex gap-2 pt-2 border-t mt-2">
              <input type="date" value={dataNova} onChange={e=>setDataNova(e.target.value)} className="border p-2 rounded flex-1 text-sm" />
              <select value={periodoNovo} onChange={e=>setPeriodoNovo(e.target.value)} className="border p-2 rounded text-sm">
                <option value="manha">Manhã</option>
                <option value="noite">Noite</option>
              </select>
              <button type="button" disabled={abrindo} onClick={abrirCulto} className="bg-[#1E5631] text-white px-3 rounded text-sm font-bold">{abrindo?'Abrindo...': safeCultos.length>0? '+ Novo Culto' : 'Abrir Culto'}</button>
            </div>
          </>
        )}
      </div>

      {cultoId && (
        <>
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
            <div key={i} className="flex gap-2 relative">
              <select value={it.tipo} onChange={e=>{const n=[...itens]; n[i].tipo=e.target.value; setItens(n)}} className="border p-2 rounded bg-gray-100">
                <option value="dizimo">Dízimo</option><option value="oferta">Oferta</option>
              </select>
              <div className="flex-1 relative">
                <input placeholder="Digite o nome - ex: VAL" value={it.membro_nome} onChange={e=>buscarMembro(e.target.value, i)} className="border p-2 rounded w-full" />
                {buscaAtiva===i && sugestoes.length>0 && (
                  <div className="absolute z-50 top-full left-0 right-0 bg-white border rounded shadow-lg max-h-40 overflow-auto mt-1">
                    {sugestoes.map(m=>(
                      <div key={m.id} onClick={()=>selecionarMembro(i,m)} className="p-2 hover:bg-green-100 cursor-pointer border-b text-sm">
                        {m.nome}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input type="number" step="0.01" placeholder="0,00" value={it.valor} onChange={e=>{const n=[...itens]; n[i].valor=e.target.value; setItens(n)}} className="border p-2 rounded w-24" />
            </div>
          ))}
          <button type="button" onClick={()=>setItens([...itens,{tipo:'oferta',membro_nome:'',membro_id:'',valor:''}])} className="text-blue-600 font-bold">+ Adicionar linha</button>

          <div className="bg-gray-100 p-4 rounded border font-bold">
            <div className="flex justify-between"><span>Dízimos:</span><span>R$ {totalDizimo.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Ofertas:</span><span>R$ {totalOferta.toFixed(2)}</span></div>
            <div className="flex justify-between border-t pt-2 mt-2 text-green-800 text-lg"><span>TOTAL:</span><span>R$ {totalGeral.toFixed(2)}</span></div>
          </div>
          <button className="bg-green-700 text-white w-full py-3 rounded font-bold">Salvar Registro</button>
        </>
      )}
    </form>
  )
}
