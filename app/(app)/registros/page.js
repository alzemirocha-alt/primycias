import Link from "next/link";
import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin, isTreasurer, STATUS_LABEL, fmtDate } from "@/lib/constants";
import { Btn, Tag } from "@/components/ui";

const TAG_TONE = {
  lancado: "neutral",
  confirmado_segundo_diacono: "gold",
  validado: "sage",
  erro_reportado: "rust",
};

export default async function RegistrosPage() {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);

  let query = supabaseAdmin.from("records").select("*, record_items(*)").eq("igreja_id", me.igreja_id).order("data_culto", { ascending: false });
  if (!(isAdmin(me) || isTreasurer(me, church))) {
  query = query.or(`diacono_id.eq.${me.id},segundo_diacono_id.eq.${me.id}`);
}
  const { data: records } = await query;

  const podeLancar = me.oficio === "diacono" && !isTreasurer(me, church);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <h2 className="text-xl font-serif text-ink">Dízimos e Ofertas</h2>
        {podeLancar && (
          <Link href="/registros/novo">
            <Btn>Lançar registro de culto</Btn>
          </Link>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-5">Diácono lança → Secretário do Conselho confirma → Tesoureiro da Igreja valida.</p>

      {(!records || records.length === 0) && <div className="text-sm text-gray-500">Nenhum registro encontrado.</div>}

      {records?.map((r) => {
        const dz = r.record_items.filter((i) => i.tipo === "dizimo").reduce((s, i) => s + Number(i.valor), 0);
        const of = r.record_items.filter((i) => i.tipo === "oferta").reduce((s, i) => s + Number(i.valor), 0);
        return (
          <Link
            key={r.id}
            href={`/registros/${r.id}`}
            className="block bg-white border border-line rounded-sm p-4 mb-3 hover:opacity-90"
          >
            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
              <div className="text-sm font-medium">Culto de {fmtDate(r.data_culto)}</div>
              <Tag tone={TAG_TONE[r.status]}>{STATUS_LABEL[r.status]}</Tag>
            </div>
            <div className="text-xs text-gray-500">
              Dízimos: {dz.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · Ofertas:{" "}
              {of.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
