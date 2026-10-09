import { createClient } from "@supabase/supabase-js"
import PrintButton from "../../carteira/PrintButton"

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

function fmtExt(d){ if(!d) return '___ de ___________ de _____'; const [a,m,dia]=String(d).split('T')[0].split('-'); const meses=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]; return `${dia} de ${meses[+m-1]} de ${a}` }
function fmtCurta(d){ if(!d) return '---'; const s=String(d).split('T')[0].split('-'); return s.length===3? `${s[2]}/${s[1]}/${s[0]}` : '---' }

export default async function CertificadoBatismo({ params }) {
  const { id } = await params
  let m = null
  let errorMsg = null
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const r1 = await supabaseAdmin.from('membros_oficial').select('*').eq('id', id).maybeSingle()
    if (r1.data) m = r1.data
    else {
      const r2 = await supabaseAdmin.from('membros').select('*').eq('id', id).maybeSingle()
      if (r2.data) m = r2.data
      else errorMsg = r1.error?.message + ' | ' + r2.error?.message
    }
  } catch (e) {
    return <div className="p-10 bg-red-50 min-h-screen"><h1 className="font-bold text-red-700">Erro ENV</h1><p className="text-xs font-mono bg-white p-2 border">{e.message}</p></div>
  }
  if (!m) return <div className="p-10">Membro não encontrado<br/>ID: {id}<br/>Erro: {errorMsg}</div>

  let igreja = null
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (m.igreja_id) {
      const { data: ig } = await supabaseAdmin.from('igrejas').select('*').eq('id', m.igreja_id).maybeSingle()
      if (ig) igreja = ig
    }
  } catch(e){ console.log('Erro igreja', e.message) }

  const igrejaNome = igreja?.nome || ''
  const igrejaCnpj = igreja?.cnpj || ''
  const igrejaEndereco = igreja?.endereco || ''
  const igrejaLogo = igreja?.logo_url || igreja?.logo || '/logo-sucupira.png'

  const pastorRaw = m.pastor_batismo || igreja?.pastor_nome || ''
  const pastorFmt = pastorRaw? (pastorRaw.startsWith('Rev.')? pastorRaw : `Rev. ${pastorRaw}`) : '---'

  const baseUrl = 'https://primycias.vercel.app'
  const validacaoUrl = `${baseUrl}/validar/${m.id}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(validacaoUrl)}&color=0A3D26&bgcolor=FDF6E3&qzone=1`

  return (
    <div className="min-h-screen bg-gray-200 p-4 print:p-0 print:bg-white">
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        @media print { html,body{margin:0!important;padding:0!important;background:white!important}.no-print{display:none!important} }
        @font-face { font-family: 'Zapf Humanist'; src: url('/fonts/ZapfHumanist-Bold.woff2') format('woff2'); font-weight: 700; }
       .fonte-igreja { font-family: 'Zapf Humanist','Optima',Candara,sans-serif; font-weight: 700; }
       .folha { width: 297mm; height: 210mm; }
      `}</style>

      <div className="max-w-[1200px] mx-auto">
        <div className="flex justify-between mb-4 no-print">
          <a href={`/membros/${id}`} className="text-sm text-blue-600 underline">← Voltar</a><PrintButton/>
        </div>

        {/* FRENTE - LOGO ALTA ENROSTANDO NA BORDA BOLEADA */}
        <div className="folha bg-[#fdf6e3] mx-auto relative border-[14px] border-[#0a3d26] shadow-2xl p-6 mb-8 print:shadow-none print:mb-0 flex flex-col">
          <div className="absolute top-0 left-0 w-20 h-20 border-t-[5px] border-l-[5px] border-[#c5a76a]"></div>
          <div className="absolute top-0 right-0 w-20 h-20 border-t-[5px] border-r-[5px] border-[#c5a76a]"></div>
          <div className="flex justify-center mt-1"><img src={igrejaLogo} className="h-[58px] w-auto object-contain" alt="logo"/></div>
          <h2 className="fonte-igreja text-center text-[26px] text-[#0a3d26] mt-1 leading-tight">{igrejaNome}</h2>
          <h1 className="text-center text-[40px] font-bold tracking-wider mt-2" style={{color:'#b89a5a', fontFamily:'serif'}}>CERTIFICADO DE BATISMO</h1>
          <p className="text-center text-[12px] italic mt-1">Certificamos que foi administrado o Sacramento do Batismo a:</p>

          <div className="mt-6 px-6 text-[15px] leading-9 flex-1">
            <p>Nome: <b className="border-b border-black px-3">{m.nome_completo}</b></p>
            <p>Data de Nascimento: <span className="border-b border-black px-4">{fmtExt(m.data_nascimento)}</span></p>
            <p>Data do Batismo: <span className="border-b border-black px-4">{fmtCurta(m.data_batismo)}</span> &nbsp; Local: Sucupira <span className="border-b border-black px-10">{m.local_batismo || 'Sucupira'}</span></p>
            <p>Oficiado por Reverendo: <span className="border-b border-black px-8">{pastorFmt}</span></p>
          </div>

          <div className="flex justify-center mt-auto">
            <div className="w-[300px] text-center">
              <div className="border-t border-black"></div>
              <p className="text-[12px] mt-1">Assinatura do Pastor</p>
            </div>
          </div>
          <div className="text-center text-[8px] mt-3">{igrejaNome} — {igrejaEndereco} {igrejaCnpj? `— CNPJ: ${igrejaCnpj}`:''}</div>
        </div>

        {/* VERSO */}
        <div className="folha bg-[#fdf6e3] mx-auto relative border-[14px] border-[#0a3d26] shadow-2xl p-8 print:shadow-none flex flex-col">
          <div className="flex justify-center"><img src={igrejaLogo} className="h-[44px] w-auto object-contain" alt="logo"/></div>
          <h2 className="fonte-igreja text-center text-[22px] text-[#0a3d26] mt-1">{igrejaNome}</h2>
          <h1 className="text-center text-[32px] font-bold mt-1" style={{color:'#b89a5a', fontFamily:'serif'}}>Dados Complementares</h1>

          <div className="flex flex-1 mt-8">
            <div className="flex-1 space-y-6 text-[15px] leading-8 pr-8">
              <p>CPF: <span className="border-b border-black px-8">{m.cpf || m.documento || '---'}</span></p>
              <p>Filiação — Pai: <span className="border-b border-black px-6">{m.nome_pai || m.filiacao_pai || '---'}</span></p>
              <p>Filiação — Mãe: <span className="border-b border-black px-6">{m.nome_mae || m.filiacao_mae || '---'}</span></p>
              <p>Forma de Admissão: <span className="border-b border-black px-6 text-[13px]">{m.forma_admissao || m.modo_admissao || '---'}</span></p>
              <p>Nº Rol: <span className="border-b border-black px-10">{m.numero_rol || m.rol || '---'}</span></p>
              <p>Data de emissão: <span className="border-b border-black px-8">{new Date().toLocaleDateString('pt-BR')}</span></p>
            </div>
            <div className="w-[85px] flex justify-end items-start">
              <img src={qrUrl} className="w-[75px] h-[75px]" alt="QR" style={{background:'#fdf6e3'}}/>
            </div>
          </div>
          <div className="text-center text-[8px] mt-auto">{igrejaNome} — {igrejaEndereco} {igrejaCnpj? `— CNPJ: ${igrejaCnpj}`:''}</div>
        </div>
      </div>
    </div>
  )
}
