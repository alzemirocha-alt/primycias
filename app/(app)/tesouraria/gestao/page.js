import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { computeLedgerRealizado } from "@/lib/ledger";
import GestaoCharts from "./GestaoCharts";

export default async function GestaoPage() {
  const me = await getSessionUser();
  const [{ data: records }, { data: lancamentos }, { data: financas }, { data: cultos }] = await Promise.all([
    supabaseAdmin.from("records").select("*, record_items(*), cultos(data, periodo, status)").eq("igreja_id", me.igreja_id),
    supabaseAdmin.from("lancamentos").select("*").eq("igreja_id", me.igreja_id),
    supabaseAdmin.from("financas").select("*").eq("igreja_id", me.igreja_id).maybeSingle(),
    supabaseAdmin.from("cultos").select("*").eq("igreja_id", me.igreja_id).order("data", { ascending: false }).limit(50),
  ]);

  const ledger = computeLedgerRealizado(records, lancamentos, financas);
  return <GestaoCharts ledger={ledger} cultos={cultos || []} />;
}
