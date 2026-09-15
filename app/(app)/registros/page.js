import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export default async function RegistrosPage() {
  const eu = await getSessionUser()
  if (!eu) return <div className="p-6">Faça login</div>

  const { data } = await supabaseAdmin.from('records').select('*').order('data_culto', { ascending: false }).order('created_at', { ascending: false })
  const regsAll = data || []

  const isTesoureiro = eu.funcao === 'tesoureiro' || eu.oficio === 'tesoureiro' || eu.nome.toLowerCase().includes('gilson')
  const isPastor = eu.oficio === 'pastor'

  let regsFiltrados = regsAll
  if (isPastor) regsFiltrados = regsAll.filter(r => r.status === 'validado')
  else if (isTesoureiro) regsFiltrados = regsAll.filter(r => r.status === 'aguardando_tesoureiro' || r.status === 'validado')
  else regsFiltrados = regsAll.filter(r => r.primeiro_diacono_id === eu.id || r.segundo_diacono_id === eu.id || r.diacono_id === eu.id)

  // AGRUPA POR DATA DO CULTO
  const grupos = {}
  regsFiltrados.forEach(r => {
    const key = r.data_culto || r.created_at?.slice(0,10)
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(r)
  })

  function fmt(d) { if(!d) return '-'; return new Date(d).toLocaleString('pt-BR') }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
     <div className="flex justify-between items-center mb-4">
  <h1 className="font-bold">Ola {eu.nome} ({eu.oficio}) - {Object.keys(grupos).length} cultos</h1>
  <a href="/registros/novo" className="bg-green-700 text-white px-4 py-2 rounded font-bold">+ Novo Registro</a>
</div>

      {Object.entries(grupos).map(([dataCulto, lista]) => {
        const totalDizimo = lista.filter(x => (x.tipo||'').toLowerCase().includes('dizimo')).reduce((s,x) => s + Number(x.valor||0), 0)
        const totalOferta = lista.filter(x => (x.tipo||'').toLowerCase().includes('oferta')).reduce((s,x) => s + Number(x.valor||0), 0)
        const totalGeral = lista.reduce((s,x) => s + Number(x.valor||0), 0)
        const primeiro = lista[0]

        return (
          <div key={dataCulto} className="bg-white p-4 rounded shadow border-l-4 border-l-green-800 space-y-3">
            <div className="flex justify-between font-bold">
              <span>{new Date(dataCulto).toLocaleDateString('pt-BR')} - Total Geral R$ {totalGeral.toFixed(2)}</span>
              <span className="text-xs bg-yellow-100 px-2 py-1 rounded">{primeiro.status}</span>
            </div>

            {/* TABELA QUE VOCE PEDIU */}
            <div className="border rounded overflow-hidden">
              <div className="grid grid-cols-3 bg-green-800 text-white p-2 text-sm font-bold">
                <div>Tipo</div><div>Nome</div><div className="text-right">Valor</div>
              </div>
              {lista.map(r => (
                <div key={r.id} className="grid grid-cols-3 p-2 text-sm border-b">
                  <div className={r.tipo?.toLowerCase().includes('dizimo')? 'text-blue-700 font-bold' : 'text-green-700'}>{r.tipo || '-'}</div>
                  <div>{r.membro_nome || r.descricao || '-'}</div>
                  <div className="text-right">R$ {Number(r.valor||0).toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* TOTAIS EMBAIXO */}
            <div className="bg-gray-100 p-3 rounded text-sm font-bold space-y-1">
              <p>Total de Dizimos: R$ {totalDizimo.toFixed(2)}</p>
              <p>Total de Ofertas: R$ {totalOferta.toFixed(2)}</p>
              <p className="text-base border-t pt-1 mt-1">TOTAL GERAL: R$ {totalGeral.toFixed(2)}</p>
            </div>

            {/* HISTORICO */}
            <div className="bg-blue-50 p-3 rounded text-sm border space-y-1">
              <p className="font-bold">Historico:</p>
              <p>1o Diacono: {primeiro.diacono1_nome} em {fmt(primeiro.diacono1_at)}</p>
              <p>2o Diacono: {primeiro.diacono2_nome || 'Aguardando'} {primeiro.diacono2_at? 'em ' + fmt(primeiro.diacono2_at) : ''}</p>
              <p>Tesoureiro: {primeiro.tesoureiro_nome || 'Aguardando'} {primeiro.tesoureiro_at? 'em ' + fmt(primeiro.tesoureiro_at) : ''}</p>
              {primeiro.motivo_erro && <p className="text-red-600">Erro: {primeiro.motivo_erro}</p>}
            </div>

            {primeiro.status === 'aguardando_tesoureiro' && isTesoureiro && (
              <div className="flex gap-2">
                <form action={async () => { 'use server'; const m = await import('./actions'); await m.validarRegistro(primeiro.id) }} className="flex-1">
                  <button className="bg-blue-700 text-white w-full p-2 rounded">Validar Culto</button>
                </form>
                <form action={async () => { 'use server'; const m = await import('./actions'); await m.devolverRegistro(primeiro.id, 'Corrigir') }} className="flex-1">
                  <button className="bg-red-600 text-white w-full p-2 rounded">Devolver</button>
                </form>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
