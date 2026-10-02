'use client'
import { useEffect } from 'react'

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
    function toggleOficial(){
      const sel = document.getElementById('categoria_membro')
      if(!sel) return
      const isOficial = sel.value === 'comungante_oficial'
      const c1 = document.getElementById('campo-oficial-tipo')
      const c2 = document.getElementById('campo-data-ordenacao')
      const c3 = document.getElementById('campo-data-instalacao')
      if(c1) c1.style.display = isOficial? '' : 'none'
      if(c2) c2.style.display = isOficial? '' : 'none'
      if(c3) c3.style.display = isOficial? '' : 'none'
    }
    const sel = document.getElementById('categoria_membro')
    if(sel){ sel.addEventListener('change', toggleOficial); toggleOficial(); }
    const t = setTimeout(() => {
      const sel2 = document.getElementById('categoria_membro')
      if(sel2){ sel2.addEventListener('change', toggleOficial); toggleOficial(); }
    }, 500)
    return () => clearTimeout(t)
  }, [])
  return null
}
