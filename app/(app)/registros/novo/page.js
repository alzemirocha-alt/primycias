import { criarRegistroAction } from "../actions";
import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import NovoRegistroForm from "./NovoRegistroForm";

export default async function NovoPage() {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);

  // 1. Busca todos os diáconos da igreja que NÃO são tesoureiro
  const { data: todosDiaconos } = await supabaseAdmin
   .from("profiles")
   .select("id, nome_completo, is_tesoureiro, oficio")
   .eq("igreja_id", me.igreja_id)
   .eq("oficio", "diacono");

  // 2. Pega o último culto para saber quem foi (rodízio)
  const { data: ultimo } = await supabaseAdmin
   .from("records")
   .select("diacono_id, segundo_diacono_id")
   .eq("igreja_id", me.igreja_id)
   .order("created_at", { ascending: false })
   .limit(1)
   .maybeSingle();

  const idsUltimoCulto = ultimo? [ultimo.diacono_id, ultimo.segundo_diacono_id].filter(Boolean) : [];

  // 3. Filtra: tira tesoureiro, tira quem está logado, tira quem foi no último culto
  let elegiveis = (todosDiaconos || []).filter(d => {
    const isTesoureiro = d.is_tesoureiro === true || church?.tesoureiro_id === d.id;
    const foiUltimoCulto = idsUltimoCulto.includes(d.id);
    const souEu = d.id === me.id;
    return!isTesoureiro &&!foiUltimoCulto &&!souEu;
  });

  // Se for pastor, mostra todos (para quebrar rodízio)
  const isPastor = me.oficio === "pastor";
  if (isPastor && elegiveis.length === 0) {
    elegiveis = (todosDiaconos || []).filter(d => d.id!== me.id);
  }

  return <NovoRegistroForm diaconos={elegiveis} isPastor={isPastor} />;
}
