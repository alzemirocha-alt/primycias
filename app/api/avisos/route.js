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

  // INTEGRAÇÃO COM AGENDA (tabela events) - CORRIGIDO PARA SUA TABELA
  if ((body.integrar_calendario || body.integrar_com_agenda) && body.data_evento) {
    try {
      const dataStr = String(body.data_evento).slice(0,10); // YYYY-MM-DD
      const horaStr = String(body.data_evento).includes("T") ? String(body.data_evento).slice(11,16) : "19:00";

      // Seu events usa: igreja_id, data, titulo, criado_por, criado_por_nome, visibilidade, hora, data_evento
      // NÃO tem coluna descricao - por isso antes não integrava
      await supabaseAdmin.from("events").insert({
        igreja_id: user.igreja_id,
        data: dataStr,
        titulo: body.titulo,
        criado_por: user.id,
        criado_por_nome: user.nome,
        visibilidade: "todos",
        hora: horaStr,
        data_evento: new Date(`${dataStr}T${horaStr}:00-03:00`).toISOString(),
      });

      // Compatibilidade com tabela eventos antiga (se existir)
      try {
        await supabaseAdmin.from("eventos").insert({
          igreja_id: user.igreja_id,
          titulo: body.titulo,
          descricao: body.mensagem,
          data_evento: body.data_evento,
          criado_por: user.id
        });
      } catch {}
      
    } catch (e) {
      console.error("Erro ao integrar com agenda:", e);
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
