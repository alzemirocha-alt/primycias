import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { criarRegistroAction } from "../actions";
import FormNovoRegistro from "./FormNovoRegistro";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function NovoRegistroPage() {
  const user = await getSessionUser();
  if (!user) return <div className="p-6">Sessão expirada.</div>;

  const { data: me } = await supabaseAdmin.from("users").select("igreja_id").eq("id", user.id).single();
  const igrejaId = me?.igreja_id || '172c0206-bb22-5b1e-89a2-0c35e23a6840';

  const { data: diaconos } = await supabaseAdmin.from("users").select("id, nome").eq("igreja_id", igrejaId).neq("id", user.id).order("nome");

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold mb-4">Lançar Dízimos e Ofertas</h1>
      <FormNovoRegistro diaconos={diaconos || []} igrejaId={igrejaId} action={criarRegistroAction} />
      <Link href="/registros" className="block text-center text-sm text-gray-500 mt-4">Voltar</Link>
    </div>
  );
}
