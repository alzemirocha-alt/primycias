import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { officeLabel, formatCPF, fmtDate, fmtDateTime } from "@/lib/constants";
import PerfilFoto from "./PerfilFoto";
import PerfilForm from "./PerfilForm";

export default async function PerfilPage() {
  const me = await getSessionUser();
  const { data: historico } = await supabaseAdmin
    .from("password_history")
    .select("*")
    .eq("user_id", me.id)
    .order("created_at", { ascending: false });

  // Regra: quem pode alterar mandato e CPF
  const oficio = (me.oficio || '').toLowerCase();
  const isPastor = oficio === 'pastor' || me.nome?.toLowerCase().includes('glaucio');
  const isSecretario = oficio === 'secretario' || (me.funcao||'').toLowerCase().includes('secretario') || me.nome?.toLowerCase().includes('alzemir');
  const podeAlterarRestrito = isPastor || isSecretario;

  return (
    <div>
      <h2 className="text-xl font-serif text-ink mb-1">Meus dados</h2>
      <p className="text-xs text-gray-500 mb-5">Suas informações de cadastro.</p>

      <div className="bg-white border border-line rounded-sm p-4 mb-4 flex items-center gap-4">
        <PerfilFoto foto={me.foto} />
        <div>
          <div className="text-sm font-medium">{me.nome}</div>
          <div className="text-xs text-gray-500">{officeLabel(me)}</div>
        </div>
      </div>

      {/* NOVO FORMULÁRIO EDITÁVEL */}
      <PerfilForm me={me} podeAlterarRestrito={podeAlterarRestrito} />

      {me.oficio !== "membro" && (
        <div className="bg-white border border-line rounded-sm p-4 mb-4 text-sm space-y-1">
          <div className="font-medium text-ink mb-1">Meu mandato</div>
          <div><b>Data de instalação:</b> {me.data_instalacao ? fmtDate(me.data_instalacao) : "—"}</div>
          <div><b>Vencimento:</b> {me.data_vencimento_mandato ? fmtDate(me.data_vencimento_mandato) : "Não informado"}</div>
        </div>
      )}

      {historico?.length > 0 && (
        <div className="bg-white border border-line rounded-sm p-4 text-xs mt-4">
          <div className="font-medium text-ink mb-2 text-sm">Histórico de senha</div>
          {historico.map((h) => (
            <div key={h.id} className="text-gray-600 py-1 border-b border-paperDeep">
              {h.acao} — por {h.por_nome} em {fmtDateTime(h.created_at)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
