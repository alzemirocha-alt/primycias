import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildRecordsPDF } from "@/lib/pdf";
import { fmtDate } from "@/lib/constants";
import { recordItemsToExportRows } from "@/lib/exportRows";

export async function GET(request) {
  const me = await getSessionUser();
  if (!me) return new Response("Não autorizado", { status: 401 });
  const church = await getChurch(me.igreja_id);

  const { searchParams } = new URL(request.url);
  const de = searchParams.get("de") || "";
  const ate = searchParams.get("ate") || "";
  const formato = searchParams.get("formato") || "pdf";

  const canSeeAll = me.oficio === "pastor" || me.oficio === "presbitero" || me.id === church.tesoureiro_user_id;

  let query = supabaseAdmin.from("records").select("*, record_items(*)").eq("igreja_id", me.igreja_id).eq("status", "validado");
  if (!canSeeAll) query = query.eq("diacono_id", me.id);
  if (de) query = query.gte("data_culto", de);
  if (ate) query = query.lte("data_culto", ate);
  const { data: records } = await query.order("data_culto", { ascending: true });

  if (formato === "json") {
    return Response.json({ rows: recordItemsToExportRows(records || [], church.nome) });
  }

  const title = de || ate
    ? `Relatório de Dízimos e Ofertas — ${de ? fmtDate(de) : "início"} a ${ate ? fmtDate(ate) : "hoje"}`
    : "Relatório de Dízimos e Ofertas";

  const bytes = await buildRecordsPDF({ church, title, records: records || [], me });
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="relatorio-dizimos-ofertas.pdf"`,
    },
  });
}
