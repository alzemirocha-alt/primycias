"use client"
import { useState } from "react"

export default function FormRelatorio({ eu, registros = [], igreja }){
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [filtrados, setFiltrados] = useState([])
  const [gerou, setGerou] = useState(false)

  const dadosIgreja = {
    nome: igreja?.nome || "Igreja Presbiteriana em Sucupira",
    cnpj: igreja?.cnpj || "12857611000130",
    cep: igreja?.cep || "54280-005",
    endereco: igreja?.endereco || "Avenida General Manoel Rabelo, 5.657, Sucupira, Jaboatão dos Guararapes-PE",
    logo: "/logo-igreja.png"
  }

  function gerar(){
    if(!de ||!ate){ alert('Selecione De e Até'); return }
    const dDe = new Date(de+"T00:00:00")
    const dAte = new Date(ate+"T23:59:59")
    const lista = registros.filter(r=>{
      const d = new Date(r.data_culto+"T12:00:00")
      return d >= dDe && d <= dAte
    }).sort((a,b)=> new Date(a.data_culto) - new Date(b.data_culto))
    setFiltrados(lista)
    setGerou(true)
  }

  const gerarHTML = ()=>{
    const porData = {}
    filtrados.forEach(r=>{
      if(!porData[r.data_culto]) porData[r.data_culto]=[]
      porData[r.data_culto].push(r)
    })

    const totalDizimo = filtrados.filter(f=>f.tipo?.toLowerCase()==='dizimo').reduce((s,i)=>s+Number(i.valor||0),0)
    const totalOferta = filtrados.filter(f=>f.tipo?.toLowerCase()==='oferta').reduce((s,i)=>s+Number(i.valor||0),0)
    const agora = new Date().toLocaleString('pt-BR')

    let html = `
    <html><head><meta charset="utf-8"><title>Relatório</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;padding:30px;color:#222;font-size:12px}
     .cab{display:flex;gap:16px;border-bottom:2px solid #1a4330;padding-bottom:12px;margin-bottom:10px}
     .cab img{height:70px}
     .cab h2{margin:0;color:#1a4330;font-size:16px}
     .small{font-size:11px;color:#444}
     .titulo{color:#1a4330;font-size:18px;font-weight:bold;text-align:center;margin:16px 0}
     .meta{font-size:11px;color:#555;border-bottom:1px solid #ddd;padding-bottom:8px;margin-bottom:14px}
     .dia{margin-bottom:28px;page-break-inside:avoid;border:1px solid #ddd;border-radius:6px;overflow:hidden}
     .dia-head{background:#f3f6f3;padding:8px 12px;font-weight:bold;display:flex;justify-content:space-between;color:#1a4330}
      table{width:100%;border-collapse:collapse}
      th,td{border-top:1px solid #e5e5e5;padding:6px 10px;text-align:left}
      th{background:#fafafa;font-size:11px}
     .sub{font-size:11px;background:#f9f9f9;padding:8px 12px;display:flex;justify-content:space-between}
     .assin{font-size:10px;color:#555;padding:8px 12px;border-top:1px dashed #ccc;line-height:1.5}
     .totais{border-top:2px solid #1a4330;margin-top:20px;padding-top:12px;font-weight:bold}
    </style></head><body>
      <div class="cab">
        <img src="${dadosIgreja.logo}" onerror="this.style.display='none'" />
        <div>
          <h2>${dadosIgreja.nome}</h2>
          <div class="small">CNPJ: ${dadosIgreja.cnpj} &nbsp;&nbsp; CEP: ${dadosIgreja.cep}</div>
          <div class="small">${dadosIgreja.endereco}</div>
        </div>
      </div>
      <div class="titulo">Relatório de Dízimos e Ofertas — ${new Date(de+"T12:00:00").toLocaleDateString('pt-BR')} a ${new Date(ate+"T12:00:00").toLocaleDateString('pt-BR')}</div>
      <div class="meta">Emitido em: ${agora} &nbsp;&middot;&nbsp; Por: ${eu?.nome || ''} (${eu?.oficio || ''} — ${eu?.funcao || 'acesso MASTER'})</div>
    `

    if(filtrados.length===0){
      html+=`<p>Nenhum registro para exibir.</p>`
    } else {
      Object.keys(porData).sort().forEach(dataCulto=>{
        const itens = porData[dataCulto]
        const totDia = itens.reduce((s,i)=>s+Number(i.valor||0),0)
        const totDizDia = itens.filter(i=>i.tipo?.toLowerCase()==='dizimo').reduce((s,i)=>s+Number(i.valor||0),0)
        const totOfeDia = itens.filter(i=>i.tipo?.toLowerCase()==='oferta').reduce((s,i)=>s+Number(i.valor||0),0)
        const primeiro = itens[0]

        html+=`
        <div class="dia">
          <div class="dia-head"><span>Data do Culto: ${new Date(dataCulto+"T12:00:00").toLocaleDateString('pt-BR')}</span><span>Total do Dia: R$ ${totDia.toFixed(2)}</span></div>
          <table><thead><tr><th>Tipo</th><th>Nome</th><th>Valor</th></tr></thead><tbody>
        `
        itens.forEach(it=>{
          html+=`<tr><td style="text-transform:capitalize">${it.tipo}</td><td>${it.membro_nome}</td><td>R$ ${Number(it.valor).toFixed(2)}</td></tr>`
        })
        html+=`</tbody></table>
          <div class="sub"><span>Dízimos dia: R$ ${totDizDia.toFixed(2)}</span><span>Ofertas dia: R$ ${totOfeDia.toFixed(2)}</span><span>Total dia: R$ ${totDia.toFixed(2)}</span></div>
          <div class="assin">
            Preenchido por: ${primeiro.diacono1_nome || ''} em ${primeiro.diacono1_at? new Date(primeiro.diacono1_at).toLocaleString('pt-BR') : ''}<br/>
            Confirmado por: ${primeiro.diacono2_nome || ''} em ${primeiro.diacono2_at? new Date(primeiro.diacono2_at).toLocaleString('pt-BR') : ''}<br/>
            Validado por Tesoureiro: ${primeiro.tesoureiro_nome || ''} em ${primeiro.tesoureiro_at? new Date(primeiro.tesoureiro_at).toLocaleString('pt-BR') : ''}<br/>
            Histórico: ${(primeiro.historico||[]).map(h=>`${h.acao} por ${h.usuario} em ${new Date(h.em).toLocaleString('pt-BR')}`).join(' | ')}
          </div>
        </div>`
      })
    }

    const totalDizimo = filtrados.filter(f=>f.tipo?.toLowerCase()==='dizimo').reduce((s,i)=>s+Number(i.valor||0),0)
    const totalOferta = filtrados.filter(f=>f.tipo?.toLowerCase()==='oferta').reduce((s,i)=>s+Number(i.valor||0),0)

    html+=`
      <div class="totais">
        Dízimos: R$ ${totalDizimo.toFixed(2)} &nbsp;&nbsp;·&nbsp;&nbsp; Ofertas: R$ ${totalOferta.toFixed(2)} &nbsp;&nbsp;·&nbsp;&nbsp; Total geral: R$ ${(totalDizimo+totalOferta).toFixed(2)}
      </div>
    </body></html>`
    return html
  }

  function baixarPDF(){
    if(filtrados.length===0){ alert('Gere o relatório primeiro'); return }
    const html = gerarHTML()
    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
  }

  const porData = {}
  filtrados.forEach(r=>{ if(!porData[r.data_culto]) porData[r.data_culto]=[]; porData[r.data_culto].push(r) })
  const totalDizimo = filtrados.filter(f=>f.tipo?.toLowerCase()==='dizimo').reduce((s,i)=>s+Number(i.valor||0),0)
  const totalOferta = filtrados.filter(f=>f.tipo?.toLowerCase()==='oferta').reduce((s,i)=>s+Number(i.valor||0),0)

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-[#1a4330]">Relatórios</h1>
      <p className="text-sm text-gray-500 mb-4">Relatório oficial com base nos registros validados pelo tesoureiro.</p>

      <div className="bg-white border p-4 rounded max-w-5xl">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs">De</label><input type="date" value={de} onChange={e=>setDe(e.target.value)} className="border p-2 rounded w-full" /></div>
          <div><label className="text-xs">Até</label><input type="date" value={ate} onChange={e=>setAte(e.target.value)} className="border p-2 rounded w-full" /></div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={gerar} className="bg-[#1a4330] text-white px-6 py-2 rounded font-bold">Gerar relatório</button>
          {gerou && <button onClick={baixarPDF} className="bg-[#1a4330] text-white px-6 py-2 rounded font-bold">Baixar relatório em PDF</button>}
        </div>
      </div>

      {gerou && (
        <div className="bg-white border mt-6 rounded max-w-5xl overflow-hidden">
          {/* CABEÇALHO NA TELA - igual PDF */}
          <div className="flex gap-4 p-4 border-b-2 border-[#1a4330]">
            <img src={dadosIgreja.logo} alt="logo" className="h-[70px] object-contain" onError={e=>e.target.style.display='none'} />
            <div>
              <div className="font-bold text-[#1a4330]">{dadosIgreja.nome}</div>
              <div className="text-xs">CNPJ: {dadosIgreja.cnpj} &nbsp; CEP: {dadosIgreja.cep}</div>
              <div className="text-xs">{dadosIgreja.endereco}</div>
              <div className="text-[11px] text-gray-500 mt-2">Emitido em: {new Date().toLocaleString('pt-BR')} · Por: {eu?.nome} ({eu?.oficio} — {eu?.funcao})</div>
            </div>
          </div>

          <div className="p-4">
            <h2 className="text-center font-bold text-[#1a4330] text-lg mb-4">Relatório de Dízimos e Ofertas — {de? new Date(de+"T12:00:00").toLocaleDateString('pt-BR') : ''} a {ate? new Date(ate+"T12:00:00").toLocaleDateString('pt-BR') : ''}</h2>

            {filtrados.length===0? <p className="p-4">Nenhum registro para exibir.</p> :
              Object.keys(porData).sort().map(dataCulto=>{
                const itens = porData[dataCulto]
                const totDia = itens.reduce((s,i)=>s+Number(i.valor||0),0)
                const totDizDia = itens.filter(i=>i.tipo?.toLowerCase()==='dizimo').reduce((s,i)=>s+Number(i.valor||0),0)
                const totOfeDia = itens.filter(i=>i.tipo?.toLowerCase()==='oferta').reduce((s,i)=>s+Number(i.valor||0),0)
                const primeiro = itens[0]
                return (
                  <div key={dataCulto} className="mb-6 border rounded overflow-hidden">
                    <div className="bg-[#f3f6f3] p-2 flex justify-between font-bold text-[#1a4330]"><span>{new Date(dataCulto+"T12:00:00").toLocaleDateString('pt-BR')}</span><span>Total do Dia: R$ {totDia.toFixed(2)}</span></div>
                    <table className="w-full text-sm"><thead><tr className="bg-gray-50 text-xs"><th className="p-2 text-left">Tipo</th><th className="p-2 text-left">Nome</th><th className="p-2 text-left">Valor</th></tr></thead>
                      <tbody>{itens.map(it=><tr key={it.id} className="border-t"><td className="p-2 capitalize">{it.tipo}</td><td className="p-2">{it.membro_nome}</td><td className="p-2">R$ {Number(it.valor).toFixed(2)}</td></tr>)}</tbody>
                    </table>
                    <div className="bg-gray-50 p-2 text-xs flex justify-between"><span>Dízimos: R$ {totDizDia.toFixed(2)}</span><span>Ofertas: R$ {totOfeDia.toFixed(2)}</span><span className="font-bold">Total: R$ {totDia.toFixed(2)}</span></div>
                    <div className="p-2 text-[11px] text-gray-600 border-t border-dashed space-y-1">
                      <div>Preenchido por: {primeiro.diacono1_nome} em {primeiro.diacono1_at? new Date(primeiro.diacono1_at).toLocaleString('pt-BR') : ''}</div>
                      <div>Confirmado por: {primeiro.diacono2_nome} em {primeiro.diacono2_at? new Date(primeiro.diacono2_at).toLocaleString('pt-BR') : ''}</div>
                      <div>Validado por: {primeiro.tesoureiro_nome} em {primeiro.tesoureiro_at? new Date(primeiro.tesoureiro_at).toLocaleString('pt-BR') : ''}</div>
                      <div className="text-[10px]">Histórico: {(primeiro.historico||[]).map(h=>`${h.acao} por ${h.usuario}`).join(' → ')}</div>
                    </div>
                  </div>
                )
              })
            }

            <div className="border-t-2 border-[#1a4330] pt-3 mt-4 font-bold flex gap-6">
              <span>Dízimos: R$ {totalDizimo.toFixed(2)}</span><span>·</span><span>Ofertas: R$ {totalOferta.toFixed(2)}</span><span>·</span><span>Total geral: R$ {(totalDizimo+totalOferta).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
