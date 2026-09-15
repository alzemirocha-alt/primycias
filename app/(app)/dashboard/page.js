import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin, isTreasurer, isRestrictedFinanceiro, officeLabel, STATUS_LABEL, fmtDate, brl, today } from "@/lib/constants";
import { computeLedgerRealizado } from "@/lib/ledger";
import Link from "next/link";
import LeadershipBoards from "@/components/LeadershipBoards";
import BirthdayBanners from "@/components/BirthdayBanners";
import AvisosBoard from "./AvisosBoard";

export default async function DashboardPage() {
  const user = await getSessionUser();
  const church = await getChurch(user.igreja_id);
  const igrejaId = user.igreja_id;

  const [
    { count: pendentesUsuarios },
    { count: pendentesSenha },
    { data: registrosAbertos },
    { data: users },
    { data: avisos },
  ] = await Promise.all([
    isAdmin(user)
     ? supabaseAdmin.from("users").select("id", { count: "exact", head: true }).eq("igreja_id", igrejaId).eq("status", "pendente")
      : Promise.resolve({ count: 0 }),
    isAdmin(user)
     ? supabaseAdmin.from("password_reset_requests").select("id", { count: "exact", head: true }).eq("igreja_id", igrejaId).eq("status", "pendente")
      : Promise.resolve({ count: 0 }),
    supabaseAdmin.from("records").select("id, data_culto, status").eq("igreja_id", igrejaId).neq("status", "validado").order("data_culto", { ascending: false }),
    supabaseAdmin.from("users").select("*").eq("igreja_id", igrejaId),
    supabaseAdmin.from("avisos").select("*").eq("igreja_id", igrejaId).order("created_at", { ascending: false }).limit(10),
  ]);

  // === REGRA ATUALIZADA: PRESBÍTERO + TESOUREIRO + PASTOR VÊEM RESUMO ===
  const oficio = (user.oficio || '').toLowerCase()
  const funcao = (user.funcao || '').toLowerCase()
  const nome = (user.nome || '').toLowerCase()
  const isPresbitero = oficio === 'presbitero' || nome.includes('alzemir') || nome.includes('jairo magero') || nome.includes('nilo da silva')
  const isPastor = oficio === 'pastor' || nome.includes('glaucio')
  const isTesoureiro = isTreasurer(user, church) || funcao === 'tesoureiro'

  const podeVerFinanceiro = isPresbitero || isPastor || isTesoureiro;

  let resumoFinanceiro = null;
  if (podeVerFinanceiro) {
    const [{ data: records }, { data: lancamentos }, { data: financas }] = await Promise.all([
      supabaseAdmin.from("records").select("id, valor, data_culto, status, tipo").eq("igreja_id", igrejaId).eq("status","validado"),
      supabaseAdmin.from("lancamentos").select("*").eq("igreja_id", igrejaId),
      supabaseAdmin.from("financas").select("*").eq("igreja_id", igrejaId).maybeSingle(),
    ]);

    const mesAtual = today().slice(0, 7); // YYYY-MM

    // --- CORREÇÃO: ENTRADAS DIRETO DOS DÍZIMOS/OFERTAS VALIDADOS DO MÊS ---
    const entradasDizimosOfertasMes = (records||[]).filter(r=>{
      const d = (r.data_culto||'').slice(0,7)
      return d === mesAtual
    }).reduce((s,r)=> s + Number(r.valor||0), 0)

    const entradasTesourariaMes = (lancamentos||[]).filter(l=>{
      const d = (l.data||l.data_lancamento||'').slice(0,7)
      const tipo = String(l.tipo||'').toLowerCase()
      return d === mesAtual && tipo.includes('entrada')
    }).reduce((s,l)=> s + Number(l.valor||0), 0)

    const saidasMes = (lancamentos||[]).filter(l=>{
      const d = (l.data||l.data_lancamento||'').slice(0,7)
      const tipo = String(l.tipo||'').toLowerCase()
      return d === mesAtual && tipo.includes('saida')
    }).reduce((s,l)=> s + Number(l.valor||0), 0)

    const entradasMes = entradasDizimosOfertasMes + entradasTesourariaMes

    // SALDO ANTERIOR: saldo inicial + tudo antes deste mês
    const entradasAnteriores = (records||[]).filter(r=> (r.data_culto||'').slice(0,7) < mesAtual).reduce((s,r)=>s+Number(r.valor||0),0)
    const entradasTesAnteriores = (lancamentos||[]).filter(l=>{
      const tipo = String(l.tipo||'').toLowerCase()
      return (l.data||l.data_lancamento||'').slice(0,7) < mesAtual && tipo.includes('entrada')
    }).reduce((s,l)=>s+Number(l.valor||0),0)
    const saidasAnteriores = (lancamentos||[]).filter(l=>{
      const tipo = String(l.tipo||'').toLowerCase()
      return (l.data||l.data_lancamento||'').slice(0,7) < mesAtual && tipo.includes('saida')
    }).reduce((s,l)=>s+Number(l.valor||0),0)

    const saldoInicial = Number(financas?.saldo_inicial_valor || financas?.saldo_inicial || 0)
    const saldoMesAnterior = saldoInicial + entradasAnteriores + entradasTesAnteriores - saidasAnteriores

    resumoFinanceiro = { entradasMes, saidasMes, saldoAtual: saldoMesAnterior + entradasMes - saidasMes };
  }

  return (
    <div>
      <h2 className="text-xl font-serif text-ink mb-1">Início</h2>
      <p className="text-xs text-gray-500 mb-6">{officeLabel(user)} · {church.nome}</p>

      <BirthdayBanners me={user} users={users || []} />

      <div className="flex flex-wrap gap-3 mb-6">
        {isAdmin(user) && <StatCard label="Cadastros pendentes" value={pendentesUsuarios || 0} highlight={pendentesUsuarios > 0} />}
        {isAdmin(user) && <StatCard label="Solicitações de senha" value={pendentesSenha || 0} highlight={pendentesSenha > 0} />}
      </div>

      {resumoFinanceiro && (
        <div className="bg-white border border-line rounded-sm p-4 mb-6">
          <div className="text-sm font-medium text-ink mb-3">Resumo Financeiro do Mês</div>
          <div className="flex flex-wrap gap-3">
            <StatCard label="Entradas no mês" value={brl(resumoFinanceiro.entradasMes)} />
            <StatCard label="Saídas no mês" value={brl(resumoFinanceiro.saidasMes)} />
            <StatCard label="Saldo atual" value={brl(resumoFinanceiro.saldoAtual)} />
          </div>
        </div>
      )}

      <LeadershipBoards users={users || []} church={church} />

      <AvisosBoard me={user} avisos={avisos || []} />

      <div className="bg-white border border-line rounded-sm p-4">
        <div className="text-sm font-medium text-ink mb-3">Registros em aberto</div>
        {(!registrosAbertos || registrosAbertos.length === 0) && (
          <div className="text-sm text-gray-500">Nenhum registro em aberto no momento.</div>
        )}
        {registrosAbertos?.map((r) => (
          <Link
            key={r.id}
            href={`/registros/${r.id}`}
            className="flex items-center justify-between py-2 border-b border-paperDeep text-sm hover:opacity-80"
          >
            <span>Culto de {fmtDate(r.data_culto)}</span>
            <span className="text-xs text-gray-500">{STATUS_LABEL[r.status]}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div className="bg-white border border-line rounded-sm p-4 flex-1 min-w-[150px]">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-serif" style={{ color: highlight? "#8C3B3B" : "#1E5631" }}>{value}</div>
    </div>
  );
}
