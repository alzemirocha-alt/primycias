import { redirect } from "next/navigation";
import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/constants";
import UsersClient from "./UsersClient";

export default async function UsuariosPage() {
  const me = await getSessionUser();
  if (!isAdmin(me)) redirect("/dashboard");
  const church = await getChurch(me.igreja_id);

  const [{ data: users }, { data: resetRequests }] = await Promise.all([
    supabaseAdmin.from("users").select("*").eq("igreja_id", me.igreja_id).order("nome"),
    supabaseAdmin
      .from("password_reset_requests")
      .select("*, users(nome)")
      .eq("igreja_id", me.igreja_id)
      .eq("status", "pendente")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <UsersClient me={me} church={church} users={users || []} resetRequests={resetRequests || []} />
  );
}
