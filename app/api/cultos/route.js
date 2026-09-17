import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req) {
  const me = await getSessionUser();
  const { igreja_id, data, periodo } = await req.json();

  if (me.igreja_id !== igreja_id) {
    return NextResponse.json({ error: "Igreja inválida" }, { status: 403 });
  }

  const { data: culto, error } = await supabaseAdmin
    .from("cultos")
    .insert({ igreja_id, data, periodo, status: "aberto" })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: `Já existe culto de ${periodo} em ${data}` }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ culto });
}

export async function GET(req) {
  const me = await getSessionUser();
  const { searchParams } = new URL(req.url);
  const data = searchParams.get("data");

  let query = supabaseAdmin.from("cultos").select("*").eq("igreja_id", me.igreja_id).order("data", { ascending: false });
  if (data) query = query.eq("data", data);

  const { data: cultos } = await query.limit(20);
  return NextResponse.json({ cultos: cultos || [] });
}
