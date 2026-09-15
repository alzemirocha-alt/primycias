import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export default async function RegistrosPage() {
  const eu = await getSessionUser()
  if (!eu) return <div className="p-6">Faça login de novo</div>

  const { data } = await supabaseAdmin.from('records').select('*').order('created_at', { ascending: false })
  let regs = data || []

  // SUA REGRA FINAL
  if (eu.oficio === 'pastor') {
    regs = regs.filter(r => r.status === 'validado')
  } else if (eu.oficio === 'tesoureiro') {
    regs = regs.filter(r => r.status === 'aguardando_tesoureiro' || r.criado_por === eu.id || r.segundo_diacono_id === eu.id)
  } else if (eu.oficio === 'diacono') {
    regs = regs.filter(r => r.criado_por === eu.id || r.segundo_diacono_id === eu.id || r.status === 'aguardando_segundo_diacono' || r.status === 'devolvido_com_erro')
  } else {
    regs = [] // presbítero não vê nada
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h1 className="font-bold">Olá {eu.nome} ({eu.oficio}) - {regs.length} registros</h1>
      
      {regs.map(r => (
        <div key={r.id} className="bg-white p-4 rounded shadow border-l-4 border-l-green-800">
          <div className="flex justify-between"><b>{r.data} - R$ {r.valor} - {r.tipo}</b><span className="text-xs bg-gray-100 px-2 rounded">{r.status}</span></div>
          
          <div className="mt-3 bg-gray-50 p-3 rounded text-sm">
            <p><b>1º Diácono (Lançou):</b> {r.criado_por}</p>
            <p><b>2º Diácono (Confirmou):</b> {r.segundo_diacono_id || 'Aguardando'}</p>
            {r.motivo_devolucao && <p className="text-red-600">Erro: {r.motivo_devolucao}</p>}
          </div>

          <form action={async () => {
            'use server'
            const { confirmarRegistro, validarRegistro, devolverRegistro, excluirRegistro, reenviarRegistro } = await import('./actions')
            // as ações são chamadas pelos botões abaixo via formAction
          }}></form>

          {/* BOTÕES - agora já sempre abertos */}
          <div className="flex flex-col gap-2 mt-3">
            {r.status === 'aguardando_segundo_diacono' && eu.oficio === 'diacono' && eu.id !== r.criado_por && (
              <form action={async () => { 'use server'; const { confirmarRegistro } = await import('./actions'); await confirmarRegistro(r.id) }}>
                <button className="bg-green-700 text-white w-full p-2 rounded">Confirmar como 2º Diácono</button>
              </form>
            )}
            {r.status === 'aguardando_tesoureiro' && eu.oficio === 'tesoureiro' && (
              <div className="flex gap-2">
                <form action={async () => { 'use server'; const { validarRegistro } = await import('./actions'); await validarRegistro(r.id) }} className="flex-1">
                  <button className="bg-blue-700 text-white w-full p-2 rounded">✓ Validar</button>
                </form>
                <form action={async () => { 'use server'; const { devolverRegistro } = await import('./actions'); await devolverRegistro(r.id, 'Erro encontrado') }} className="flex-1">
                  <button className="bg-red-600 text-white w-full p-2 rounded">✕ Devolver</button>
                </form>
              </div>
            )}
            {r.status === 'devolvido_com_erro' && r.criado_por === eu.id && (
              <form action={async () => { 'use server'; const { reenviarRegistro } = await import('./actions'); await reenviarRegistro(r.id) }}>
                <button className="bg-yellow-600 text-white w-full p-2 rounded">Corrigir e Reenviar</button>
              </form>
            )}
            {eu.oficio === 'pastor' && r.status === 'validado' && (
              <form action={async () => { 'use server'; const { excluirRegistro } = await import('./actions'); await excluirRegistro(r.id) }}>
                <button className="bg-black text-white w-full p-2 rounded">🗑️ Excluir Definitivamente (Pastor)</button>
              </form>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
