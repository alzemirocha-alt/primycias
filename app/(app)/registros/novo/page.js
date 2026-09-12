import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { criarRegistroAction } from "../actions";
import FormNovoRegistro from "./FormNovoRegistro";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function NovoRegistroPage() {
  const user = await getSessionUser();
  if (!user) return <div className="p-6">Sessão expirada.</div>;

  const { data: me } = await supabaseAdmin.from("users").select("igreja_id, cargo").eq("id", user.id).single();

  // TRAVA: Se for tesoureiro, pastor ou presbítero, não deixa nem abrir a página
  const meuCargo = (me?.cargo || '').toLowerCase();
  if (meuCargo.includes('tesour') || meuCargo.includes('pastor') || meuCargo.includes('presb')) {
    return <div className="p-6">Apenas diáconos (exceto tesoureiro) podem lançar registros.</div>;
  }

  const igrejaId = me?.igreja_id || '172c0206-bb22-5b1e-89a2-0c35e23a6840';

  // Lista para o 2º diácono: só diáconos, sem tesoureiro, sem pastor, sem presbítero
  const { data: diaconos } = await supabaseAdmin
  .from("users")
  .select("id, nome")
  .eq("igreja_id", igrejaId)
  .neq("id", user.id)
  .ilike("cargo", "%diacono%")
  .not("cargo", "ilike", "%tesour%")
  .not("cargo", "ilike", "%pastor%")
  .not("cargo", "ilike", "%presb%")
  .order("nome");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Lançar Dízimos e Ofertas</h1>
      <FormNovoRegistro diaconos={diaconos || []} igrejaId={igrejaId} action={criarRegistroAction} />
      <Link href="/registros" className="block text-center text-sm text-gray-500 mt-4">Voltar</Link>
    </div>
  );
}
