import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { canAccessTesouraria } from "@/lib/constants";
import { buildOrcamentoAnualPDF } from "@/lib/pdf";
import { TODAS_CATEGORIAS } from "@/lib/orcamento";

export async function GET(request) {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);
  if (!canAccessTesouraria(me, church)) return new Response("Não autorizado", { status: 403 });

  const { searchParams } = new URL(request.url);
  const ano = Number(searchParams.get("ano")) || new Date().getFullYear();
  const formato = searchParams.get("formato") || "pdf";

  const { data: rows } = await supabaseAdmin
    .from("orcamento_anual")
    .select("*")
    .eq("igreja_id", me.igreja_id)
    .eq("ano", ano);

  const porCategoria = Object.fromEntries((rows || []).map((r) => [r.categoria, r]));
  const categorias = TODAS_CATEGORIAS.map((cat) => ({
    categoria: cat,
    valor_previsto: Number(porCategoria[cat]?.valor_previsto) || 0,
    valor_realizado: Number(porCategoria[cat]?.valor_realizado) || 0,
  }));

  if (formato === "json") {
    return Response.json({
      rows: categorias.map((c) => ({
        Categoria: c.categoria,
        Previsto: c.valor_previsto,
        Realizado: c.valor_realizado,
        Diferença: c.valor_realizado - c.valor_previsto,
        Igreja: church.nome,
        Ano: ano,
      })),
    });
  }

  const bytes = await buildOrcamentoAnualPDF({ church, ano, categorias, me });
  return new Response(bytes, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="orcamento-anual-${ano}.pdf"` },
  });
}
