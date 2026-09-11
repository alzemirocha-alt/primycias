"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function atualizarMinhaFotoAction(foto) {
  const me = await getSessionUser();
  await supabaseAdmin.from("users").update({ foto }).eq("id", me.id);
  revalidatePath("/perfil");
}
