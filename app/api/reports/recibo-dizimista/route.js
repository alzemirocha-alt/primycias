import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildReciboDizimistaPDF } from "@/lib/pdf";
import { canAccessTesouraria, fmtDate } from "@/lib/constants";

export async function GET(request) {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);
  if (!canAccessTesouraria(me, church)) return new Response("Não autorizado", { status: 403 });

  const { searchParams } = new URL(request.url);
  const nome = searchParams.get("nome") || "";
  const de = searchParams.get("de") || "";
  const ate = searchParams.get("ate") || "";
  if (!nome) return new Response("Informe o nome do dizimista", { status: 400 });

  let query = supabaseAdmin.from("records").select("*, record_items(*)").eq("igreja_id", me.igreja_id).eq("status", "validado");
  if (de) query = query.gte("data_culto", de);
  if (ate) query = query.lte("data_culto", ate);
  const { data: records } = await query;

  const itens = (records || [])
    .flatMap((r) => (r.record_items || []).filter((i) => i.tipo === "dizimo" && i.nome === nome).map((i) => ({ data: r.data_culto, valor: i.valor })))
    .sort((a, b) => (a.data < b.data ? -1 : 1));

  let tesoureiro = null;
  if (church.tesoureiro_user_id) {
    const { data } = await supabaseAdmin.from("users").select("nome").eq("id", church.tesoureiro_user_id).maybeSingle();
    tesoureiro = data;
  }

  const periodo = de || ate ? `Período: ${de ? fmtDate(de) : "início"} a ${ate ? fmtDate(ate) : "hoje"}` : "Período completo";

  const bytes = await buildReciboDizimistaPDF({ church, nomeDizimista: nome, itens, periodo, tesoureiro, me });
  return new Response(bytes, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="recibo-dizimista-${nome}.pdf"` },
  });
}
