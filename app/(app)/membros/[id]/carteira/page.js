import { createClient } from "@supabase/supabase-js"

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY
  if (!url ||!key) return null
  return createClient(url, key)
}

export default async function CarteiraPage({ params }) {
  try {
    const { id } = await params
    const supabase = getSupabase()

    if (!supabase) {
      return <div className="p-10">Erro: Supabase não configurado. Verifique as envs na Vercel.</div>
    }

    const { data: m, error } = await supabase.from('membros_oficial').select('*').eq('id', id).single()

    if (error ||!m) {
      return <div className="p-10">Membro não encontrado. ID: {id} <br/> Erro: {error?.message}</div>
    }

    const isOficial = m.categoria_membro === 'comungante_oficial' || m.tipo_membro === 'comungante_oficial'
    const oficialTxt = m.oficial_tipo || m.tipo_oficial || ''
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://primycias.vercel.app'
    const validacaoUrl = `${baseUrl}/validar/${m.id}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(validacaoUrl)}`

    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8 print:p-0 print:bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex justify-between print:hidden">
            <a href={`/membros/${m.id}`} className="text-sm text-blue-600 underline">← Voltar para ficha</a>
            <button onClick={() => window.print()} className="bg-[#0F3A1F] text-white px-6 py-2 rounded font-bold">🖨️ Imprimir Carteira</button>
          </div>

          <div className="flex gap-8 flex-wrap justify-center">
            {/* FRENTE */}
            <div className="w-[340px] h-[216px] bg-white rounded-xl shadow-lg border overflow-hidden flex flex-col">
              <div className="bg-[#0F3A1F] text-white px-4 py-2 flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#0F3A1F] font-bold text-xs">IPB</div>
                <div className="leading-tight">
                  <div className="text-[10px] uppercase tracking-widest">Igreja Presbiteriana do Brasil</div>
                  <div className="text-[11px] font-semibold">Carteira de Membro</div>
                </div>
                <img src={qrUrl} alt="qr" className="ml-auto w-[36px] h-[36px] bg-white p-0.5 rounded" />
              </div>
              <div className="flex flex-1 p-3 gap-3">
                <div className="w-[80px] h-[100px] bg-gray-200 rounded border overflow-hidden flex-shrink-0">
                  {m.foto_url? <img src={m.foto_url} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">Sem foto</div>}
                </div>
                <div className="flex-1 text-[11px] leading-[13px]">
                  <div className="font-bold text-[13px] leading-tight mb-1">{m.nome_completo}</div>
                  <div className="text-gray-600">Rol: {m.numero_rol || 'a definir'} • {m.categoria_membro || ''}</div>
                  {isOficial && <div className="mt-1 inline-block bg-[#0F3A1F] text-white px-2 py-0.5 rounded text-[9px] uppercase">{oficialTxt || 'Oficial'}</div>}
                  <div className="mt-2">Nasc: {m.data_nascimento? new Date(m.data_nascimento).toLocaleDateString('pt-BR') : '--'}</div>
                  <div>Admissão: {m.data_admissao? new Date(m.data_admissao).toLocaleDateString('pt-BR') : '--'}</div>
                </div>
              </div>
            </div>

            {/* VERSO */}
            <div className="w-[340px] h-[216px] bg-white rounded-xl shadow-lg border p-3 flex flex-col justify-between">
              <div className="text-[10px] space-y-1">
                <div className="font-bold uppercase text-[#0F3A1F] border-b pb-1">Verso - Validação</div>
                <div><b>Forma Admissão:</b> {m.forma_admissao || '--'}</div>
                <div><b>Estado Civil:</b> {m.estado_civil || '--'}</div>
                <div className="flex items-center gap-2 mt-2">
                  <img src={qrUrl} alt="qr" className="w-[70px] h-[70px] border" />
                  <div className="text-[8px] leading-tight text-gray-600">Escaneie para validar em<br/><b>{validacaoUrl}</b><br/>Documento oficial IPB Boa Viagem</div>
                </div>
              </div>
              <div className="flex justify-between text-[9px] mt-2"><div className="border-t w-[45%] text-center pt-1">Pastor</div><div className="border-t w-[45%] text-center pt-1">Secretário</div></div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (e) {
    return <div className="p-10">Erro ao carregar carteira: {String(e.message)} <br/> Digest: erro de import supabaseAdmin</div>
  }
}
