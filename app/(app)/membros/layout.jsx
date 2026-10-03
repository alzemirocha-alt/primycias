import Link from 'next/link'

export default function MembrosLayout({ children }) {
  return (
    <div>
      {/* MENU INTERNO DE MEMBROS */}
      <div className="bg-white border-b px-6 py-3 flex gap-2 sticky top-0 z-10">
        <Link href="/membros" className="px-4 py-2 rounded-lg border text-sm bg-gray-50 hover:bg-gray-100">
          Lista de Membros
        </Link>
        <Link href="/membros/transferencia" className="px-4 py-2 rounded-lg border text-sm bg-[#0A3D26] text-white">
          Transferência de Membros
        </Link>
        <Link href="/membros/relatorios" className="px-4 py-2 rounded-lg border text-sm bg-[#0A3D26] text-white">
          Relatórios
        </Link>
      </div>
      {children}
    </div>
  )
}
