export const dynamic = 'force-dynamic'
export const revalidate = 0

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

  const oficio = (user.oficio || '').toLowerCase()
  const funcao = (user.funcao || '').toLowerCase()
  const nome = (user.nome || '').toLowerCase()
  const isPresbitero = oficio === 'presbitero' || nome.includes('alzemir') || nome.includes('jairo magero') || nome.includes('nilo da silva')
  const isPastor = oficio === 'pastor' || nome.includes('glaucio')
  const isTesoureiro = isTreasurer(user, church) || funcao === 'tesoureiro'

  const podeVerFinanceiro = isPresbitero || isPastor || isTesoureiro;

  let resumoFinanceiro = null;
  if (podeVerFinanceiro) {
    const [{ data: recordsRaw }, { data: lancamentosRaw }, { data: financas }] = await Promise.all([
      supabaseAdmin.from("records").select("id, valor, data_culto, status, tipo, igreja_id, record_items(valor)").eq("igreja_id", igrejaId),
      supabaseAdmin.from("lancamentos").select("*").eq("igreja_id", igrejaId),
      supabaseAdmin.from("financas").select("*").eq("igreja_id", igrejaId).maybeSingle(),
    ]);

    const getValor = (r) => Number(r.valor||0) || (r.record_items||[]).reduce((s,i)=>s+Number(i.valor||0),0)

    const records = (recordsRaw||[]).filter(r=>{
      const s = String(r.status||'').toLowerCase().trim()
      if(s === 'excluido' || s === 'apagado' || s === 'cancelado') return false
      return s === 'validado'
    })

    const lancamentos = (lancamentosRaw||[]).filter(l=>{
      const s = String(l.status||'').toLowerCase()
      return s!== 'excluido' && s!== 'apagado' && s!== 'cancelado'
    })

    const mesAtual = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Recife' }).slice(0, 7);
    const inicioMes = mesAtual + '-01'

    const entradasDizimosOfertasMes = records.filter(r=>{
      const d = String(r.data_culto||'')
      return d >= inicioMes
    }).reduce((s,r)=> s + getValor(r), 0)

    const entradasTesourariaMes = lancamentos.filter(l=>{
      const d = String(l.data||l.data_lancamento||'')
      const tipo = String(l.tipo||'').toLowerCase()
      return d >= inicioMes && (tipo.includes('entrada') || tipo === 'credito')
    }).reduce((s,l)=> s + Number(l.valor||0), 0)

    const saidasMes = lancamentos.filter(l=>{
      const d = String(l.data||l.data_lancamento||'')
      const tipo = String(l.tipo||'').toLowerCase()
      return d >= inicioMes && (tipo.includes('saida') || tipo === 'debito' || tipo === 'despesa')
    }).reduce((s,l)=> s + Number(l.valor||0), 0)

    const entradasMes = entradasDizimosOfertasMes + entradasTesourariaMes

    const entradasAnteriores = records.filter(r=> String(r.data_culto||'') < inicioMes).reduce((s,r)=>s+getValor(r),0)
    const entradasTesAnteriores = lancamentos.filter(l=> String(l.data||l.data_lancamento||'') < inicioMes && String(l.tipo||'').toLowerCase().includes('entrada')).reduce((s,l)=>s+Number(l.valor||0),0)
    const saidasAnteriores = lancamentos.filter(l=> String(l.data||l.data_lancamento||'') < inicioMes && String(l.tipo||'').toLowerCase().includes('saida')).reduce((s,l)=>s+Number(l.valor||0),0)

    const saldoInicial = Number(financas?.saldo_inicial_valor || financas?.saldo_inicial || 0)
    const saldoMesAnterior = saldoInicial + entradasAnteriores + entradasTesAnteriores - saidasAnteriores

    try {
      const { data: allRecords } = await supabaseAdmin.from("records").select("*, record_items(*)").eq("igreja_id", igrejaId)
      const ledger = computeLedgerRealizado(allRecords, lancamentosRaw, financas);
    } catch {}

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
            href={`/registros/editar/${r.data_culto}`}
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
