import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import CalendarClient from "./CalendarClient";

export default async function CalendarioPage() {
  const me = await getSessionUser();
  const { data: events } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("igreja_id", me.igreja_id)
    .or(`visibilidade.eq.todos,criado_por.eq.${me.id}`)
    .order("data");

  return <CalendarClient me={me} events={events || []} />;
}
