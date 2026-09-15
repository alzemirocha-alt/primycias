import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { officeLabel, formatCPF, fmtDate, fmtDateTime } from "@/lib/constants";
import PerfilFoto from "./PerfilFoto";
import { atualizarMeusDadosAction, atualizarRestritoAction, alterarSenhaAction } from "./actions";

export default async function PerfilPage() {
  const me = await getSessionUser();
  const { data: historico } = await supabaseAdmin.from("password_history").select("*").eq("user_id", me.id).order("created_at", { ascending: false });
  const oficio = (me.oficio || '').toLowerCase();
  const podeAlterarRestrito = oficio === 'pastor' || oficio === 'secretario' || me.nome?.toLowerCase().includes('glaucio') || me.nome?.toLowerCase().includes('alzemir');

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

      <form action={atualizarMeusDadosAction} className="bg-white border border-line rounded-sm p-4 mb-4 space-y-3">
        <div className="text-sm font-medium text-ink">Alterar meus dados (liberado)</div>
        <div className="text-xs text-gray-600">Foto, Telefone, Endereço e CEP - usuário altera sozinho.</div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs">Telefone<input name="telefone" defaultValue={me.telefone||''} className="w-full border rounded p-2 mt-1 text-sm" placeholder="(81) 99999-9999" /></label>
          <label className="text-xs">CEP<input name="cep" defaultValue={me.cep||''} className="w-full border rounded p-2 mt-1 text-sm" placeholder="50000000" /></label>
        </div>
        <label className="text-xs">Endereço<input name="endereco" defaultValue={me.endereco||''} className="w-full border rounded p-2 mt-1 text-sm" placeholder="Rua, bairro, cidade/UF" /></label>
        <button className="bg-[#1E5631] text-white px-4 py-2 rounded text-sm">Salvar Telefone / Endereço / CEP</button>
      </form>

      <form action={atualizarRestritoAction} className="bg-white border border-line rounded-sm p-4 mb-4 space-y-3">
        <div className="text-sm font-medium text-ink">CPF e Mandato { !podeAlterarRestrito && <span className="text-xs text-gray-400 font-normal">(só Pastor ou Secretário)</span> }</div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs">CPF<input name="cpf" disabled={!podeAlterarRestrito} defaultValue={formatCPF(me.cpf)||me.cpf||''} className="w-full border rounded p-2 mt-1 text-sm disabled:bg-gray-100" /></label>
          <label className="text-xs">Mandato<input name="mandato" disabled={!podeAlterarRestrito} defaultValue={me.mandato||''} className="w-full border rounded p-2 mt-1 text-sm disabled:bg-gray-100" /></label>
        </div>
        {podeAlterarRestrito && <button className="bg-ink text-white px-4 py-2 rounded text-sm">Salvar CPF / Mandato</button>}
      </form>

      <form action={alterarSenhaAction} className="bg-white border border-line rounded-sm p-4 mb-4 space-y-3">
        <div className="text-sm font-medium text-ink">Alterar senha - 4 dígitos</div>
        <div className="text-xs text-gray-500">Confirma com a atual, digita a nova 2x. Não precisa aprovação. Mantém histórico.</div>
        <input name="senha_atual" type="password" maxLength={4} placeholder="Senha atual" className="w-full border rounded p-2 text-sm" required />
        <div className="grid grid-cols-2 gap-3">
          <input name="nova_senha" type="password" maxLength={4} placeholder="Nova senha" className="w-full border rounded p-2 text-sm" required />
          <input name="nova_senha2" type="password" maxLength={4} placeholder="Repita nova" className="w-full border rounded p-2 text-sm" required />
        </div>
        <button className="bg-black text-white px-4 py-2 rounded text-sm">Alterar Senha</button>
      </form>

      {me.oficio !== "membro" && (
        <div className="bg-white border border-line rounded-sm p-4 mb-4 text-sm space-y-1">
          <div className="font-medium text-ink mb-1">Meu mandato</div>
          <div><b>Data de instalação:</b> {me.data_instalacao ? fmtDate(me.data_instalacao) : "—"}</div>
          <div><b>Vencimento:</b> {me.data_vencimento_mandato ? fmtDate(me.data_vencimento_mandato) : "Não informado"}</div>
        </div>
      )}

      {historico?.length > 0 && (
        <div className="bg-white border border-line rounded-sm p-4 text-xs">
          <div className="font-medium text-ink mb-2 text-sm">Histórico de senha</div>
          {historico.map((h) => (
            <div key={h.id} className="text-gray-600 py-1 border-b border-paperDeep">{h.acao} — por {h.por_nome} em {fmtDateTime(h.created_at)}</div>
          ))}
        </div>
      )}
    </div>
  );
}
