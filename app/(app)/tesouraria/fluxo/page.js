import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { computeLedgerRealizado } from "@/lib/ledger";
import FluxoClient from "./FluxoClient";

export default async function FluxoPage() {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);

  const [{ data: records }, { data: lancamentos }, { data: financas }] = await Promise.all([
    supabaseAdmin.from("records").select("*, record_items(*)").eq("igreja_id", me.igreja_id),
    supabaseAdmin.from("lancamentos").select("*").eq("igreja_id", me.igreja_id),
    supabaseAdmin.from("financas").select("*").eq("igreja_id", me.igreja_id).maybeSingle(),
  ]);

  const ledger = computeLedgerRealizado(records, lancamentos, financas);

  return <FluxoClient me={me} financas={financas} ledger={ledger} />;
}
