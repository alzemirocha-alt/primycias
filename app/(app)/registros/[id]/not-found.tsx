import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <h2 className="text-xl font-semibold">Registro não encontrado</h2>
      <p className="text-sm text-zinc-500 mt-2">Este dízimo/oferta foi excluído ou não existe mais.</p>
      <Link href="/registros" className="mt-6 px-4 py-2 bg-[#1a3d23] text-white rounded">
        Voltar para Dízimos e Ofertas
      </Link>
    </div>
  );
}
