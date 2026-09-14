import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function RegistrosPage() {
  const me = await getSessionUser();
  
  // Busca SEM filtro de diacono para testar
  const { data: records, error } = await supabaseAdmin
    .from("records")
    .select("*")
    .eq("igreja_id", me.igreja_id)
    .order("created_at", { ascending: false });

  return (
    <div style={{ padding: 20 }}>
      <h2>DEBUG</h2>
      <p>Meu ID: {me.id}</p>
      <p>Minha Igreja ID: {me.igreja_id}</p>
      <p>Meu Oficio: {me.oficio}</p>
      <p>Erro: {error?.message || "nenhum"}</p>
      <p>Total encontrado: {records?.length || 0}</p>
      
      <hr style={{ margin: '20px 0' }} />
      
      {records?.map(r => (
        <div key={r.id} style={{ border: '1px solid black', padding: 10, marginBottom: 10 }}>
          <p>ID: {r.id}</p>
          <p>Membro: {r.membro_nome || JSON.stringify(r)}</p>
          <p>Valor: {r.valor}</p>
          <p>diacono_id no banco: {r.diacono_id}</p>
          <p>igreja_id no banco: {r.igreja_id}</p>
        </div>
      ))}
    </div>
  );
}
