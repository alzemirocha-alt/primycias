export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getSessionUser, getChurch } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin, isTreasurer, officeLabel, brl } from "@/lib/constants";
import { computeLedgerRealizado } from "@/lib/ledger";
import LeadershipBoards from "@/components/LeadershipBoards";
import BirthdayBanners from "@/components/BirthdayBanners";
import BoasVindas from "@/components/BoasVindas";
import AvisosBoard from "./AvisosBoard";
import { revalidatePath } from "next/cache";

async function excluirAvisoAction(formData) {
  "use server"
  const id = formData.get("id");
  if (!id) return;
  await supabaseAdmin.from("avisos").delete().eq("id", id);
  revalidatePath("/dashboard");
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  const church = await getChurch(user.igreja_id);
  const igrejaId = user.igreja_id;
  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Recife' });

  const [
    { count: pendentesUsuarios },
    { count: pendentesSenha },
    { data: users },
    { data: avisos },
    { data: eventosHoje },
  ] = await Promise.all([
    isAdmin(user)
? supabaseAdmin.from("users").select("id", { count: "exact", head: true }).eq("igreja_id", igrejaId).eq("status", "pendente")
      : Promise.resolve({ count: 0 }),
    isAdmin(user)
? supabaseAdmin.from("password_reset_requests").select("id", { count: "exact", head: true }).eq("igreja_id", igrejaId).eq("status", "pendente")
      : Promise.resolve({ count: 0 }),
    supabaseAdmin.from("users").select("*").eq("igreja_id", igrejaId),
    supabaseAdmin.from("avisos").select("*").eq("igreja_id", igrejaId).order("created_at", { ascending: false }).limit(10),
    supabaseAdmin.from("events").select("*").eq("igreja_id", igrejaId).eq("data", hoje).or(`visibilidade.eq.todos,visibilidade.eq.conselho,criado_por.eq.${user.id}`).order("hora", { ascending: true }),
  ]);

  const oficio = (user.oficio || '').toLowerCase()
  const funcao = (user.funcao || '').toLowerCase()
  const funcaoPresb = (user.funcao_presbitero || '').toLowerCase()
  const nome = (user.nome || '').toLowerCase()
  const isPresbitero = oficio === 'presbitero' || funcaoPresb!== '' || nome.includes('alzemir') || nome.includes('jairo magero') || nome.includes('nilo da silva')
  const isPastor = oficio === 'pastor' || nome.includes('glaucio')
  const isTesoureiro = isTreasurer(user, church) || funcao === 'tesoureiro'
  const isSecretarioConselho = funcaoPresb === 'secretario_conselho'

  // PERMISSÃO NOVA: Pastor e Secretário do Conselho podem gerenciar comunicações
  const podeGerenciarComunicacao = isAdmin(user) || isPastor || isSecretarioConselho;

  const podeVerFinanceiro = isPresbitero || isPastor || isTesoureiro;

  // AJUSTE: só ofício/cargo, sem função
  const cargoSimples = (() => {
    const o = (user.oficio || '').trim();
    if (!o) return '';
    const lower = o.toLowerCase();
    if (lower === 'presbitero' || lower === 'presbítero') return 'Presbítero';
    if (lower === 'pastor') return 'Pastor';
    if (lower === 'diacono' || lower === 'diácono') return 'Diácono';
    return o.charAt(0).toUpperCase() + o.slice(1);
  })();

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

    const entradasDizimosOfertasMes = records.filter(r=> String(r.data_culto||'') < inicioMes? false : String(r.data_culto||'') >= inicioMes).reduce((s,r)=> s + getValor(r), 0)
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
      <p className="text-xs text-gray-500 mb-4">{officeLabel(user)} · {church.nome}</p>

      <BoasVindas nome={user.nome} cargo={cargoSimples} />
      <BirthdayBanners me={user} users={users || []} />

      {/* 1. TOPO: COMUNICAÇÕES PUBLICADAS - AGORA COM EDITAR/EXCLUIR PARA PASTOR E SECRETÁRIO */}
      {avisos && avisos.length > 0 && (
        <div className="bg-white border border-line rounded-sm p-4 mb-6">
          <div className="text-sm font-medium text-ink mb-3">Comunicações</div>
          <div className="space-y-3">
            {avisos.slice(0, 3).map(a => (
              <div key={a.id} className="border-l-4 border-l-[#0F3A1F] bg-[#faf9f6] p-3 rounded-sm">
                <div className="flex justify-between gap-2">
                  <div className="font-medium text-sm">{a.titulo} {a.data_evento && <span className="text-xs text-gray-500">- {new Date(a.data_evento).toLocaleString('pt-BR')}</span>}</div>
                  {podeGerenciarComunicacao && (
                    <form action={excluirAvisoAction} className="flex gap-2">
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="text-[10px] text-red-600 underline">Excluir</button>
                    </form>
                  )}
                </div>
                <div className="text-sm whitespace-pre-wrap">{a.mensagem || a.conteudo}</div>
                {a.imagem_url && <img src={a.imagem_url} className="mt-2 max-h-48 border" />}
                {a.arquivo_url && <a href={a.arquivo_url} target="_blank" className="text-xs text-blue-600 underline mt-1 block">📎 Baixar anexo</a>}
                {a.video_url && <a href={a.video_url} target="_blank" className="text-xs text-blue-600 underline block">▶️ Vídeo</a>}
                {a.link_url && <a href={a.link_url} target="_blank" className="text-xs text-blue-600 underline block">🔗 {a.link_url}</a>}
              </div>
            ))}
          </div>
        </div>
      )}

      {eventosHoje?.length > 0 && (
        <div className="bg-white border-l-4 border-l-[#1E5631] border border-line rounded-sm p-4 mb-6">
          <div className="text-sm font-medium text-ink mb-2">📌 Hoje - {new Date().toLocaleDateString('pt-BR', {timeZone: 'America/Recife'})}</div>
          <div className="space-y-1.5">
            {eventosHoje.map(ev => (
              <div key={ev.id} className="flex gap-3 text-sm items-center">
                <span className="font-mono font-bold text-[#1E5631] min-w-[45px]">{(ev.hora||'--:--').slice(0,5)}</span>
                <span>{ev.titulo}</span>
                {ev.visibilidade!== 'pessoal' && <span className="text-[10px] bg-[#1E5631] text-white px-1.5 py-0.5 rounded uppercase">{ev.visibilidade}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* FORMULÁRIO LIBERADO PARA PASTOR E SECRETÁRIO DO CONSELHO */}
      {podeGerenciarComunicacao && (
        <AvisosBoard me={user} avisos={[]} modoFormApenas={true} />
      )}
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
