import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import FormNovoRegistro from "./FormNovoRegistro";
export const dynamic = 'force-dynamic';

export default async function Page(){
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);
  const { data: diaconos } = await supabaseAdmin.from("users").select("id, nome").eq("igreja_id", me.igreja_id).eq("oficio","diacono").neq("id", me.id).neq("id", church.tesoureiro_user_id);
  return <FormNovoRegistro diaconos={diaconos || []} />;
}
