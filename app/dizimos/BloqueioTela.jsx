"use client"
export default function BloqueioTela({ cultoAberto }){
  const dataFmt = cultoAberto?.data? new Date(cultoAberto.data+"T12:00:00").toLocaleDateString('pt-BR') : ''
  const periodo = (cultoAberto?.periodo||'').toUpperCase()
  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center space-y-3 shadow-2xl">
        <div className="text-5xl">🔒</div>
        <h2 className="font-bold text-xl text-[#1a4330]">Módulo Bloqueado</h2>
        <p className="text-sm">Não é possível acessar pois há um registro em andamento.</p>
        <div className="bg-red-50 border border-red-200 p-3 rounded text-xs text-left">
          Culto: <b>{dataFmt} - {periodo}</b><br/>
          Status: Aguardando validação do Tesoureiro
        </div>
        <p className="text-[11px] text-gray-500">Acesso liberado apenas para os 2 diáconos envolvidos e o tesoureiro.</p>
      </div>
    </div>
  )
}
