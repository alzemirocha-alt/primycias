import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export default async function RegistrosPage() {
  const eu = await getSessionUser()
  if (!eu) return <div className="p-6">Faça login novamente</div>

  const { data } = await supabaseAdmin.from('records').select('*').order('created_at', { ascending: false })
  const regsAll = data || []

  const isTesoureiro = eu.funcao === 'tesoureiro' || eu.oficio === 'tesoureiro' || (eu.nome && eu.nome.toLowerCase().includes('gilson'))
  const isPastor = eu.oficio === 'pastor'
  const isDiacono = eu.oficio === 'diacono'

  let regs = regsAll
  if (isPastor) {
    regs = regsAll.filter(r => r.status === 'validado')
  } else if (isTesoureiro) {
    regs = regsAll.filter(r => r.status === 'aguardando_tesoureiro' || r.status === 'validado')
  } else if (isDiacono) {
    regs = regsAll.filter(r => r.primeiro_diacono_id === eu.id || r.segundo_diacono_id === eu.id || r.diacono_id === eu.id || r.criado_por === eu.id || r.status === 'aguardando_segundo_diacono' || r.status === 'devolvido_com_erro')
  } else {
    regs = []
  }

  function fmt(d) {
    if (!d) return '-'
    return new Date(d).toLocaleString('pt-BR')
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <h1 className="font-bold">Ola {eu.nome} ({eu.oficio} - {eu.funcao}) - {regs.length} registros</h1>

      {regs.map((r) => (
        <div key={r.id} className="bg-white p-4 rounded shadow border-l-4 border-l-green-800 space-y-3">
          <div className="flex justify-between">
            <b>{r.data_culto ? new Date(r.data_culto).toLocaleDateString('pt-BR') : ''} - R$ {r.valor || 0} - {r.tipo || ''}</b>
            <span className="text-xs bg-yellow-100 px-2 py-1 rounded">{r.status}</span>
          </div>

          <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
            <p><b>Membro:</b> {r.membro_nome || '-'}</p>
            <p><b>Descricao:</b> {r.descricao || '-'}</p>
            <p><b>Valor:</b> R$ {r.valor || 0}</p>
          </div>

          <div className="bg-blue-50 p-3 rounded text-sm border space-y-1">
            <p className="font-bold">Historico de Aprovacoes:</p>
            <p>1o Diacono: <b>{r.diacono1_nome || '-'}</b> em {fmt(r.diacono1_at)}</p>
            <p>2o Diacono: <b>{r.diacono2_nome || 'Aguardando'}</b> {r.diacono2_at ? ' em ' + fmt(r.diacono2_at) : ''}</p>
            <p>Tesoureiro: <b>{r.tesoureiro_nome || 'Aguardando validacao'}</b> {r.tesoureiro_at ? ' em ' + fmt(r.tesoureiro_at) : ''}</p>
            {r.motivo_erro && <p className="text-red-600">Erro: {r.motivo_erro}</p>}
          </div>

          <div className="flex gap-2">
            {r.status === 'aguardando_tesoureiro' && isTesoureiro && (
              <>
                <form action={async () => { 'use server'; const mod = await import('./actions'); await mod.validarRegistro(r.id) }} className="flex-1">
                  <button className="bg-blue-700 text-white w-full p-2 rounded">Validar</button>
                </form>
                <form action={async () => { 'use server'; const mod = await import('./actions'); await mod.devolverRegistro(r.id, 'Corrigir') }} className="flex-1">
                  <button className="bg-red-600 text-white w-full p-2 rounded">Devolver</button>
                </form>
              </>
            )}
            {isPastor && r.status === 'validado' && (
              <form action={async () => { 'use server'; const mod = await import('./actions'); await mod.excluirRegistro(r.id) }} className="w-full">
                <button className="bg-black text-white w-full p-2 rounded">Excluir Definitivo</button>
              </form>
            )}
          </div>
        </div>
      ))}

      {regs.length === 0 && <p className="text-center text-gray-500 mt-10">Nenhum registro para voce</p>}
    </div>
  )
}
