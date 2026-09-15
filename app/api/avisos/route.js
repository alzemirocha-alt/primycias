import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/constants";

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Não autenticado", { status: 401 });

  // Trava: Pastor e Secretário do Conselho nos mesmos moldes
  if (!isAdmin(user)) {
    const oficio = (user.oficio||"").toLowerCase();
    const funcao = (user.funcao||user.funcao_presbitero||"").toLowerCase();
    const pode = oficio === "pastor" || funcao.includes("secret");
    if (!pode) return new NextResponse("Apenas Pastor e Secretário podem publicar", { status: 403 });
  }

  const body = await req.json();

  // FIX DO ERRO DO PRINT: tipo nunca mais null
  const tipo = String(body.tipo || "lideranca").trim() || "lideranca";

  // Monta payload compatível com qualquer nome de coluna que sua tabela tiver - preservado + tipo
  const payload = {
    igreja_id: user.igreja_id,
    tipo, // << CORREÇÃO
    titulo: body.titulo,
    mensagem: body.mensagem,
    conteudo: body.mensagem || body.conteudo,
    imagem_url: body.imagem_url || null,
    video_url: body.video_url || body.link_youtube || null,
    link_url: body.link_url || body.link_externo || null,
    arquivo_url: body.arquivo_url || null,
    // compatibilidade com colunas antigas e novas
    link_youtube: body.video_url || body.link_youtube || null,
    link_externo: body.link_url || body.link_externo || null,
    data_evento: body.data_evento || null,
    autor_id: user.id,
    user_id: user.id,
    created_by: user.id,
    criado_por: user.id,
    criado_por_nome: user.nome,
    autor_nome: user.nome,
  };

  const { data, error } = await supabaseAdmin.from("avisos").insert(payload).select().single();
  if (error) return new NextResponse(error.message, { status: 400 });

  if ((body.integrar_calendario || body.integrar_com_agenda) && body.data_evento) {
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
  if (!user) return new NextResponse("Não autenticado", { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  await supabaseAdmin.from("avisos").delete().eq("id", id).eq("igreja_id", user.igreja_id);
  return NextResponse.json({ ok: true });
}

export async function PUT(req) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Não autenticado", { status: 401 });
  const body = await req.json();
  const { data, error } = await supabaseAdmin.from("avisos").update({
    tipo: String(body.tipo || "lideranca").trim() || "lideranca",
    titulo: body.titulo,
    mensagem: body.mensagem,
    conteudo: body.mensagem || body.conteudo,
    imagem_url: body.imagem_url,
    video_url: body.video_url || body.link_youtube,
    link_url: body.link_url || body.link_externo,
    arquivo_url: body.arquivo_url,
    link_youtube: body.video_url || body.link_youtube,
    link_externo: body.link_url || body.link_externo,
    data_evento: body.data_evento,
  }).eq("id", body.id).eq("igreja_id", user.igreja_id).select().single();
  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json(data);
}
