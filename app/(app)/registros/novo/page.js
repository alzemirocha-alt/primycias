import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { criarRegistroAction } from "../actions";
import Link from "next/link";

export default async function NovoRegistroPage() {
  const user = await getSessionUser();
  
  if (!user) {
    return <div className="p-6">Faça login novamente - sessão expirada</div>;
  }

  const { data: meuUsuario } = await supabaseAdmin
    .from("users")
    .select("igreja_id, email, nome")
    .eq("id", user.id)
    .single();

  const igrejaId = meuUsuario?.igreja_id;

  if (!igrejaId) {
    return (
      <div className="p-6">
        <h1 className="font-bold">Erro de configuração</h1>
        <p>Usuário: {meuUsuario?.nome} - {meuUsuario?.email}</p>
        <p>ID: {user.id}</p>
        <p className="text-red-600">Sua coluna igreja_id está vazia no Supabase.</p>
        <p>Vá no Supabase &gt; users &gt; preencha igreja_id</p>
        <Link href="/dashboard" className="text-blue-600">Voltar</Link>
      </div>
    );
  }

  const { data: diaconos } = await supabaseAdmin
    .from("users")
    .select("id, nome, email")
    .eq("igreja_id", igrejaId)
    .neq("id", user.id);

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold">Lançar registro</h1>
      <p className="text-sm text-gray-500 mb-4">Igreja ID: {igrejaId}</p>
      <form action={criarRegistroAction} className="space-y-4 bg-white p-6 rounded shadow">
        <div>
          <label className="block text-sm">Data do culto</label>
          <input type="date" name="data_culto" required className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm">2º Diácono que vai confirmar</label>
          <select name="segundo_diacono_id" required className="w-full border p-2 rounded bg-white">
            <option value="">Selecione...</option>
            {diaconos?.map((d) => (
              <option key={d.id} value={d.id}>{d.nome} - {d.email}</option>
            ))}
          </select>
          {(!diaconos || diaconos.length === 0) && <p className="text-red-500 text-sm">Nenhum outro usuário encontrado com mesma igreja_id</p>}
        </div>
        <div>
          <label className="block text-sm">Valor</label>
          <input type="number" step="0.01" name="valor" required className="w-full border p-2 rounded" />
        </div>
        <input type="hidden" name="igreja_id" value={igrejaId} />
        <button type="submit" className="w-full bg-black text-white p-2 rounded">Lançar para confirmação</button>
        <Link href="/registros" className="block text-center text-sm text-gray-500 mt-2">Voltar</Link>
      </form>
    </div>
  );
}
