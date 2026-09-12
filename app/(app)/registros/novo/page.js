import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { criarDizimoAction } from "../actions";
import Link from "next/link";
export const dynamic = 'force-dynamic';

export default async function NovoRegistroPage() {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);

  const { data: diaconos } = await supabaseAdmin.from("users").select("id, nome").eq("igreja_id", me.igreja_id).eq("oficio","diacono").neq("id", me.id).neq("id", church.tesoureiro_user_id);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Lançar Registro</h1>
      <form action={criarDizimoAction} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label className="text-sm">Nome do Membro (texto livre)</label>
          <input name="nome_membro" required placeholder="Ex: João da Silva" className="w-full border p-2 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm">Valor</label>
            <input name="valor" type="number" step="0.01" required className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="text-sm">Tipo</label>
            <select name="tipo" className="w-full border p-2 rounded">
              <option value="dizimo">Dízimo</option>
              <option value="oferta">Oferta</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm">2º Diácono conferente</label>
          <select name="segundoDiaconoId" required className="w-full border p-2 rounded">
            <option value="">Selecione</option>
            {diaconos?.map(d=><option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </div>
        <button className="w-full bg-blue-600 text-white p-3 rounded font-bold">Lançar Registro</button>
      </form>
    </div>
  );
}
