import { notFound, redirect } from "next/navigation";
import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin, isTreasurer } from "@/lib/constants";
import RecordDetailClient from "./RecordDetailClient";

export default async function RegistroDetailPage({ params }) {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);

  const { data: record } = await supabaseAdmin
    .from("records")
    .select("*, record_items(*), diacono:diacono_id(nome, cpf)")
    .eq("id", params.id)
    .eq("igreja_id", me.igreja_id)
    .maybeSingle();
  if (!record) notFound();

  const podeVer = isAdmin(me) || isTreasurer(me, church) || record.diacono_id === me.id;
  if (!podeVer) redirect("/registros");

  const { data: aprovacoes } = await supabaseAdmin
    .from("record_approvals")
    .select("*")
    .eq("record_id", record.id)
    .order("created_at", { ascending: true });

  const { data: errorReport } = await supabaseAdmin
    .from("error_reports")
    .select("*")
    .eq("record_id", record.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <RecordDetailClient
      me={me}
      church={church}
      record={record}
      aprovacoes={aprovacoes || []}
      errorReport={errorReport}
    />
  );
}
