import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Não autenticado", { status: 401 });

  const body = await req.json();
  const { titulo, mensagem, imagem_url, video_url, link_url, data_evento, integrar_calendario } = body;

  const { data, error } = await supabaseAdmin.from("avisos").insert({
    igreja_id: user.igreja_id,
    autor_id: user.id,
    titulo, mensagem, imagem_url, video_url, link_url, data_evento
  }).select().single();

  if (error) return new NextResponse(error.message, { status: 400 });

  // INTEGRA COM AGENDA
  if (integrar_calendario && data_evento) {
    await supabaseAdmin.from("eventos").insert({
      igreja_id: user.igreja_id,
      titulo: titulo,
      descricao: mensagem,
      data_evento: data_evento,
      criado_por: user.id
    });
  }

  return NextResponse.json(data);
}
