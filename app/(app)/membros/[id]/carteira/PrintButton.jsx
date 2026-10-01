'use client'
export default function PrintButton(){
  return <button onClick={()=>window.print()} className="bg-[#0F3A1F] text-white px-6 py-2 rounded text-sm">Imprimir Carteira</button>
}
