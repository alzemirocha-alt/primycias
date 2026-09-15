import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import RegistroBotoes from "./RegistroBotoes"

export default async function RegistrosPage() {
  const eu = await getSessionUser()
  if (!eu) return <div className="p-6">Faça login</div>

  const { data } = await supabaseAdmin.from('records').select('*').order('data_culto', { ascending: false })
  const { data: users } = await supabaseAdmin.from('users').select('id, nome')
  const mapUsers = {}
  users?.forEach(u => mapUsers[u.id] = u.nome)

  const regsAll = data || []
  const isTesoureiro = eu.funcao === 'tesoureiro' || eu.oficio === 'tesoureiro' || eu.nome.toLowerCase().includes('gilson')
  const isPastor = eu.oficio === 'pastor'

  let regsFiltrados = regsAll
  if (isPastor) regsFiltrados = regsAll.filter(r => r.status === 'validado')
  else if (isTesoureiro) regsFiltrados = regsAll.filter(r => r.status === 'aguardando_tesoureiro' || r.status === 'validado' || r.status === 'devolvido_com_erro')
  else regsFiltrados = regsAll.filter(r => r.primeiro_diacono_id === eu.id || r.segundo_diacono_id === eu.id || r.diacono_id === eu.id)

  const grupos = {}
  regsFiltrados.forEach(r => {
    const key = r.data_culto || r.created_at?.slice(0,10)
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(r)
  })

  function fmt(d) { if(!d) return '-'; return new Date(d).toLocaleString('pt-BR') }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-bold">Ola {eu.nome} ({eu.oficio}) - {Object.keys(grupos).length} cultos</h1>
        <a href="/registros/novo" className="bg-green-700 text-white px-4 py-2 rounded font-bold">+ Novo Registro</a>
      </div>

      {Object.entries(grupos).map(([dataCulto, lista]) => {
        const totalDizimo = lista.filter(x => (x.tipo||'').toLowerCase().includes('dizimo')).reduce((s,x) => s + Number(x.valor||0), 0)
        const totalOferta = lista.filter(x => (x.tipo||'').toLowerCase().includes('oferta')).reduce((s,x) => s + Number(x.valor||0), 0)
        const totalGeral = lista.reduce((s,x) => s + Number(x.valor||0), 0)
        const primeiro = lista[0]
        const nomeSegundoQueVaiConferir = mapUsers[primeiro.segundo_diacono_id] || 'Não definido'

        return (
          <div key={dataCulto} className="bg-white p-4 rounded shadow border-l-4 border-l-green-800 space-y-3">
            <div className="flex justify-between font-bold">
              <span>{new Date(dataCulto).toLocaleDateString('pt-BR')} - Total Geral R$ {totalGeral.toFixed(2)}</span>
              <span className="text-xs bg-yellow-100 px-2 py-1 rounded">{primeiro.status}</span>
            </div>

            <div className="border rounded overflow-hidden">
              <div className="grid grid-cols-3 bg-green-800 text-white p-2 text-sm font-bold"><div>Tipo (Diz/Ofer)</div><div>Nome</div><div className="text-right">Valor</div></div>
              {lista.map(r => (
                <div key={r.id} className="grid grid-cols-3 p-2 text-sm border-b"><div className="font-bold text-blue-700">{r.tipo}</div><div>{r.membro_nome}</div><div className="text-right">R$ {Number(r.valor).toFixed(2)}</div></div>
              ))}
            </div>

            <div className="bg-gray-100 p-3 rounded text-sm font-bold">
              <p>Total de Dizimo: R$ {totalDizimo.toFixed(2)}</p><p>Total de Ofertas: R$ {totalOferta.toFixed(2)}</p><p className="text-base border-t mt-1">TOTAL GERAL: R$ {totalGeral.toFixed(2)}</p>
            </div>

            <div className="bg-blue-50 p-3 rounded text-sm border">
              <p className="font-bold">Historico:</p>
              <p>1o Diacono: {primeiro.diacono1_nome} em {fmt(primeiro.diacono1_at)}</p>
              <p>2o Diacono que vai conferir: <b className="text-green-800">{primeiro.diacono2_nome || nomeSegundoQueVaiConferir}</b> {primeiro.diacono2_at? `em ${fmt(primeiro.diacono2_at)}` : '(Aguardando conferência)'}</p>
              <p>Tesoureiro: {primeiro.tesoureiro_nome || 'Aguardando'}</p>
              {primeiro.motivo_erro && <p className="text-red-600">Motivo erro: {primeiro.motivo_erro}</p>}
            </div>

            <RegistroBotoes culto={primeiro} eu={eu} isTesoureiro={isTesoureiro} />
          </div>
        )
      })}
    </div>
  )
}
