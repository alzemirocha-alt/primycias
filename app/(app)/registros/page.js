import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function RegistrosPage() {
  const me = await getSessionUser();

  // Busca todos da sua igreja (sem filtro de diácono por enquanto pra aparecer)
  const { data: records } = await supabaseAdmin
    .from("records")
    .select("*")
    .eq("igreja_id", me.igreja_id)
    .order("created_at", { ascending: false });

  const podeLancar = me.oficio === "diacono";

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Dízimos e Ofertas - {records?.length || 0}</h2>
        {podeLancar && (
          <Link href="/registros/novo" style={{ background: '#1a4d2e', color: 'white', padding: '10px 15px', borderRadius: 5, textDecoration: 'none' }}>
            + Lançar registro de culto
          </Link>
        )}
      </div>

      <p style={{ marginTop: 10 }}>ID Igreja: {me.igreja_id}</p>

      {(!records || records.length === 0) && (
        <div style={{ marginTop: 20, padding: 20, border: '1px dashed #ccc' }}>
          Nenhum registro. Clique no botão acima para criar o primeiro.
        </div>
      )}

      {records?.map((r) => (
        <div key={r.id} style={{ border: '1px solid #ccc', padding: 10, marginTop: 10 }}>
          <p><b>{r.membro_nome || 'Culto'}</b> - R$ {r.valor}</p>
          <p>Status: {r.status}</p>
          <p>Data: {r.data_culto}</p>
        </div>
      ))}
    </div>
  );
}
