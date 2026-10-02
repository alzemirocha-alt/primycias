'use client'
import { useEffect, useState, useRef } from 'react'

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="bg-white border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50">
      🖨️ Imprimir Ficha
    </button>
  )
}

export function FotoUpload({ defaultValue }) {
  const [preview, setPreview] = useState(defaultValue || "")
  const fileRef = useRef(null)
  const inputRef = useRef(null)
  const onFile = (e) => {
    const file = e.target.files?.[0]
    if(!file) return
    if(file.size > 2 * 1024 * 1024){ alert("Foto muito grande! Máx 2MB"); return }
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result
      setPreview(base64)
      if(inputRef.current) inputRef.current.value = base64
    }
    reader.readAsDataURL(file)
  }
  return (
    <div className="col-span-1 row-span-2 border rounded p-3 bg-gray-50 flex flex-col items-center justify-center print:border-0 print:bg-white print:p-0">
      <input ref={inputRef} type="hidden" name="foto_url" defaultValue={defaultValue || ""} />
      {preview? (
        <img src={preview} alt="Foto" className="w-[110px] h-[140px] object-cover rounded border bg-white mb-2 print:mb-0 print:border-0" />
      ) : (
        <div className="w-[110px] h-[140px] bg-gray-200 rounded border flex items-center justify-center text-[10px] text-gray-500 text-center mb-2 print:hidden">SEM<br/>FOTO</div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <button type="button" onClick={() => fileRef.current?.click()} className="no-print w-full bg-[#0F3A1F] text-white text-xs py-2 rounded hover:bg-[#164a2a]">
        📷 {preview? 'Trocar Foto' : 'Fazer Upload'}
      </button>
      {preview && (
        <button type="button" onClick={() => { setPreview(""); if(inputRef.current) inputRef.current.value = ""; }} className="no-print w-full mt-1 text-[11px] text-red-600 hover:underline">Remover</button>
      )}
    </div>
  )
}

export function OficialToggle() {
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    const form = document.querySelector('form')
    if(!form) return
    const btnSalvar = document.getElementById('btn-salvar')

    function applyRules(){
      const selEC = document.getElementById('estado_civil')
      const selStatus = document.getElementById('status_membro')
      const selCat = document.getElementById('categoria_membro')
      const selAdm = document.getElementById('forma_admissao')
      const selDem = document.getElementById('forma_demissao')
      const gConj = document.getElementById('grupo-conjuge')
      const gDem = document.getElementById('grupo-demissao')
      const gProf = document.getElementById('grupo-prof-fe')
      const cOfTipo = document.getElementById('campo-oficial-tipo')
      const cOrd = document.getElementById('campo-data-ordenacao')
      const cInst = document.getElementById('campo-data-instalacao')

      if(gConj && selEC) gConj.style.display = selEC.value === 'casado'? 'grid' : 'none'
      if(gDem && selStatus) gDem.style.display = (selStatus.value === 'inativo' || selStatus.value === 'demitido')? 'block' : 'none'
      if(selCat){
        const isNaoCom = selCat.value === 'nao_comungante'
        const isOficial = selCat.value === 'comungante_oficial'
        if(gProf) gProf.style.display = isNaoCom? 'none' : 'grid'
        if(cOfTipo) cOfTipo.style.display = isOficial? '' : 'none'
        if(cOrd) cOrd.style.display = isOficial? '' : 'none'
        if(cInst) cInst.style.display = isOficial? '' : 'none'

        if(selAdm){
          selAdm.querySelectorAll('optgroup').forEach(og => {
            const isArt16 = og.label.includes('Art. 16')
            const isArt17 = og.label.includes('Art. 17')
            og.hidden = isNaoCom?!isArt17 :!isArt16
          })
        }
        if(selDem){
          selDem.querySelectorAll('optgroup').forEach(og => {
            const isArt23 = og.label.includes('Art. 23')
            const isArt24 = og.label.includes('Art. 24')
            og.hidden = isNaoCom?!isArt24 :!isArt23
          })
        }
      }
    }

    const inputs = form.querySelectorAll('input, select, textarea')
    if(editando){
      if(btnSalvar) btnSalvar.style.display = ''
      form.classList.remove('modo-visualizar')
      inputs.forEach(el => { if(el.type!=='hidden') el.disabled = false })
      applyRules()
    } else {
      if(btnSalvar) btnSalvar.style.display = 'none'
      form.classList.add('modo-visualizar')
      inputs.forEach(el => { if(el.type!=='hidden') el.disabled = true })
      applyRules()
    }

    const selEC = document.getElementById('estado_civil')
    const selStatus = document.getElementById('status_membro')
    const selCat = document.getElementById('categoria_membro')
    selEC?.addEventListener('change', applyRules)
    selStatus?.addEventListener('change', applyRules)
    selCat?.addEventListener('change', applyRules)

    return () => {
      selEC?.removeEventListener('change', applyRules)
      selStatus?.removeEventListener('change', applyRules)
      selCat?.removeEventListener('change', applyRules)
    }
  }, [editando])

  return (
    <button id="btn-editar-ficha" type="button" onClick={() => setEditando(e =>!e)} className="bg-[#0F3A1F] text-white px-4 py-2 rounded text-sm">
      {editando? '❌ Cancelar' : '✏️ Editar Ficha'}
    </button>
  )
}
