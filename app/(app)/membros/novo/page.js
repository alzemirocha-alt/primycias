import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { redirect } from "next/navigation";

async function criarMembro(formData) {
  "use server";
  const nome = formData.get("nome");
  const rol = formData.get("rol");
  const cpf = formData.get("cpf");
  const status = formData.get("status") || "ativo";

  const { data, error } = await supabaseAdmin.from("membros_oficial").insert([{ nome, rol, cpf, status }]).select().single();
  if (error) throw new Error(error.message);
  redirect(`/membros/${data.id}`);
}

export default function NovoMembroPage() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Novo Membro</h1>
      <form action={criarMembro} className="space-y-3 bg-white border rounded p-4">
        <input name="nome" required placeholder="Nome completo" className="w-full border rounded px-3 py-2 text-sm" />
        <div className="grid grid-cols-2 gap-3">
          <input name="rol" placeholder="Nº do Rol" className="border rounded px-3 py-2 text-sm" />
          <input name="cpf" placeholder="CPF" className="border rounded px-3 py-2 text-sm" />
        </div>
        <select name="status" className="w-full border rounded px-3 py-2 text-sm">
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
        <button className="w-full py-2 bg-[#0F3A1F] text-white rounded text-sm">Salvar</button>
      </form>
    </div>
  );
}
