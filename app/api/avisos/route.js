import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Não autenticado", { status: 401 });
  const body = await req.json();

  let tipoFinal = "texto";
  if (body.imagem_url) tipoFinal = "imagem";
  else if (body.video_url) tipoFinal = "video";
  else if (body.link_url) tipoFinal = "link";
  else if (body.tipo && ["texto","imagem","link","video"].includes(body.tipo)) tipoFinal = body.tipo;

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

  // INTEGRAÇÃO COM AGENDA (tabela events) - CORRIGIDO
  if ((body.integrar_calendario || body.integrar_com_agenda) && body.data_evento) {
    try {
      // body.data_evento vem como "2026-05-20T19:00:00" - separa data e hora
      const dt = new Date(body.data_evento);
      const data = body.data_evento.slice(0,10); // YYYY-MM-DD
      const hora = body.data_evento.includes("T") ? body.data_evento.slice(11,16) : "19:00";

      // Tabela principal usada no dashboard/calendario
      await supabaseAdmin.from("events").insert({
        igreja_id: user.igreja_id,
        titulo: body.titulo,
        descricao: body.mensagem,
        data: data,
        hora: hora,
        visibilidade: "todos",
        criado_por: user.id
      });

      // Mantém compatibilidade com tabela eventos antiga se existir
      await supabaseAdmin.from("eventos").insert({
        igreja_id: user.igreja_id,
        titulo: body.titulo,
        descricao: body.mensagem,
        data_evento: body.data_evento,
        criado_por: user.id
      });
    } catch (e) {
      console.error("Erro ao integrar com agenda:", e);
      // não bloqueia o aviso se falhar a agenda
    }
  }
  return NextResponse.json(data);
}

export async function DELETE(req) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Não autenticado", { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  await supabaseAdmin.from("avisos").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}

export async function PUT(req) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Não autenticado", { status: 401 });
  const body = await req.json();

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
