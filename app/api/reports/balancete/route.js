import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildBalancetePDF } from "@/lib/pdf";
import { canAccessTesouraria, fmtDate } from "@/lib/constants";
import { computeLedgerRealizado } from "@/lib/ledger";
import { ledgerToExportRows } from "@/lib/exportRows";

export async function GET(request) {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);
  if (!canAccessTesouraria(me, church)) return new Response("Não autorizado", { status: 403 });

  const { searchParams } = new URL(request.url);
  const de = searchParams.get("de") || "";
  const ate = searchParams.get("ate") || "";
  const formato = searchParams.get("formato") || "pdf";

  const [{ data: records }, { data: lancamentos }, { data: financas }] = await Promise.all([
    supabaseAdmin.from("records").select("*, record_items(*)").eq("igreja_id", me.igreja_id),
    supabaseAdmin.from("lancamentos").select("*").eq("igreja_id", me.igreja_id),
    supabaseAdmin.from("financas").select("*").eq("igreja_id", me.igreja_id).maybeSingle(),
  ]);

  let rows = computeLedgerRealizado(records, lancamentos, financas);
  if (de) rows = rows.filter((r) => r.data >= de);
  if (ate) rows = rows.filter((r) => r.data <= ate);

  if (formato === "json") {
    return Response.json({ rows: ledgerToExportRows(rows, church.nome) });
  }

  const totalEntradas = rows.filter((r) => r.tipo === "entrada").reduce((s, r) => s + r.valor, 0);
  const totalSaidas = rows.filter((r) => r.tipo === "saida").reduce((s, r) => s + r.valor, 0);

  // NOVO: Entradas por categoria (Dízimos / Ofertas) com %
  const categoriasEntrada = {};
  rows.filter((r) => r.tipo === "entrada").forEach((r) => {
    const cat = r.categoria || "Sem categoria";
    categoriasEntrada[cat] = (categoriasEntrada[cat] || 0) + r.valor;
  });

  const categoriasSaida = {};
  rows.filter((r) => r.tipo === "saida").forEach((r) => {
    const cat = r.categoria || "Sem categoria";
    categoriasSaida[cat] = (categoriasSaida[cat] || 0) + r.valor;
  });

  const periodo = de || ate? `Período: ${de? fmtDate(de) : "início"} a ${ate? fmtDate(ate) : "hoje"}` : "Período completo";

  const bytes = await buildBalancetePDF({
    church,
    saldoInicial: financas,
    totalEntradas,
    totalSaidas,
    categoriasEntrada, // <- NOVO
    categoriasSaida,
    periodo,
    me
  });
  return new Response(bytes, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="balancete.pdf"` },
  });
}
