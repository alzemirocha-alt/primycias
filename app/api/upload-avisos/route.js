import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
export async function POST(req) {
  const form = await req.formData();
  const file = form.get("file");
  const bytes = await file.arrayBuffer();
  const name = `${Date.now()}-${file.name}`;
  await supabaseAdmin.storage.from("avisos").upload(name, Buffer.from(bytes), { contentType: file.type, upsert: true });
  const { data } = supabaseAdmin.storage.from("avisos").getPublicUrl(name);
  return NextResponse.json({ url: data.publicUrl });
}
