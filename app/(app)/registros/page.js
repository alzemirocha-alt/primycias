import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export default async function RegistrosPage() {
  const eu = await getSessionUser()
  if (!eu) return <div className="p-6">Faça login</div>

  const { data: records } = await supabaseAdmin.from('records').select('*').order('created_at', { ascending: false })
  let regs = records || []

  const isTesoureiro = eu.funcao === 'tesoureiro' || eu.oficio === 'tesoureiro' || eu.nome.toLowerCase().includes('gilson')
  const isPastor = eu.oficio === 'pastor'

  // REGRA: Gilson (diácono + tesoureiro) vê aguardando_tesoureiro
  if (isPastor) {
    regs = regs.filter(r => r.status === 'validado')
  } else if (isTesoureiro) {
    regs = regs.filter(r => r.status === 'aguardando_tesoureiro' || r.status === 'validado')
  } else {
    regs = regs.filter(r => r.primeiro_diacono_id === eu.id || r.segundo_diacono_id === eu.id || r.diaconos_id === eu.id || r.status === 'aguardando_segundo_diaconos')
  }

  function formata(d) { if(!d) return 'Aguardando'; return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <h1 className="font-bold">Olá {eu.nome} ({eu.oficio} - {eu.funcao}) - {regs.length} registros</h1>

      {regs.map(r => (
        <div key={r.id} className="bg-white p-4 rounded shadow border-l-4 border-l-green-800 space-y-3">
          
          <div className="flex justify-between items-center">
            <b>{r.data_culto ? new Date(r.data_culto).toLocaleDateString('pt-BR') : ''} - R$ {r.valor || 0} - {r.tipo || 'Dízimo/Oferta'}</b>
            <span className="text-xs bg-yellow-100 px-2 py-1 rounded">{r.status}</span>
          </div>

          {/* DEMONSTRATIVO DETALHADO */}
          <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
            <p><b>Membro:</b> {r.membro_nome || '-'}</p>
            <p><b>Tipo:</b> {r.tipo || '-'}</p>
            <p><b>Valor:</b> R$ {r.valor || 0}</p>
            <p><b>Descrição:</b> {r.descricao || '-'}</p>
            <p><b>Data Culto:</b> {r.data_culto}</p>
          </div>

          {/* HISTÓRICO COM NOME, DATA E HORA DE CADA ATO - ISSO QUE FALTAVA */}
          <div className="bg-blue-50 p-3 rounded text-sm space-y-2 border border-blue-200">
            <p className="font-bold text-blue-800">Histórico de Aprovações:</p>
            <p>✅ <b>1º Diácono:</b> {r
