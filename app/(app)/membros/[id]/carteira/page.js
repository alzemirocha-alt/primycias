import { createClient } from "@supabase/supabase-js"

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url ||!key) {
    throw new Error(`ENV faltando - URL: ${!!url} KEY: ${!!key}`)
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

export default async function CarteiraPage({ params }) {
  const { id } = await params
  let m = null
  let errorMsg = null

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const r1 = await supabaseAdmin.from('membros_oficial').select('*').eq('id', id).maybeSingle()
    if (r1.data) {
      m = r1.data
    } else {
      const r2 = await supabaseAdmin.from('membros').select('*').eq('id', id).maybeSingle()
      if (r2.data) m = r2.data
      else errorMsg = r1.error?.message + ' | ' + r2.error?.message
    }
  } catch (e) {
    return (
      <div className="p-10 bg-red-50 min-h-screen">
        <h1 className="font-bold text-red-700">Erro de ENV na Vercel</h1>
        <p className="mt-2 text-xs font-mono bg-white p-2 border">{e.message}</p>
        <p className="mt-2 text-xs">ID: {id}</p>
      </div>
    )
  }

  if (!m) {
    return <div className="p-10">Membro não encontrado<br/>ID: {id}<br/>Erro: {errorMsg}</div>
  }

  const baseUrl = 'https://primycias.vercel.app'
  const validacaoUrl = `${baseUrl}/validar/${m.id}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(validacaoUrl)}`

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between mb-6 print:hidden">
          <a href={`/membros/${id}`} className="text-sm text-blue-600 underline">← Voltar</a>
          <button id="btnPrint" className="bg-[#0F3A1F] text-white px-6 py-2 rounded text-sm">Imprimir Carteira</button>
        </div>

        <div className="flex gap-8 justify-center flex-wrap print:gap-0">
          <div className="w-[340px] h-[216px] bg-white rounded-xl shadow-lg border overflow-hidden print:shadow-none">
            <div className="bg-[#0F3A1F] text-white px-3 py-2 flex items-center gap-2 text-[11px] leading-none">
              <div className="w-7 h-7 bg-white text-[#0F3A1F] rounded-full flex items-center justify-center font-bold text-[12px]">IPB</div>
              <div>
                <div className="font-bold">Igreja Presbiteriana do Brasil</div>
                <div className="text-[9px] opacity-80">IPB Boa Viagem - Recife/PE</div>
              </div>
              <img src={qrUrl} className="ml-auto w-9 h-9 bg-white p-0.5 rounded" alt="QR" />
            </div>
            <div className="p-3 flex gap-3">
              <div className="w-[80px] h-[100px] bg-gray-200 rounded overflow-hidden border flex-shrink-0">
                {m.foto_url? <img src={m.foto_url} className="w-full h-full object-cover" alt="foto" /> : <div className="w-full h-full grid place-items-center text-[9px] text-gray-500">Sem foto</div>}
              </div>
              <div className="text-[11px] leading-[1.2] flex-1">
                <div className="font-bold text-[13px] text-[#0F3A1F] leading-tight">{m.nome_completo}</div>
                <div className="mt-1">Rol: <b>{m.numero_rol || '---'}</b></div>
                <div className="mt-0.5">Categoria: {m.categoria_membro || m.tipo_membro || 'Membro'}</div>
                {m.oficial_tipo && <div>Oficial: <b>{m.oficial_tipo}</b></div>}
                <div className="mt-2 text-[9px] text-gray-500 break-all">Valide em: {validacaoUrl}</div>
                <div className="mt-1 text-[8px] text-gray-400">ID: {m.id.slice(0,8)}...</div>
              </div>
            </div>
          </div>

          <div className="w-[340px] h-[216px] bg-white rounded-xl shadow-lg border overflow-hidden p-3 print:shadow-none">
            <div className="h-full border border-dashed border-gray-300 rounded-lg p-3 flex flex-col">
              <div className="text-[10px] font-bold text-center text-[#0F3A1F]">Carteira de Membro - IPB Boa Viagem</div>
              <div className="mt-3 text-[9px] text-gray-600 leading-relaxed">
                Esta carteira identifica o portador como membro da Igreja Presbiteriana do Brasil - Igreja de Boa Viagem.
              </div>
              <div className="mt-auto flex justify-between items-end">
                <div className="text-[8px] text-gray-400">Emitida em: {new Date().toLocaleDateString('pt-BR')}</div>
                <div className="w-[100px] border-t border-gray-400 text-center text-[8px] pt-1">Assinatura Pastor</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{__html: `document.getElementById('btnPrint')?.addEventListener('click',()=>window.print())`}} />
    </div>
  )
}
