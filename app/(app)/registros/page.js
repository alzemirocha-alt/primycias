import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import RegistroBotoes from "./RegistroBotoes"

export const dynamic = 'force-dynamic'

function fmt(d) { if(!d) return '-'; return new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Recife', day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) }
function formatTipo(t) { if(!t) return '-'; const l=t.toLowerCase(); if(l.includes('dizimo')) return 'Dízimo'; if(l.includes('oferta')) return 'Oferta'; return t }

function primeiroNome(nomeCompleto) {
  if (!nomeCompleto) return ""
  return String(nomeCompleto).trim().split(" ")[0]
}

function getStatusLabel(culto, mapaUsuarios, nomeTesoureiroDaIgreja) {
  if (!culto?.status) return "-"
  const s = String(culto.status).toLowerCase()

  if (s === "aguardando_segundo_diacono") {
    const idSegundo = culto.segundo_diacono_id || culto.diacono2_id || culto.segundoDiaconoId
    const nomeSegundo = culto.segundo_diacono_nome || culto.diacono2_nome || (idSegundo? mapaUsuarios[String(idSegundo)] : null)
    if (nomeSegundo) return `Aguardando Diácono ${primeiroNome(nomeSegundo)}`
    return "Aguardando Segundo Diácono"
  }

  if (s === "aguardando_tesoureiro") {
    // busca o nome real do tesoureiro da igreja (Gilson, Rivaldo, etc)
    if (nomeTesoureiroDaIgreja) {
      return `Aguardando Tesoureiro ${primeiroNome(nomeTesoureiroDaIgreja)}`
    }
    const idTes = culto.tesoureiro_id || culto.tesoureiroId
    const nomeTes = culto.tesoureiro_nome || (idTes? mapaUsuarios[String(idTes)] : null)
    if (nomeTes) return `Aguardando Tesoureiro ${primeiroNome(nomeTes)}`
    return "Aguardando Tesoureiro"
  }

  if (s === "validado") return "Validado"
  if (s === "devolvido_com_erro") return "Devolvido com erro"
  return culto.status.toUpperCase()
}

export default async function RegistrosPage() {
  const eu = await getSessionUser()
  if (!eu) return <div className="p-6">Faça login</div>

  let igreja_id = eu?.igreja_id
  if(!igreja_id){
    const { data: perfil } = await supabaseAdmin.from('users').select('igreja_id').eq('id', eu.id).single()
    igreja_id = perfil?.igreja_id
  }

  const { data } = await supabaseAdmin.from('records').select('*').eq('igreja_id', igreja_id).order('data_culto', { ascending: false })
  const regsAll = data || []

  // MAPA DE USUÁRIOS + DESCOBRE QUEM É O TESOUREIRO DA IGREJA
  const { data: usuariosDaIgreja } = await supabaseAdmin.from('users').select('id, nome, funcao, oficio').eq('igreja_id', igreja_id)
  const mapaUsuarios = {}
  let nomeTesoureiroDaIgreja = null
  ;(usuariosDaIgreja || []).forEach(u => {
    mapaUsuarios[String(u.id)] = u.nome
    const f = String(u.funcao || '').toLowerCase()
    const o = String(u.oficio || '').toLowerCase()
    if (f.includes('tesour') || o.includes('tesour')) {
      nomeTesoureiroDaIgreja = u.nome // vai pegar o Gilson
    }
  })
  // se não achou pela função, tenta pelo nome Gilson que é padrão aí
  if (!nomeTesoureiroDaIgreja) {
    const gilson = (usuariosDaIgreja || []).find(u => String(u.nome||'').toLowerCase().includes('gilson'))
    if (gilson) nomeTesoureiroDaIgreja = gilson.nome
  }

  const oficio = String(eu.oficio || eu.cargo || '').toLowerCase()
  const funcao = String(eu.funcao || '').toLowerCase()
  const nome = String(eu.nome || '').toLowerCase()
  const meuId = String(eu.id)

  const isTesoureiro = funcao.includes('tesour') || oficio.includes('tesour') || nome.includes('gilson')
  const isPastor = oficio.includes('pastor')
  const isDiacono = oficio.includes('diacono')

  function participei(r) {
    const ids = [
      r.primeiro_diacono_id, r.segundo_diacono_id, r.diacono_id,
      r.criado_por, r.diacono1_id, r.diacono2_id,
      r.lancado_por, r.confirmado_por
    ].map(x => String(x || ''))
    return ids.includes(meuId)
  }

  let regsFiltrados = regsAll
  if (isPastor) {
    regsFiltrados = regsAll.filter(r=>r.status==='validado')
  } else if (isTesoureiro) {
    regsFiltrados = regsAll.filter(r=>['aguardando_tesoureiro','validado','devolvido_com_erro'].includes(r.status) || participei(r))
  } else if (isDiacono) {
    regsFiltrados = regsAll.filter(r=> participei(r) )
  } else {
    regsFiltrados = []
  }

  const agoraRecifeStr = new Date().toLocaleString('en-CA', { timeZone: 'America/Recife', year: 'numeric', month: '2-digit' })
  const [anoAtual, mesAtual] = agoraRecifeStr.split('-').map(Number)

  const regsDoMes = regsFiltrados.filter(r=>{
    const dataBase = r.data_culto || r.created_at?.slice(0,10)
    if(!dataBase) return false
    const d = new Date(dataBase+"T12:00:00")
    return (d.getMonth()+1) === mesAtual && d.getFullYear() === anoAtual
  })

  const grupos = {}
  regsDoMes.forEach(r=>{ const k=r.data_culto||r.created_at?.slice(0,10); if(!grupos[k]) grupos[k]=[]; grupos[k].push(r) })

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-bold">Olá {eu.nome} - {Object.keys(grupos).length} cultos em {String(mesAtual).padStart(2,'0')}/{anoAtual} {isTesoureiro? '(Tesoureiro)' : isDiacono? '(Diácono)' : ''}</h1>
        {!isPastor && <a href="/registros/novo" className="bg-green-700 text-white px-4 py-2 rounded font-bold">+ Novo Registro</a>}
        {isPastor && <a href="/registros/novo" className="bg-blue-700 text-white px-4 py-2 rounded font-bold">🔓 Liberar Diáconos</a>}
      </div>

      {Object.entries(grupos).map(([dataCulto, lista])=>{
        const totalGeral = lista.reduce((s,x)=>s+Number(x.valor||0),0)
        const totalDizimo = lista.filter(x=>(x.tipo||'').toLowerCase().includes('dizimo')).reduce((s,x)=>s+Number(x.valor||0),0)
        const totalOferta = lista.filter(x=>(x.tipo||'').toLowerCase().includes('oferta')).reduce((s,x)=>s+Number(x.valor||0),0)
        const primeiro = lista[0]
        return (
          <div key={dataCulto} className="bg-white p-4 rounded shadow border-l-4 border-l-green-800 space-y-3">
            <div className="flex justify-between font-bold">
              <span>{new Date(dataCulto).toLocaleDateString('pt-BR')} - R$ {totalGeral.toFixed(2)}</span>
              <span className="text-xs bg-green-100 px-2 py-1 rounded">{getStatusLabel(primeiro, mapaUsuarios, nomeTesoureiroDaIgreja)}</span>
            </div>
            <div className="border rounded overflow-hidden">
              <div className="grid grid-cols-3 bg-green-800 text-white p-2 text-sm font-bold"><div>Tipo</div><div>Nome</div><div className="text-right">Valor</div></div>
              {lista.map(r=>(<div key={r.id} className="grid grid-cols-3 p-2 text-sm border-b"><div className="text-blue-800 font-bold">{formatTipo(r.tipo)}</div><div>{r.membro_nome}</div><div className="text-right">R$ {Number(r.valor).toFixed(2)}</div></div>))}
            </div>
            <div className="bg-gray-100 p-3 rounded text-sm font-bold">
              <p>Dízimo: R$ {totalDizimo.toFixed(2)}</p>
              <p>Ofertas: R$ {totalOferta.toFixed(2)}</p>
              <p className="border-t pt-1 mt-1">TOTAL GERAL: R$ {totalGeral.toFixed(2)}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded text-sm border space-y-1">
              <p className="font-bold">Histórico:</p>
              {(primeiro.historico||[]).map((h,i)=>(<p key={i}>• {fmt(h.em)} - <b>{h.usuario||h.usuario_nome}</b> - {h.acao} {h.detalhe?`(${h.detalhe})`:''}</p>))}
            </div>
            <RegistroBotoes culto={primeiro} eu={eu} isTesoureiro={isTesoureiro} isPastor={isPastor} />
          </div>
        )
      })}
      {regsDoMes.length===0 && <div className="text-center text-gray-500 mt-10 border-2 border-dashed p-8 rounded">Nenhum registro em {String(mesAtual).padStart(2,'0')}/{anoAtual}.<br/>A tela fica limpa quando o mês vira.<br/>Os registros anteriores continuam salvos e aparecem nos Relatórios (respeitando a regra de cada usuário).</div>}
    </div>
  )
}
