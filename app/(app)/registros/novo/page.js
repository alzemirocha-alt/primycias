import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isTreasurer } from "@/lib/constants";
import { criarRegistroAction } from "../actions";
import FormNovoRegistro from "./FormNovoRegistro";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function NovoRegistroPage() {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);

  if (me.oficio !== 'diacono' || church?.tesoureiro_user_id === me.id) {
    return <div className="p-6">Apenas diáconos (exceto tesoureiro) podem lançar. Pastor e Presbítero fora.</div>;
  }

  const { data: diaconos } = await supabaseAdmin
    .from("users")
    .select("id, nome")
    .eq("igreja_id", me.igreja_id)
    .eq("oficio", "diacono")
    .neq("id", me.id)
    .neq("id", church.tesoureiro_user_id);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Lançar Dízimos e Ofertas</h1>
      <FormNovoRegistro diaconos={diaconos || []} igrejaId={me.igreja_id} action={criarRegistroAction} />
      <Link href="/registros" className="block text-center text-sm text-gray-500 mt-4">Voltar</Link>
    </div>
  );
}
