import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildLedgerPDF } from "@/lib/pdf";
import { canAccessTesouraria, today } from "@/lib/constants";
import { computeLedgerRealizado, futureRows } from "@/lib/ledger";
import { ledgerToExportRows } from "@/lib/exportRows";

export async function GET(request) {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);
  if (!canAccessTesouraria(me, church)) return new Response("Não autorizado", { status: 403 });

  const { searchParams } = new URL(request.url);
  const futuro = searchParams.get("futuro") === "1";
  const formato = searchParams.get("formato") || "pdf";

  const [{ data: records }, { data: lancamentos }, { data: financas }] = await Promise.all([
    supabaseAdmin.from("records").select("*, record_items(*)").eq("igreja_id", me.igreja_id),
    supabaseAdmin.from("lancamentos").select("*").eq("igreja_id", me.igreja_id),
    supabaseAdmin.from("financas").select("*").eq("igreja_id", me.igreja_id).maybeSingle(),
  ]);

  const rows = futuro
    ? futureRows(lancamentos).filter((r) => r.tipo === "entrada")
    : computeLedgerRealizado(records, lancamentos, financas).filter((r) => r.tipo === "entrada");

  if (formato === "json") {
    return Response.json({ rows: ledgerToExportRows(rows, church.nome) });
  }

  const bytes = await buildLedgerPDF({
    church, title: futuro ? "Entradas Futuras (projeção)" : "Relatório de Entradas",
    subtitle: `Emitido em ${today()}`, rows, showSaldo: false, me,
  });
  return new Response(bytes, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="entradas${futuro ? "-futuras" : ""}.pdf"` },
  });
}
