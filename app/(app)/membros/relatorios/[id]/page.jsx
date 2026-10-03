import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export default async function Page({ params }) {
  const { id } = await params
  const sup = getSupabase()

  const { data: carta } = await sup
   .from('cartas_transferencia')
   .select('*, cartas_membros(*)')
   .eq('id', id)
   .single()

  if (!carta) return <div className="p-6">Carta não encontrada</div>

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white border rounded-xl">
      <h1 className="font-bold text-lg">Carta de Transferência</h1>
      <p className="text-sm mt-2">Destino: {carta.igreja_destino}</p>
      <p className="text-sm">Data: {new Date(carta.data_emissao).toLocaleDateString('pt-BR')}</p>
      <p className="text-sm">Forma: {carta.forma_transferencia}</p>

      <div className="mt-6">
        <h3 className="font-bold">Membros:</h3>
        {carta.cartas_membros?.map(m => (
          <div key={m.id} className="border p-3 mt-2 rounded">
            <b>{m.nome_completo}</b> - {m.tipo_membro}<br/>
            <span className="text-xs">{m.forma_transferencia_individual}</span>
          </div>
        ))}
      </div>

      <div className="mt-10 border-t pt-6">
        <p className="text-xs text-gray-500">
          Local e data: _______, {new Date(carta.data_emissao).toLocaleDateString('pt-BR')}
        </p>
        <div className="mt-20 border-t w-[250px]">
          <p className="text-xs">Secretário do Conselho</p>
        </div>
      </div>
    </div>
  )
}
