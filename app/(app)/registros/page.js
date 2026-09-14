import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function RegistrosPage() {
  const me = await getSessionUser();

  const { data: records } = await supabaseAdmin
    .from("records")
    .select("*, record_items(*)")
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

      <div style={{ marginTop: 20 }}>
        {records?.map((r) => {
          const total = r.record_items?.reduce((s, i) => s + Number(i.valor), 0) || 0;
          return (
            <div key={r.id} style={{ border: '1px solid #ccc', padding: 15, marginBottom: 10, borderRadius: 8 }}>
              <p><b>Data: {r.data_culto}</b> - Total: R$ {total.toFixed(2)} - Status: {r.status}</p>
              {r.record_items?.map((item) => (
                <p key={item.id} style={{ marginLeft: 10 }}>- {item.tipo}: {item.nome} - R$ {item.valor}</p>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
