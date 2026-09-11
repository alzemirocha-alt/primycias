import { redirect } from "next/navigation";
import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { canAccessTesouraria, isMaster, isTreasurer, today } from "@/lib/constants";
import { computeLedgerRealizado } from "@/lib/ledger";
import { TODAS_CATEGORIAS, realizadoPorCategoriaNoAno, realizadoMensalNoAno } from "@/lib/orcamento";
import OrcamentoClient from "./OrcamentoClient";

export default async function OrcamentoAnualPage({ params, searchParams }) {
  const me = await getSessionUser();
  if (params.id !== me.igreja_id) redirect("/dashboard");

  const church = await getChurch(me.igreja_id);
  if (!canAccessTesouraria(me, church)) redirect("/dashboard");

  const canEdit = isMaster(me) || isTreasurer(me, church);
  const ano = Number(searchParams?.ano) || Number(today().slice(0, 4));

  const [{ data: records }, { data: lancamentos }, { data: financas }, { data: orcamentoRows }] = await Promise.all([
    supabaseAdmin.from("records").select("*, record_items(*)").eq("igreja_id", me.igreja_id),
    supabaseAdmin.from("lancamentos").select("*").eq("igreja_id", me.igreja_id),
    supabaseAdmin.from("financas").select("*").eq("igreja_id", me.igreja_id).maybeSingle(),
    supabaseAdmin.from("orcamento_anual").select("*").eq("igreja_id", me.igreja_id).eq("ano", ano),
  ]);

  const ledger = computeLedgerRealizado(records, lancamentos, financas);
  const realizadoPorCategoria = realizadoPorCategoriaNoAno(ledger, ano);
  const mensal = realizadoMensalNoAno(ledger, ano);

  // Mantém valor_realizado sincronizado na tabela (relatório automático).
  const existentesPorCategoria = Object.fromEntries((orcamentoRows || []).map((r) => [r.categoria, r]));
  for (const cat of TODAS_CATEGORIAS) {
    const realizado = realizadoPorCategoria[cat] || 0;
    const existente = existentesPorCategoria[cat];
    if (existente) {
      if (Number(existente.valor_realizado) !== realizado) {
        await supabaseAdmin.from("orcamento_anual").update({ valor_realizado: realizado }).eq("id", existente.id);
      }
    } else if (realizado !== 0) {
      await supabaseAdmin
        .from("orcamento_anual")
        .insert({ igreja_id: me.igreja_id, ano, categoria: cat, valor_previsto: 0, valor_realizado: realizado });
    }
  }

  const { data: linhasAtualizadas } = await supabaseAdmin
    .from("orcamento_anual")
    .select("*")
    .eq("igreja_id", me.igreja_id)
    .eq("ano", ano);

  const linhasPorCategoria = Object.fromEntries((linhasAtualizadas || []).map((r) => [r.categoria, r]));
  const categorias = TODAS_CATEGORIAS.map((cat) => ({
    categoria: cat,
    valor_previsto: Number(linhasPorCategoria[cat]?.valor_previsto) || 0,
    valor_realizado: Number(linhasPorCategoria[cat]?.valor_realizado) || realizadoPorCategoria[cat] || 0,
  }));

  return (
    <OrcamentoClient
      igrejaId={me.igreja_id}
      ano={ano}
      categorias={categorias}
      mensal={mensal}
      canEdit={canEdit}
    />
  );
}
