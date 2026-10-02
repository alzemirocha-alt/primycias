'use client'
import { useEffect, useState, useRef } from 'react'

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="bg-white border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50">
      Imprimir Ficha
    </button>
  )
}

export function FotoUpload({ defaultValue }) {
  const [preview, setPreview] = useState(defaultValue || "")
  const fileRef = useRef(null)
  const inputRef = useRef(null)
  const onFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert("Foto muito grande! Max 2MB"); return }
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result
      setPreview(base64)
      if (inputRef.current) inputRef.current.value = base64
    }
    reader.readAsDataURL(file)
  }
  return (
    <div className="col-span-1 row-span-2 border rounded p-3 bg-gray-50 flex flex-col items-center justify-center">
      <input ref={inputRef} type="hidden" name="foto_url" defaultValue={defaultValue || ""} />
      {preview? (
        <img src={preview} alt="Foto" className="w-[110px] h-[140px] object-cover rounded border bg-white mb-2" />
      ) : (
        <div className="w-[110px] h-[140px] bg-gray-200 rounded border flex items-center justify-center text-[10px] text-gray-500 text-center mb-2">SEM FOTO</div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <button type="button" onClick={() => fileRef.current?.click()} className="no-print w-full bg-[#0F3A1F] text-white text-xs py-2 rounded">
        {preview? 'Trocar Foto' : 'Upload'}
      </button>
      {preview && (
        <button type="button" onClick={() => { setPreview(""); if (inputRef.current) inputRef.current.value = ""; }} className="no-print w-full mt-1 text-[11px] text-red-600 hover:underline">Remover</button>
      )}
    </div>
  )
}

export function OficialToggle() {
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    const form = document.getElementById('ficha-form') || document.querySelector('form')
    if (!form) return

    const applyRules = () => {
      const selEC = document.getElementById('estado_civil')
      const selStatus = document.getElementById('status_membro')
      const selCat = document.getElementById('categoria_membro')
      const selAdm = document.getElementById('forma_admissao')
      const selDem = document.getElementById('forma_demissao')
      const gConj = document.getElementById('grupo-conjuge')
      const gDem = document.getElementById('grupo-demissao')
      const gProf = document.getElementById('grupo-prof-fe')
      const cOf = document.getElementById('campo-oficial-tipo')
      const cOrd = document.getElementById('campo-data-ordenacao')
      const cInst = document.getElementById('campo-data-instalacao')

      if (gConj && selEC) gConj.style.display = selEC.value === 'casado'? 'grid' : 'none'
      if (gDem && selStatus) gDem.style.display = (selStatus.value === 'inativo' || selStatus.value === 'demitido')? 'block' : 'none'
      if (selCat) {
        const isNao = selCat.value === 'nao_comungante'
        const isOf = selCat.value === 'comungante_oficial'
        if (gProf) gProf.style.display = isNao? 'none' : 'grid'
        if (cOf) cOf.style.display = isOf? '' : 'none'
        if (cOrd) cOrd.style.display = isOf? '' : 'none'
        if (cInst) cInst.style.display = isOf? '' : 'none'
        if (selAdm) {
          selAdm.querySelectorAll('optgroup').forEach((og) => {
            og.hidden = isNao?!og.label.includes('Art. 17') :!og.label.includes('Art. 16')
          })
        }
        if (selDem) {
          selDem.querySelectorAll('optgroup').forEach((og) => {
            og.hidden = isNao?!og.label.includes('Art. 24') :!og.label.includes('Art. 23')
          })
        }
      }
    }

    const lock = (isEdit) => {
      const btnSalvar = document.getElementById('btn-salvar')
      const inputs = form.querySelectorAll('input, select, textarea')
      if (isEdit) {
        if (btnSalvar) btnSalvar.style.display = ''
        form.classList.remove('modo-visualizar')
        inputs.forEach((el) => { if (el.type!== 'hidden') el.disabled = false })
      } else {
        if (btnSalvar) btnSalvar.style.display = 'none'
        form.classList.add('modo-visualizar')
        inputs.forEach((el) => { if (el.type!== 'hidden') el.disabled = true })
      }
      applyRules()
    }

    lock(editando)
    const t = setTimeout(() => lock(editando), 200)

    const ec = document.getElementById('estado_civil')
    const st = document.getElementById('status_membro')
    const cat = document.getElementById('categoria_membro')
    ec?.addEventListener('change', applyRules)
    st?.addEventListener('change', applyRules)
    cat?.addEventListener('change', applyRules)

    return () => {
      clearTimeout(t)
      ec?.removeEventListener('change', applyRules)
      st?.removeEventListener('change', applyRules)
      cat?.removeEventListener('change', applyRules)
    }
  }, [editando])

  return (
    <button id="btn-editar-ficha" type="button" onClick={() => setEditando((e) =>!e)} className="bg-[#0F3A1F] text-white px-4 py-2 rounded text-sm">
      {editando? 'Cancelar' : 'Editar Fich'use client'
import { useEffect, useState, useRef } from 'react'

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="bg-white border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50">
      Imprimir Ficha
    </button>
  )
}

