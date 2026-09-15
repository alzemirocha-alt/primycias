import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import RegistroBotoes from "./RegistroBotoes"

function fmt(d) { if(!d) return '-'; return new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Recife', day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) }
function formatTipo(t) { if(!t) return '-'; const l=t.toLowerCase(); if(l.includes('dizimo')) return 'Dízimo'; if(l.includes('oferta')) return 'Oferta'; return t }

export default async function RegistrosPage() {
  const eu = await getSessionUser()
  if (!eu) return <div className="p-6">Faça login</div>
  const { data } = await supabaseAdmin.from('records').select('*').order('data_culto', { ascending: false })
  const regsAll = data || []
  const isTesoureiro = eu.funcao==='tesoureiro' || eu.oficio==='tesoureiro' || eu.nome.toLowerCase().includes('gilson')
  const isPastor = eu.oficio==='pastor'

  let regsFiltrados = regsAll
  if (isPastor) regsFiltrados = regsAll.filter(r=>r.status==='validado')
  else if (isTesoureiro) regsFiltrados = regsAll.filter(r=>['aguardando_tesoureiro','validado','devolvido_com_erro'].includes(r.status))
  else regsFiltrados = regsAll.filter(r=>r.primeiro_diacono_id===eu.id || r.segundo_diacono_id===eu.id || r.diacono_id===eu.id)

  const grupos = {}
  regsFiltrados.forEach(r=>{ const k=r.data_culto||r.created_at?.slice(0,10); if(!grupos[k]) grupos[k]=[]; grupos[k].push(r) })

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-bold">Olá {eu.nome} - {Object.keys(grupos).length} cultos</h1>
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
              <span className="text-xs bg-green-100 px-2 py-1 rounded">{primeiro.status?.toUpperCase()}</span>
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
    </div>
  )
}
