import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { criarRegistroAction } from "../actions";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function NovoRegistroPage() {
  const user = await getSessionUser();
  const church = await getChurch();

  if (!user) {
    redirect("/login");
  }
  if (!church) {
    redirect("/login");
  }

  // Busca todos os diáconos da mesma igreja, exceto eu mesmo
  const { data: diaconos } = await supabaseAdmin
    .from("users")
    .select("id, nome, email")
    .eq("igreja_id", church.id)
    .eq("cargo", "diacono")
    .neq("id", user.id);

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold mb-1">Lançar registro de culto</h1>
      <p className="text-sm text-gray-500 mb-5">Diácono lança + 2º Diácono confirma + Tesoureiro valida</p>

      <form action={criarRegistroAction} className="space-y-4 bg-white p-6 rounded shadow">
        <div>
          <label className="block text-sm font-medium">Data do culto</label>
          <input type="date" name="data_culto" required className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium">Selecione o 2º Diácono que vai confirmar</label>
          <select name="segundo_diacono_id" required className="w-full border p-2 rounded bg-white">
            <option value="">Selecione...</option>
            {diaconos?.map((d) => (
              <option key={d.id} value={d.id}>{d.nome} - {d.email}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Valor</label>
          <input type="number" step="0.01" name="valor" required className="w-full border p-2 rounded" />
        </div>

        <button type="submit" className="w-full bg-black text-white p-2 rounded">Lançar para confirmação</button>
        <Link href="/registros" className="block text-center text-sm text-gray-500 mt-2">Voltar</Link>
      </form>
    </div>
  );
}
