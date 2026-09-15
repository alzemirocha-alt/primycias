import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Não autenticado", { status: 401 });
  const body = await req.json();

  // FIX: seu CHECK só aceita texto, imagem, link, video - mapeia automaticamente
  let tipoFinal = "texto";
  if (body.imagem_url) tipoFinal = "imagem";
  else if (body.video_url) tipoFinal = "video";
  else if (body.link_url) tipoFinal = "link";
  else if (body.tipo && ["texto","imagem","link","video"].includes(body.tipo)) tipoFinal = body.tipo;

  // Monta payload compatível com qualquer nome de coluna que sua tabela tiver
  const payload = {
    igreja_id: user.igreja_id,
    tipo: tipoFinal,
    titulo: body.titulo,
    mensagem: body.mensagem,
    conteudo: body.mensagem,
    imagem_url: body.imagem_url || null,
    video_url: body.video_url || null,
    link_url: body.link_url || null,
    arquivo_url: body.arquivo_url || null,
    data_evento: body.data_evento || null,
    autor_id: user.id,
    user_id: user.id,
    created_by: user.id,
  };

  const { data, error } = await supabaseAdmin.from("avisos").insert(payload).select().single();
  if (error) return new NextResponse(error.message, { status: 400 });

  if (body.integrar_calendario && body.data_evento) {
    await supabaseAdmin.from("eventos").insert({
      igreja_id: user.igreja_id,
      titulo: body.titulo,
      descricao: body.mensagem,
      data_evento: body.data_evento,
      criado_por: user.id
    });
  }
  return NextResponse.json(data);
}

export async function DELETE(req) {
  const user = await getSessionUser();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  await supabaseAdmin.from("avisos").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}

export async function PUT(req) {
  const user = await getSessionUser();
  const body = await req.json();

  // FIX também na edição
  let tipoFinal = "texto";
  if (body.imagem_url) tipoFinal = "imagem";
  else if (body.video_url) tipoFinal = "video";
  else if (body.link_url) tipoFinal = "link";
  else if (body.tipo && ["texto","imagem","link","video"].includes(body.tipo)) tipoFinal = body.tipo;

  const { data, error } = await supabaseAdmin.from("avisos").update({
    tipo: tipoFinal,
    titulo: body.titulo,
    mensagem: body.mensagem,
    conteudo: body.mensagem,
    imagem_url: body.imagem_url,
    video_url: body.video_url,
    link_url: body.link_url,
    arquivo_url: body.arquivo_url,
    data_evento: body.data_evento,
  }).eq("id", body.id).select().single();
  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json(data);
}
