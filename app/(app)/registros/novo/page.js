import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { criarDizimoAction } from "../actions";
import Link from "next/link";
export const dynamic = 'force-dynamic';

export default async function NovoRegistroPage() {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);
  if (me.oficio!== 'diacono' || church?.tesoureiro_user_id === me.id) {
    return <div className="p-6">Apenas diáconos (exceto tesoureiro) podem lançar.</div>;
  }
  const { data: membros } = await supabaseAdmin.from("membros").select("id, nome").eq("igreja_id", me.igreja_id).order("nome");
  const { data: diaconos } = await supabaseAdmin.from("users").select("id, nome").eq("igreja_id", me.igreja_id).eq("oficio","diacono").neq("id", me.id).neq("id", church.tesoureiro_user_id);
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Lançar por Membro</h1>
      <form action={criarDizimoAction} className="space-y-4 bg-white p-4 rounded shadow">
        <select name="membro_id" required className="w-full border p-2 rounded"><option value="">Membro</option>{membros?.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}</select>
        <div className="grid grid-cols-2 gap-2">
          <input name="valor" type="number" step="0.01" required placeholder="Valor" className="border p-2 rounded" />
          <select name="tipo" className="border p-2 rounded"><option value="dizimo">Dízimo</option><option value="oferta">Oferta</option></select>
        </div>
        <select name="segundoDiaconoId" required className="w-full border p-2 rounded"><option value="">2º Diácono conferente</option>{diaconos?.map(d=><option key={d.id} value={d.id}>{d.nome}</option>)}</select>
        <button className="w-full bg-blue-600 text-white p-3 rounded font-bold">Lançar Registro</button>
      </form>
      <Link href="/registros" className="block text-center text-sm mt-4">Voltar</Link>
    </div>
  );
}
