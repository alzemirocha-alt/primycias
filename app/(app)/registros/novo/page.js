import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { criarRegistroAction } from "../actions";
import Link from "next/link";

export default async function NovoRegistroPage() {
  const user = await getSessionUser();
  const church = await getChurch();
  
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
      <p className="text-sm text-gray-500 mb-6">Diácono lança → 2º Diácono confirma → Tesoureiro valida</p>
      
      <form action={criarRegistroAction} className="space-y-4 bg-white p-6 rounded shadow">
        <div>
          <label className="block text-sm font-medium">Data do culto</label>
          <input type="date" name="data_culto" required className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium">Selecione o 2º Diácono que vai confirmar</label>
          <select name="segundo_diacono_id" required className="w-full border p-2 rounded bg-white">
            <option value="">-- Escolha outro diácono --</option>
            {diaconos?.map((d) => (
              <option key={d.id} value={d.id}>{d.nome} - {d.email}</option>
            ))}
          </select>
          {(!diaconos || diaconos.length === 0) && (
            <p className="text-xs text-red-500 mt-1">Nenhum outro diácono encontrado nesta igreja. Cadastre outro usuário como diácono.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Dízimos (R$)</label>
            <input type="number" step="0.01" name="dizimos" defaultValue="0" className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium">Ofertas (R$)</label>
            <input type="number" step="0.01" name="ofertas" defaultValue="0" className="w-full border p-2 rounded" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Observação</label>
          <textarea name="observacao" className="w-full border p-2 rounded" rows={3}></textarea>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="bg-green-800 text-white px-4 py-2 rounded">
            Lançar registro
          </button>
          <Link href="/registros" className="border px-4 py-2 rounded">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
