import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildReciboDizimistaPDF } from "@/lib/pdf";
import { canAccessTesouraria, fmtDate } from "@/lib/constants";

export async function GET(request) {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);
  if (!canAccessTesouraria(me, church)) return new Response("Não autorizado", { status: 403 });

  const { searchParams } = new URL(request.url);
  const nome = (searchParams.get("nome") || "").trim();
  const de = searchParams.get("de") || "";
  const ate = searchParams.get("ate") || "";
  if (!nome) return new Response("Informe o nome do dizimista", { status: 400 });

  // CORREÇÃO 1: busca direto em records com ilike %nome% pra pegar "Marcondes " com espaço
  // CORREÇÃO 2: traz dízimo + oferta pra fechar com o título novo
  let query = supabaseAdmin
    .from("records")
    .select("membro_nome, tipo, valor, data_culto")
    .eq("igreja_id", me.igreja_id)
    .eq("status", "validado")
    .ilike("membro_nome", `%${nome}%`);
    
  if (de) query = query.gte("data_culto", de);
  if (ate) query = query.lte("data_culto", ate);
  
  const { data: records, error } = await query.order("data_culto", { ascending: true });
  if (error) return new Response("Erro ao buscar: " + error.message, { status: 500 });

  // Antes: flatMap record_items + i.nome === nome (que zerava)
  // Agora: direto de records
  const itens = (records || []).map((r) => ({ 
    data: r.data_culto, 
    valor: Number(r.valor), 
    tipo: r.tipo 
  })).sort((a, b) => (a.data < b.data ? -1 : 1));

  let tesoureiro = null;
  if (church.tesoureiro_user_id) {
    const { data } = await supabaseAdmin.from("users").select("nome").eq("id", church.tesoureiro_user_id).maybeSingle();
    tesoureiro = data;
  }

  const periodo = de || ate ? `Período: ${de ? fmtDate(de) : "início"} a ${ate ? fmtDate(ate) : "hoje"}` : "Período completo";

  const bytes = await buildReciboDizimistaPDF({ 
    church, 
    nomeDizimista: nome, 
    itens, 
    periodo, 
    tesoureiro, 
    me,
    titulo: "Recibo de Dízimos e Ofertas" // CORREÇÃO 3: passa título novo
  });
  
  return new Response(bytes, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="recibo-dizimos-ofertas-${nome}.pdf"` },
  });
}
