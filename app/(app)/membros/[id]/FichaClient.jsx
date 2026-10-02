'use client'
import { useEffect, useState, useRef } from 'react'

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="bg-white border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50"
    >
      🖨️ Imprimir Ficha
    </button>
  )
}

export function OficialToggle() {
  useEffect(() => {
    function toggleAll(){
      const selCat = document.getElementById('categoria_membro')
      const selEC = document.getElementById('estado_civil')
      const selStatus = document.getElementById('status_membro')

      // 1. OFICIAL (seu original preservado)
      if(selCat){
        const isOficial = selCat.value === 'comungante_oficial'
        const c1 = document.getElementById('campo-oficial-tipo')
        const c2 = document.getElementById('campo-data-ordenacao')
        const c3 = document.getElementById('campo-data-instalacao')
        if(c1) c1.style.display = isOficial? '' : 'none'
        if(c2) c2.style.display = isOficial? '' : 'none'
        if(c3) c3.style.display = isOficial? '' : 'none'
      }

      // 2. CÔNJUGE - Só mostra se casado (corrige o contents)
      const gConj = document.getElementById('grupo-conjuge')
      if(gConj){
        const isCasado = selEC && selEC.value === 'casado'
        // Se tem contents, precisa esconder os filhos também
        gConj.style.display = isCasado? '' : 'none'
        // Garante que os inputs internos também sumam mesmo com contents
        Array.from(gConj.children).forEach(el => {
          el.style.display = isCasado? '' : 'none'
        })
      }

      // 3. DEMISSÃO - Só mostra se inativo ou demitido (SEU BUG DA FOTO)
      const gDem = document.getElementById('grupo-demissao')
      if(gDem && selStatus){
        const isDemitido = selStatus.value === 'inativo' || selStatus.value === 'demitido'
        gDem.style.display = isDemitido? '' : 'none'
      }

      // 4. PROF. FÉ - Esconde se não comungante
      const gProf = document.getElementById('grupo-prof-fe')
      if(gProf && selCat){
        const isNaoCom = selCat.value === 'nao_comungante'
        gProf.style.display = isNaoCom? 'none' : ''
        Array.from(gProf.children).forEach(el => {
          el.style.display = isNaoCom? 'none' : ''
        })
      }
    }

    const selCat = document.getElementById('categoria_membro')
    const selEC = document.getElementById('estado_civil')
    const selStatus = document.getElementById('status_membro')

    if(selCat) selCat.addEventListener('change', toggleAll)
    if(selEC) selEC.addEventListener('change', toggleAll)
    if(selStatus) selStatus.addEventListener('change', toggleAll)

    toggleAll() // roda na abertura

    const t = setTimeout(toggleAll, 500) // garante que pegou depois do hidrate
    return () => {
      clearTimeout(t)
      if(selCat) selCat.removeEventListener('change', toggleAll)
      if(selEC) selEC.removeEventListener('change', toggleAll)
      if(selStatus) selStatus.removeEventListener('change', toggleAll)
    }
  }, [])
  return null
}

export function FotoUpload({ defaultValue }) {
  const [preview, setPreview] = useState(defaultValue || "")
  const fileRef = useRef(null)
  const inputRef = useRef(null)

  const onFile = (e) => {
    const file = e.target.files?.[0]
    if(!file) return
    if(file.size > 2 * 1024 * 1024){
      alert("Foto muito grande! Máx 2MB")
      return
    }
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
