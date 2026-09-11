import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/constants";
import LancamentosClient from "./LancamentosClient";

export default async function LancamentosPage() {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);

  const [{ data: lancamentos }, { data: solicitacoes }] = await Promise.all([
    supabaseAdmin.from("lancamentos").select("*, lancamento_eventos(*)").eq("igreja_id", me.igreja_id).order("data", { ascending: false }),
    isAdmin(me)
      ? supabaseAdmin.from("approval_requests").select("*").eq("igreja_id", me.igreja_id).eq("status", "pendente").order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <LancamentosClient me={me} church={church} lancamentos={lancamentos || []} solicitacoes={solicitacoes || []} />
  );
}
