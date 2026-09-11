import { getSessionUser, getChurch } from "@/lib/auth";
import { buildReciboPagamentoPDF } from "@/lib/pdf";
import { canAccessTesouraria } from "@/lib/constants";

export async function GET(request) {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);
  if (!canAccessTesouraria(me, church)) return new Response("Não autorizado", { status: 403 });

  const { searchParams } = new URL(request.url);
  const data = searchParams.get("data") || "";
  const historico = searchParams.get("historico") || "";
  const valor = Number(searchParams.get("valor") || 0);
  const recebedorNome = searchParams.get("recebedorNome") || "";
  const recebedorDoc = searchParams.get("recebedorDoc") || "";

  if (!data || !historico || !valor || !recebedorNome) {
    return new Response("Preencha todos os campos do recibo.", { status: 400 });
  }

  const bytes = await buildReciboPagamentoPDF({ church, data, historico, valor, recebedorNome, recebedorDoc, me });
  return new Response(bytes, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="recibo-pagamento-${data}.pdf"` },
  });
}
