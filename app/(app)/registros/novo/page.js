import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { criarRegistroAction } from "../actions";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function NovoRegistroPage() {
  const user = await getSessionUser();
  if (!user) {
    return <div className="p-6">Sessão expirada. Faça login novamente.</div>;
  }

  // Busca igreja do usuário logado
  const { data: me, error } = await supabaseAdmin
    .from("users")
    .select("id, nome, igreja_id")
    .eq("id", user.id)
    .single();

  // Se der erro, mostra o erro real
  if (error || !me) {
    return <div className="p-6">Erro ao buscar usuário: {error?.message} - ID tentado: {user.id}</div>;
  }

  const igrejaId = me.igreja_id || '172c0206-bb22-5b1e-89a2-0c35e23a6840';

  const { data: diaconos } = await supabaseAdmin
    .from("users")
    .select("id, nome")
    .eq("igreja_id", igrejaId)
    .neq("id", user.id)
    .order("nome");

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold mb-4">Lançar registro</h1>
      <form action={criarRegistroAction} className="space-y-4 bg-white p-6 rounded shadow">
        <input type="hidden" name="igreja_id" value={igrejaId} />
        <div>
          <label className="block text-sm font-medium">Data do culto</label>
          <input type="date" name="data_culto" required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">2º Diácono que vai confirmar</label>
          <select name="segundo_diacono_id" required className="w-full border p-2 rounded bg-white">
            <option value="">Selecione...</option>
            {diaconos?.map((d) => (<option key={d.id} value={d.id}>{d.nome}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Valor R$</label>
          <input type="number" step="0.01" name="valor" required className="w-full border p-2 rounded" />
        </div>
        <button type="submit" className="w-full bg-black text-white p-2.5 rounded">Lançar para confirmação</button>
        <Link href="/registros" className="block text-center text-sm text-gray-500 mt-2">Voltar</Link>
      </form>
    </div>
  );
}
