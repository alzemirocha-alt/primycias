import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { criarRegistroAction } from "../actions";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function NovoRegistroPage() {
  const user = await getSessionUser();
  if (!user) return <div className="p-6">Sessão expirada.</div>;

  const { data: me } = await supabaseAdmin.from("users").select("igreja_id").eq("id", user.id).single();
  const igrejaId = me?.igreja_id || '172c0206-bb22-5b1e-89a2-0c35e23a6840';

  // Busca SÓ diáconos, excluindo tesoureiro Gilson e outros cargos
  const { data: diaconos } = await supabaseAdmin
    .from("users")
    .select("id, nome, cargo, funcao, email")
    .eq("igreja_id", igrejaId)
    .neq("id", user.id)
    .order("nome");

  // Filtra só diáconos no código (funciona independente do nome da coluna)
  const soDiaconos = (diaconos || []).filter((u) => {
    const cargo = (u.cargo || u.funcao || "").toLowerCase();
    const nome = u.nome.toLowerCase();
    // Exclui tesoureiro Gilson e quem não é diácono
    if (nome.includes("gilson")) return false;
    if (cargo.includes("tesoureiro")) return false;
    if (cargo.includes("pastor")) return false;
    if (cargo.includes("presb")) return false;
    return true; // se não tem cargo definido, assume que é diácono por enquanto
  });

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold mb-4">Lançar Dízimo / Oferta</h1>
      <form action={criarRegistroAction} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <input type="hidden" name="igreja_id" value={igrejaId} />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Data do culto</label>
            <input type="date" name="data_culto" required className="w-full border p-2.5 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select name="tipo" required className="w-full border p-2.5 rounded bg-white">
              <option value="dizimo">Dízimo</option>
              <option value="oferta">Oferta</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nome do dizimista / ofertante</label>
          <input type="text" name="nome_dizimista" placeholder="Ex: João da Silva" required className="w-full border p-2.5 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Valor R$</label>
          <input type="number" step="0.01" min="0" name="valor" placeholder="0,00" required className="w-full border p-2.5 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">2º Diácono que vai confirmar</label>
          <select name="segundo_diacono_id" required className="w-full border p-2.5 rounded bg-white">
            <option value="">Selecione o diácono...</option>
            {soDiaconos.map((d) => (
              <option key={d.id} value={d.id}>{d.nome}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">{soDiaconos.length} diácono(s) disponível(is)</p>
        </div>

        <button type="submit" className="w-full bg-black text-white p-3 rounded font-medium hover:bg-gray-800">
          Lançar para confirmação
        </button>
        <Link href="/registros" className="block text-center text-sm text-gray-500">Voltar</Link>
      </form>
    </div>
  );
}
