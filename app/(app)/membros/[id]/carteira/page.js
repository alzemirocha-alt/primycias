import { createClient } from "@supabase/supabase-js"
import PrintButton from "./PrintButton"

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

  // BUSCA DINÂMICA DA IGREJA PELO igreja_id - MULTI-IGREJAS
  let igreja = null
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (m.igreja_id) {
      const { data: ig } = await supabaseAdmin.from('igrejas').select('*').eq('id', m.igreja_id).maybeSingle()
      if (ig) igreja = ig
    }
  } catch (e) {
    console.log('Erro ao buscar igreja', e.message)
  }

  // 100% DINÂMICO - SEM FIXO DE SUCUPIRA
  const igrejaNome = igreja?.nome || ''
  const igrejaCnpj = igreja?.cnpj || ''
  const igrejaCep = igreja?.cep || ''
  const igrejaEndereco = igreja?.endereco || ''
  const igrejaLogo = igreja?.logo_url || igreja?.logo || ''

  const pastorNomeRaw = igreja?.pastor_nome || igreja?.nome_pastor_responsavel || ''
  const pastorNome = pastorNomeRaw? (pastorNomeRaw.startsWith('Rev.')? pastorNomeRaw : `Rev. ${pastorNomeRaw}`) : ''

  const baseUrl = 'https://primycias.vercel.app'
  const validacaoUrl = `${baseUrl}/validar/${m.id}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(validacaoUrl)}`

  const dataAdmissao = m.data_admissao? new Date(m.data_admissao).toLocaleDateString('pt-BR') : (m.data_admissao_formatada || '---')
  const modoAdmissao = m.modo_admissao || m.forma_admissao || '---'
  const cpf = m.cpf || m.documento || '---'
  const pai = m.nome_pai || m.filiacao_pai || m.pai || '---'
  const mae = m.nome_mae || m.filiacao_mae || m.mae || '---'

  const oficialFormatado = (() => {
    if (!m.oficial_tipo) return null
    const t = m.oficial_tipo.toLowerCase()
    if (t === 'presbitero') return 'Presbítero'
    if (t === 'diacono') return 'Diácono'
    if (t === 'pastor') return 'Pastor'
    return m.oficial_tipo.charAt(0).toUpperCase() + m.oficial_tipo.slice(1).toLowerCase()
  })()

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white print:min-h-0">
      <style>{`
        @media print {
          html, body { margin: 0!important; padding: 0!important; background: white!important; height: auto!important; overflow: visible!important; }
          header, nav, aside, footer { display: none!important; }
      .no-print { display: none!important; }
          #print-area {
            display: block!important;
            position: absolute!important;
            top: 0!important;
            left: 0!important;
            width: 100%!important;
            padding: 10mm!important;
            box-sizing: border-box;
          }
          @page { margin: 0!important; size: A4; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto print:max-w-none print:mx-0">
        <div className="flex justify-between mb-6 no-print">
          <a href={`/membros/${id}`} className="text-sm text-blue-600 underline">← Voltar</a>
          <PrintButton />
        </div>

        <div id="print-area" className="flex flex-col gap-8 items-center justify-start">

          {/* FRENTE - INVERTIDO: FUNDO BRANCO LETRA VERDE */}
          <div className="w-[600px] h-[380px] bg-white rounded-[20px] shadow-lg border-2 border-black overflow-hidden print:shadow-none">
            <div className="bg-white h-[100px] flex items-center px-5 gap-4 border-b-2 border-[#0A3D26]">
              {igrejaLogo? <img src={igrejaLogo} alt="Logo" className="h-[65px] w-auto object-contain" /> : null}
              <div className="text-[#0A3D26] leading-[1.1]">
                <h1 className="text-[19px] font-bold">{igrejaNome}</h1>
                <p className="text-[11px] font-semibold mt-1">CNPJ: {igrejaCnpj} &nbsp; CEP: {igrejaCep}</p>
                <p className="text-[11px]">{igrejaEndereco}</p>
              </div>
            </div>
            <div className="p-5 flex gap-6">
              <div className="w-[145px] h-[195px] border border-black flex-shrink-0 overflow-hidden bg-white">
                <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center overflow-hidden">
                  {m.foto_url? <img src={m.foto_url} className="w-full h-full object-cover" alt="foto" /> : (
                    <>
                      <span className="text-2xl">📷</span>
                      <span className="text-[10px] text-gray-500">FOTO</span>
                      <span className="text-[18px] font-bold text-gray-600">90×120</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 leading-[1.15]">
                <h2 className="text-[#0A3D26] text-[22px] font-bold leading-tight mb-1">{m.nome_completo}</h2>
                <p className="text-[18px] font-bold mt-2">Rol: {m.numero_rol || m.rol || '---'}</p>
                <p className="text-[18px] font-bold mt-1">Membro Comungante</p>
                {oficialFormatado && <p className="text-[18px] font-bold">{oficialFormatado}</p>}
                <p className="text-[16px] font-bold mt-3">Data Admissão: {dataAdmissao}</p>
                <p className="text-[16px] font-bold">Modo Admissão: {modoAdmissao}</p>
              </div>
            </div>
            <div className="px-5 text-[11px] -mt-1">Carteira de Membro • {igrejaNome}</div>
          </div>

          {/* VERSO - INVERTIDO: FUNDO BRANCO LETRA VERDE */}
          <div className="w-[600px] h-[380px] bg-white rounded-[20px] shadow-lg border-2 border-black overflow-hidden flex flex-col print:shadow-none">
            <div className="bg-white h-[75px] flex items-center px-5 gap-3 border-b-2 border-[#0A3D26]">
              {igrejaLogo? <img src={igrejaLogo} alt="Logo" className="h-[50px] w-auto" /> : null}
              <div className="text-[#0A3D26]">
                <h1 className="text-[12px] font-bold leading-[1.1]">{igrejaNome.toUpperCase()}</h1>
              </div>
            </div>

            <div className="flex-1 p-5 flex flex-col">
              <h2 className="text-center text-[#0A3D26] text-[24px] font-bold">Carteira de Membro</h2>

              <div className="flex justify-between mt-3">
                <div className="text-[17px] leading-[1.25] font-medium flex-1">
                  <p>CPF: {cpf}</p>
                  <p className="mt-1">Filiação:</p>
                  <p>Pai: {pai}</p>
                  <p>Mãe: {mae}</p>
                  <p className="text-[11px] mt-3 text-gray-700">Emitida em: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="w-[110px] h-[110px] flex-shrink-0 ml-4">
                  <img src={qrUrl} className="w-full h-full object-contain" alt="QR" />
                </div>
              </div>

              <div className="text-center mt-auto">
                <div className="w-[300px] mx-auto">
                  <div className="border-t border-black w-full"></div>
                  <p className="text-[#0A3D26] text-[14px] font-bold leading-tight mt-1">{pastorNome}</p>
                  <p className="text-[#0A3D26] text-[11px]">Pastor Titular</p>
                </div>
              </div>

              <p className="text-[9px] text-center leading-tight mt-3 px-2">
                Esta carteira identifica o portador como membro da {igrejaNome}. Válida mediante apresentação de documento oficial com foto.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
