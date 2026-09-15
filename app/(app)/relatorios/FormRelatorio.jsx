"use client"
import { useState } from "react"

export default function FormRelatorio({ registros = [] }){
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [filtrados, setFiltrados] = useState([])
  const [gerou, setGerou] = useState(false)

  const safeRegs = Array.isArray(registros)? registros : []

  function gerar(){
    if(!de ||!ate){ alert('Selecione De e Até'); return }
    const dDe = new Date(de)
    const dAte = new Date(ate)
    const lista = safeRegs.filter(r=>{
      const d = new Date(r.data_culto)
      return d >= dDe && d <= dAte
    })
    setFiltrados(lista)
    setGerou(true)
  }

  function baixarPDF(){
    if(filtrados.length===0){ alert('Gere o relatório primeiro'); return }

    const totalDizimo = filtrados.filter(f=>f.tipo==='dizimo').reduce((s,i)=>s+Number(i.valor||0),0)
    const totalOferta = filtrados.filter(f=>f.tipo==='oferta').reduce((s,i)=>s+Number(i.valor||0),0)
    const totalGeral = totalDizimo + totalOferta

    let html = `
      <html><head><title>Relatorio Primicias</title>
      <style>body{font-family:Arial;padding:20px} table{width:100%;border-collapse:collapse;margin-top:10px} th,td{border:1px solid #ddd;padding:6px;text-align:left;font-size:12px} th{background:#1a4330;color:white}.total{background:#1a4330;color:white;padding:12px;margin-top:20px;font-weight:bold}</style>
      </head><body>
      <h2>Igreja Presbiteriana em Sucupira</h2>
      <h3>Relatório de Dízimos e Ofertas Validados</h3>
      <p>Período: ${new Date(de).toLocaleDateString('pt-BR')} até ${new Date(ate).toLocaleDateString('pt-BR')}</p>
      <table><thead><tr><th>Data Culto</th><th>Tipo</th><th>Membro</th><th>Valor</th><th>Validação</th></tr></thead><tbody>
    `
    filtrados.sort((a,b)=> new Date(a.data_culto) - new Date(b.data_culto)).forEach(r=>{
      html += `<tr><td>${new Date(r.data_culto).toLocaleDateString('pt-BR')}</td><td>${r.tipo}</td><td>${r.membro_nome}</td><td>R$ ${Number(r.valor).toFixed(2)}</td><td>${r.tesoureiro_nome}</td></tr>`
    })
    html += `</tbody></table>
      <div class="total">
        <div>Dízimos: R$ ${totalDizimo.toFixed(2)}</div>
        <div>Ofertas: R$ ${totalOferta.toFixed(2)}</div>
        <div style="font-size:16px;margin-top:8px;border-top:1px solid white;padding-top:8px">TOTAL GERAL: R$ ${totalGeral.toFixed(2)} - ${filtrados.length} lançamentos</div>
      </div>
      <script>window.print()</script>
      </body></html>
    `
    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
  }

  const totalDizimo = filtrados.filter(f=>f.tipo==='dizimo').reduce((s,i)=>s+Number(i.valor||0),0)
  const totalOferta = filtrados.filter(f=>f.tipo==='oferta').reduce((s,i)=>s+Number(i.valor||0),0)
  const totalGeral = totalDizimo + totalOferta

  const porData = {}
  filtrados.forEach(r=>{
    if(!porData[r.data_culto]) porData[r.data_culto]=[]
    porData[r.data_culto].push(r)
  })

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-[#1a4330]">Relatórios</h1>
      <p className="text-sm text-gray-500 mb-4">Relatório de dízimos e ofertas por período, com base nos validados pelo tesoureiro.</p>

      <div className="bg-white border p-4 rounded max-w-4xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs">De</label>
            <input type="date" value={de} onChange={e=>setDe(e.target.value)} className="border p-2 rounded w-full" />
          </div>
          <div>
            <label className="text-xs">Até</label>
            <input type="date" value={ate} onChange={e=>setAte(e.target.value)} className="border p-2 rounded w-full" />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={gerar} className="bg-[#1a4330] text-white px-6 py-2 rounded font-bold">
            Gerar relatório
          </button>
          {gerou && filtrados.length>0 && (
            <button onClick={baixarPDF} className="bg-[#1a4330] text-white px-6 py-2 rounded font-bold border">
              Baixar relatório em PDF
            </button>
          )}
        </div>
      </div>

      {gerou && (
        <div className="bg-white border mt-6 rounded p-4 max-w-4xl">
          {filtrados.length===0? (
            <p className="text-center p-6">Nenhum registro VALIDADO nesse período.</p>
          ) : (
            <>
              <h2 className="font-bold mb-3">Resultado em tela: {new Date(de).toLocaleDateString('pt-BR')} até {new Date(ate).toLocaleDateString('pt-BR')}</h2>
              {Object.keys(porData).sort().map(data=>{
                const itens = porData[data]
                const totData = itens.reduce((s,i)=>s+Number(i.valor||0),0)
                return (
                  <div key={data} className="mb-6 border-b pb-4">
                    <div className="font-bold bg-gray-100 p-2 rounded flex justify-between">
                      <span>Culto: {new Date(data).toLocaleDateString('pt-BR')}</span>
                      <span>R$ {totData.toFixed(2)}</span>
                    </div>
                    <table className="w-full text-sm mt-2">
                      <thead><tr className="text-left text-gray-500"><th>Tipo</th><th>Membro</th><th>Valor</th><th>Tesoureiro</th></tr></thead>
                      <tbody>
                        {itens.map(i=>(
                          <tr key={i.id} className="border-t">
                            <td className="py-1 capitalize">{i.tipo}</td>
                            <td>{i.membro_nome}</td>
                            <td>R$ {Number(i.valor).toFixed(2)}</td>
                            <td className="text-xs">{i.tesoureiro_nome}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })}
              <div className="bg-[#1a4330] text-white p-4 rounded font-bold space-y-1 mt-4">
                <div className="flex justify-between"><span>Total Dízimos:</span><span>R$ {totalDizimo.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Total Ofertas:</span><span>R$ {totalOferta.toFixed(2)}</span></div>
                <div className="flex justify-between text-lg border-t border-white/30 pt-2 mt-2"><span>TOTAL GERAL VALIDADO:</span><span>R$ {totalGeral.toFixed(2)}</span></div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
