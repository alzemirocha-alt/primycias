"use client"
import { useState } from "react"
import { criarRegistros } from "../actions"

export default function FormNovo({ eu, diaconos, todosDiaconos, bloqueadosIds, datasBloqueadas, ultimoCulto }) {
  const [data, setData] = useState('')
  const [segundo, setSegundo] = useState('')
  const [itens, setItens] = useState([{ tipo:'dizimo', membro_nome:'', valor:'' }])
  const [erro, setErro] = useState('')
  const [liberados, setLiberados] = useState([]) // Pastor libera aqui

  const isPastor = eu.oficio === 'pastor'
  const getNome = (id) => todosDiaconos.find(d => d.id === id)?.nome || 'Diácono'

  return (
    <form action={async (fd) => {
      setErro('')
      // TRAVA 1 no front também
      if (datasBloqueadas.includes(data)) { setErro(`TRAVA 1: Já existe registro em ${new Date(data).toLocaleDateString('pt-BR')}`); return }
      // TRAVA 3 no front
      if (!isPastor && bloqueadosIds.includes(segundo) &&!liberados.includes(segundo)) { setErro(`TRAVA 3: ${getNome(segundo)} bloqueado. Só Pastor libera.`); return }

      fd.set('itens', JSON.stringify(itens))
      try { await criarRegistros(fd) } catch(e) { setErro(e.message) }
    }} className="p-4 max-w-2xl mx-auto space-y-4">

      {erro && <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded font-bold">{erro}</div>}

      {/* Mostra quem está bloqueado */}
      {ultimoCulto && bloqueadosIds.length > 0 && (
        <div className="bg-yellow-50 border p-3 rounded text-sm">
          <p className="font-bold">Último registro: {new Date(ultimoCulto.data_culto).toLocaleDateString('pt-BR')}</p>
          <p>Bloqueados para este próximo registro (TRAVA 3):</p>
          <ul className="list-disc ml-5 font-bold">
            {bloqueadosIds.map(id => <li key={id}>{getNome(id)}</li>)}
          </ul>

          {/* SÓ PASTOR VÊ ISSO - AQUI ELE LIBERA */}
          {isPastor? (
            <div className="bg-white border-2 border-blue-400 p-3 rounded mt-3">
              <p className="font-bold text-blue-800">🔓 MÓDULO PASTOR - Liberar diáconos:</p>
              <p className="text-xs mb-2">Lista de diáconos (exceto tesoureiro). Marque para liberar neste registro:</p>
              {bloqueadosIds.map(id => (
                <label key={id} className="flex items-center gap-2 py-1 border-b">
                  <input type="checkbox" checked={liberados.includes(id)} onChange={() => setLiberados(p => p.includes(id)? p.filter(x => x!== id) : [...p, id])} />
                  <span>{getNome(id)} {liberados.includes(id)? '✅ LIBERADO para este registro' : '⛔ BLOQUEADO'}</span>
                </label>
              ))}
              <p className="text-xs mt-2 text-gray-600">Após o Tesoureiro validar, a trava volta automaticamente.</p>
            </div>
          ) : (
            <p className="text-xs mt-2 text-red-600">⛔ Você não pode selecionar os diáconos acima. Peça ao Pastor para liberar.</p>
          )}
        </div>
      )}

      <label className="block font-bold">Data do Culto (TRAVA 1: só 1 por data)</label>
      <input type="date" name="data_culto" value={data} onChange={e=>setData(e.target.value)} required className="border p-2 rounded w-full" />

      <label className="block font-bold">2º Diácono (TRAVA 2: Tesoureiro nunca aparece)</label>
      <select name="segundo_diacono_id" value={segundo} onChange={e=>setSegundo(e.target.value)} required className="border p-2 rounded w-full">
        <option value="">Selecione o 2º Diácono</option>
        {diaconos.map(d => {
          const estaBloqueado = bloqueadosIds.includes(d.id) &&!liberados.includes(d.id)
          const bloqueadoParaComum = estaBloqueado &&!isPastor
          return (
            <option key={d.id} value={d.id} disabled={bloqueadoParaComum}>
              {d.nome} {bloqueadoParaComum? '⛔ BLOQUEADO (último culto)' : liberados.includes(d.id)? '✅ Liberado pelo Pastor' : ''}
            </option>
          )
        })}
      </select>

      <div className="space-y-2">
        {itens.map((it,i)=>(
          <div key={i} className="flex gap-2">
            <select value={it.tipo} onChange={e=>{ const n=[...itens]; n[i].tipo=e.target.value; setItens(n)}} className="border p-2 rounded"><option value="dizimo">Dízimo</option><option value="oferta">Oferta</option></select>
            <input placeholder="Nome" value={it.membro_nome} onChange={e=>{ const n=[...itens]; n[i].membro_nome=e.target.value; setItens(n)}} className="border p-2 rounded flex-1" />
            <input placeholder="Valor" type="number" step="0.01" value={it.valor} onChange={e=>{ const n=[...itens]; n[i].valor=e.target.value; setItens(n)}} className="border p-2 rounded w-24" />
          </div>
        ))}
        <button type="button" onClick={()=>setItens([...itens,{ tipo:'oferta', membro_nome:'', valor:'' }])} className="text-blue-700 font-bold">+ Adicionar linha</button>
      </div>

      <button className="bg-green-700 text-white w-full py-3 rounded font-bold">Salvar Registro</button>
    </form>
  )
}
