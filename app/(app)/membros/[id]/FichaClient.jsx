'use client'
import { useEffect, useState, useRef } from 'react'

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="bg-white border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50">
      🖨️ Imprimir Ficha
    </button>
  )
}

// Seu FotoUpload original preservado
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
  useEffect(() => {
    const form = document.querySelector('form')
    if(!form) return

    // CRIA OS BOTÕES DE CONTROLE SE NÃO EXISTIREM
    let editarBtn = document.getElementById('btn-editar-ficha')
    const headerBtns = document.querySelector('.no-print.flex.gap-2')

    if(headerBtns &&!editarBtn){
      editarBtn = document.createElement('button')
      editarBtn.id = 'btn-editar-ficha'
      editarBtn.type = 'button'
      editarBtn.className = 'bg-[#0F3A1F] text-white px-4 py-2 rounded text-sm'
      editarBtn.textContent = '✏️ Editar Ficha'
      headerBtns.prepend(editarBtn)
    }

    const salvarBtn = form.querySelector('button[type="submit"], button.w-full.py-3')
    const allInputs = () => form.querySelectorAll('input, select, textarea')
    let editando = false

    function setModoVisualizar(){
      editando = false
      if(editarBtn) editarBtn.textContent = '✏️ Editar Ficha'
      if(salvarBtn) salvarBtn.style.display = 'none'
      allInputs().forEach(el => {
        if(el.type === 'hidden') return
        el.setAttribute('disabled','true')
        el.classList.add('bg-gray-50','pointer-events-none')
      })
      // Esconde botões de foto no modo visualizar
      document.querySelectorAll('.no-print.w-full').forEach(b => b.style.display = 'none')
    }

    function setModoEdicao(){
      editando = true
      if(editarBtn) editarBtn.textContent = '❌ Cancelar Edição'
      if(salvarBtn) salvarBtn.style.display = ''
      allInputs().forEach(el => {
        el.removeAttribute('disabled')
        el.classList.remove('bg-gray-50','pointer-events-none')
      })
      document.querySelectorAll('.no-print.w-full').forEach(b => b.style.display = '')
      applyRules() // re-aplica filtros ao entrar em edição
    }

    function applyRules(){
      const selEC = document.getElementById('estado_civil')
      const selStatus = document.getElementById('status_membro')
      const selCat = document.getElementById('categoria_membro')
      const selAdm = document.getElementById('forma_admissao')
      const selDem = document.getElementById('forma_demissao')

      const gConj = document.getElementById('grupo-conjuge')
      const gDem = document.getElementById('grupo-demissao')
      const gProf = document.getElementById('grupo-prof-fe')
      const cOficialTipo = document.getElementById('campo-oficial-tipo')
      const cOrd = document.getElementById('campo-data-ordenacao')
      const cInst = document.getElementById('campo-data-instalacao')

      // 1. Cônjuge só se casado
      if(gConj && selEC){
        gConj.style.display = selEC.value === 'casado'? 'grid' : 'none'
      }
      // 2. Demissão só se inativo/demitido
      if(gDem && selStatus){
        const show = selStatus.value === 'inativo' || selStatus.value === 'demitido'
        gDem.style.display = show? 'block' : 'none'
      }
      // 3. Profissão de fé e oficial
      if(selCat){
        const isNaoCom = selCat.value === 'nao_comungante'
        const isOficial = selCat.value === 'comungante_oficial'
        if(gProf) gProf.style.display = isNaoCom? 'none' : 'grid'
        if(cOficialTipo) cOficialTipo.style.display = isOficial? '' : 'none'
        if(cOrd) cOrd.style.display = isOficial? '' : 'none'
        if(cInst) cInst.style.display = isOficial? '' : 'none'

        // 4. FILTRA ADMISSÃO: Art.16 para comungante, Art.17 para não comungante
        if(selAdm){
          const ogs = selAdm.querySelectorAll('optgroup')
          ogs.forEach(og => {
            const isArt16 = og.label.includes('Art. 16')
            const isArt17 = og.label.includes('Art. 17')
            if(isNaoCom){
              og.style.display = isArt17? '' : 'none'
              og.querySelectorAll('option').forEach(op => op.disabled =!isArt17 && op.value!== "")
              // Se estiver no grupo errado, reseta
              if(isArt16 && selAdm.value && selAdm.querySelector(`optgroup[label*="Art. 16"] option[value="${CSS.escape(selAdm.value)}"]`)){
                // está em grupo errado, limpa
              }
            } else {
              og.style.display = isArt16? '' : 'none'
              og.querySelectorAll('option').forEach(op => op.disabled =!isArt16 && op.value!== "")
            }
          })
        }
        // 5. FILTRA DEMISSÃO: Art.23 para comungante, Art.24 para não comungante
        if(selDem){
          const ogs = selDem.querySelectorAll('optgroup')
          ogs.forEach(og => {
            const isArt23 = og.label.includes('Art. 23')
            const isArt24 = og.label.includes('Art. 24')
            if(isNaoCom){
              og.style.display = isArt24? '' : 'none'
              og.querySelectorAll('option').forEach(op => op.disabled =!isArt24 && op.value!== "")
            } else {
              og.style.display = isArt23? '' : 'none'
              og.querySelectorAll('option').forEach(op => op.disabled =!isArt23 && op.value!== "")
            }
          })
        }
      }
    }

    // Listeners
    const selEC = document.getElementById('estado_civil')
    const selStatus = document.getElementById('status_membro')
    const selCat = document.getElementById('categoria_membro')
    if(selEC) selEC.addEventListener('change', applyRules)
    if(selStatus) selStatus.addEventListener('change', applyRules)
    if(selCat) selCat.addEventListener('change', applyRules)

    if(editarBtn){
      editarBtn.onclick = () => {
        if(editando) setModoVisualizar()
        else setModoEdicao()
      }
    }

    // INICIA EM MODO VISUALIZAÇÃO (RELATÓRIO FECHADO)
    setModoVisualizar()
    setTimeout(() => { applyRules(); setModoVisualizar(); }, 300)

    return () => {
      if(selEC) selEC.removeEventListener('change', applyRules)
      if(selStatus) selStatus.removeEventListener('change', applyRules)
      if(selCat) selCat.removeEventListener('change', applyRules)
    }
  }, [])
  return null
}