export function FotoUpload({ defaultValue }) {
  const [preview, setPreview] = useState(defaultValue || "")
  const fileRef = useRef(null)
  const inputRef = useRef(null)
  const onFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert("Foto muito grande! Max 2MB"); return }
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result
      setPreview(base64)
      if (inputRef.current) inputRef.current.value = base64
    }
    reader.readAsDataURL(file)
  }
  return (
    <div className="col-span-1 row-span-2 border rounded p-3 bg-gray-50 flex flex-col items-center justify-center">
      <input ref={inputRef} type="hidden" name="foto_url" defaultValue={defaultValue || ""} />
      {preview? (
        <img src={preview} alt="Foto" className="w-[110px] h-[140px] object-cover rounded border bg-white mb-2" />
      ) : (
        <div className="w-[110px] h-[140px] bg-gray-200 rounded border flex items-center justify-center text-[10px] text-gray-500 text-center mb-2">SEM FOTO</div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <button data-foto-action type="button" onClick={() => fileRef.current?.click()} className="no-print w-full bg-[#0F3A1F] text-white text-xs py-2 rounded foto-action">
        {preview? 'Trocar Foto' : 'Upload'}
      </button>
      {preview && (
        <button data-foto-action type="button" onClick={() => { setPreview(""); if (inputRef.current) inputRef.current.value = ""; }} className="no-print w-full mt-1 text-[11px] text-red-600 hover:underline foto-action">Remover</button>
      )}
    </div>
  )
}

export function OficialToggle() {
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    const form = document.getElementById('ficha-form') || document.querySelector('form')
    if (!form) return

    const applyRules = () => {
      const selEC = document.getElementById('estado_civil')
      const selStatus = document.getElementById('status_membro')
      const selCat = document.getElementById('categoria_membro')
      const selAdm = document.getElementById('forma_admissao')
      const selDem = document.getElementById('forma_demissao')
      const gConj = document.getElementById('grupo-conjuge')
      const gDem = document.getElementById('grupo-demissao')
      const gProf = document.getElementById('grupo-prof-fe')
      const cOf = document.getElementById('campo-oficial-tipo')
      const cOrd = document.getElementById('campo-data-ordenacao')
      const cInst = document.getElementById('campo-data-instalacao')
      if (gConj && selEC) gConj.style.display = selEC.value === 'casado'? 'grid' : 'none'
      if (gDem && selStatus) gDem.style.display = (selStatus.value === 'inativo' || selStatus.value === 'demitido')? 'block' : 'none'
      if (selCat) {
        const isNao = selCat.value === 'nao_comungante'
        const isOf = selCat.value === 'comungante_oficial'
        if (gProf) gProf.style.display = isNao? 'none' : 'grid'
        if (cOf) cOf.style.display = isOf? '' : 'none'
        if (cOrd) cOrd.style.display = isOf? '' : 'none'
        if (cInst) cInst.style.display = isOf? '' : 'none'
        if (selAdm) selAdm.querySelectorAll('optgroup').forEach((og) => { og.hidden = isNao?!og.label.includes('Art. 17') :!og.label.includes('Art. 16') })
        if (selDem) selDem.querySelectorAll('optgroup').forEach((og) => { og.hidden = isNao?!og.label.includes('Art. 24') :!og.label.includes('Art. 23') })
      }
    }

    const lock = (isEdit) => {
      const btnSalvar = document.getElementById('btn-salvar')
      const inputs = form.querySelectorAll('input, select, textarea')
      const fotoBtns = document.querySelectorAll('[data-foto-action]')

      if (isEdit) {
        if (btnSalvar) { btnSalvar.style.display = 'block'; btnSalvar.style.setProperty('display','block','important') }
        form.classList.remove('modo-visualizar')
        inputs.forEach((el) => { if (el.type!== 'hidden') el.disabled = false })
        fotoBtns.forEach((b) => b.style.display = '')
      } else {
        if (btnSalvar) btnSalvar.style.display = 'none'
        form.classList.add('modo-visualizar')
        inputs.forEach((el) => { if (el.type!== 'hidden') el.disabled = true })
        fotoBtns.forEach((b) => b.style.display = 'none')
      }
      applyRules()
    }

    lock(editando)
    const t = setTimeout(() => lock(editando), 200)

    const ec = document.getElementById('estado_civil')
    const st = document.getElementById('status_membro')
    const cat = document.getElementById('categoria_membro')
    const h = () => applyRules()
    ec?.addEventListener('change', h)
    st?.addEventListener('change', h)
    cat?.addEventListener('change', h)

    return () => {
      clearTimeout(t)
      ec?.removeEventListener('change', h)
      st?.removeEventListener('change', h)
      cat?.removeEventListener('change', h)
    }
  }, [editando])

  return (
    <button id="btn-editar-ficha" type="button" onClick={() => setEditando((e) =>!e)} className="bg-[#0F3A1F] text-white px-4 py-2 rounded text-sm">
      {editando? 'Cancelar' : 'Editar Ficha'}
    </button>
  )
}
