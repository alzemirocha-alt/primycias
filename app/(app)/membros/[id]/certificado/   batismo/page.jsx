import { createClient } from "@supabase/supabase-js"
import PrintButton from "../../carteira/PrintButton"
export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url ||!key) throw new Error(`ENV faltando - URL: ${!!url} KEY: ${!!key}`)
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
function fmtExt(d){ if(!d) return '---'; const [a,m,dia]=String(d).split('T')[0].split('-'); const meses=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]; return `${dia} de ${meses[+m-1]} de ${a}` }
function fmtCurta(d){ if(!d) return '---'; const s=String(d).split('T')[0].split('-'); return s.length===3? `${s[2]}/${s[1]}/${s[0]}` : '---' }

export default async function CertificadoBatismo({ params }) {
  const { id } = await params
  let m = null
  let errorMsg = null
  try {
    const supa = getSupabaseAdmin()
    const r1 = await supa.from('membros_oficial').select('*').eq('id', id).maybeSingle()
    if (r1.data) m = r1.data
    else {
      const r2 = await supa.from('membros').select('*').eq('id', id).maybeSingle()
      if (r2.data) m = r2.data
      else errorMsg = r1.error?.message + ' | ' + r2.error?.message
    }
  } catch (e) {
    return <div className="p-10 bg-red-50 min-h-screen"><h1 className="font-bold text-red-700">Erro ENV</h1><p className="text-xs font-mono bg-white p-2 border">{e.message}</p></div>
  }
  if (!m) return <div className="p-10">Membro não encontrado<br/>ID: {id}<br/>Erro: {errorMsg}</div>

  // BUSCA DINÂMICA DA IGREJA - MULTI-IGREJAS
  let igreja = null
  try {
    const supa = getSupabaseAdmin()
    if (m.igreja_id) {
      const { data: ig } = await supa.from('igrejas').select('*').eq('id', m.igreja_id).maybeSingle()
      if (ig) igreja = ig
    }
  } catch(e){ console.log('Erro igreja', e.message) }

  // 100% DINÂMICO - SEM NADA FIXO DE SUCUPIRA
  const igrejaNome = igreja?.nome || ''
  const igrejaCnpj = igreja?.cnpj || ''
  const igrejaEndereco = igreja?.endereco || ''
  const igrejaCep = igreja?.cep || ''
  const igrejaLogo = igreja?.logo_url || igreja?.logo || '/logo-igreja.png'

  const pastorRaw = m.pastor_batismo || igreja?.pastor_nome || igreja?.nome_pastor_responsavel || ''
  const pastorNome = pastorRaw? (pastorRaw.startsWith('Rev.')? pastorRaw : `Rev. ${pastorRaw}`) : '---'

  const baseUrl = 'https://primycias.vercel.app'
  const validacaoUrl = `${baseUrl}/validar/${m.id}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(validacaoUrl)}&color=0A3D26&bgcolor=FDF6E3&qzone=1`

  return (
    <div className="min-h-screen bg-[#e5e5e5] p-4 print:p-0 print:bg-white">
      <style>{`
        @page{size:A4 landscape;margin:0}
        @media print{.no-print{display:none!important}body{background:white!important}}
      .fonte-igreja{font-family:Optima,Candara,'Zapf Humanist',sans-serif;font-weight:700}
      .folha{width:297mm;height:210mm;background:#fdf6e3;position:relative}
      .borda-externa{border:14px solid #0a3d26; outline:3px solid #c5a76a; outline-offset:-20px}
      .titulo-ouro{color:#b89a5a;font-family:serif;letter-spacing:2px}
      `}</style>
      <div className="max-w-[1200px] mx-auto">
        <div className="flex justify-between mb-4 no-print"><a href={`/membros/${id}`} className="text-sm text-blue-600 underline">← Voltar</a><PrintButton/></div>

        <div className="folha borda-externa mx-auto shadow-2xl p-10 flex flex-col mb-8 print:shadow-none">
          <div className="flex justify-center"><img src={igrejaLogo} className="h-[62px] w-auto -mt-2 object-contain" alt="logo"/></div>
          <h2 className="fonte-igreja text-center text-[27px] text-[#0a3d26] mt-2">{igrejaNome}</h2>
          <h1 className="titulo-ouro text-center text-[42px] font-bold mt-4">CERTIFICADO DE BATISMO</h1>
          <p className="text-center text-[13px] italic mt-2">Certificamos que foi administrado o Sacramento do Batismo a:</p>
          <div className="mt-8 px-8 text-[16px] leading-9 flex-1">
            <p>Nome: <span className="font-bold border-b border-black px-4">{m.nome_completo}</span></p>
            <p>Data de Nascimento: <span className="border-b border-black px-4">{fmtExt(m.data_nascimento)}</span></p>
            <p>Data do Batismo: <span className="border-b border-black px-4">{fmtCurta(m.data_batismo)}</span> &nbsp; Local: <span className="border-b border-black px-10">{m.local_batismo || igrejaNome}</span></p>
            <p>Oficiado por Reverendo: <span className="border-b border-black px-8">{pastorNome}</span></p>
          </div>
          <div className="flex justify-center mt-auto"><div className="w-[320px] text-center"><div className="border-t border-black"></div><p className="text-[12px] mt-1">Assinatura do Pastor</p></div></div>
          {/* RODAPÉ 100% DINÂMICO */}
          <div className="text-center text-[8px] mt-4">{igrejaNome} {igrejaEndereco? `— ${igrejaEndereco}` : ''} {igrejaCep? `— CEP: ${igrejaCep}` : ''} {igrejaCnpj? `— CNPJ: ${igrejaCnpj}` : ''}</div>
        </div>

        <div className="folha borda-externa mx-auto shadow-2xl p-10 flex flex-col print:shadow-none">
          <div className="flex justify-center"><img src={igrejaLogo} className="h-[48px] w-auto object-contain" alt="logo"/></div>
          <h2 className="fonte-igreja text-center text-[22px] text-[#0a3d26] mt-1">{igrejaNome}</h2>
          <h1 className="titulo-ouro text-center text-[34px] font-bold mt-2">Dados Complementares</h1>
          <div className="flex flex-1 mt-8">
            <div className="flex-1 space-y-6 text-[15px] leading-8 pr-8">
              <p>CPF: <span className="border-b border-black px-8">{m.cpf || m.documento || '---'}</span></p>
              <p>Filiação — Pai: <span className="border-b border-black px-6">{m.nome_pai || m.filiacao_pai || m.pai || '---'}</span></p>
              <p>Filiação — Mãe: <span className="border-b border-black px-6">{m.nome_mae || m.filiacao_mae || m.mae || '---'}</span></p>
              <p>Forma de Admissão: <span className="border-b border-black px-6 text-[13px]">{m.forma_admissao || m.modo_admissao || '---'}</span></p>
              <p>Nº Rol: <span className="border-b border-black px-10">{m.numero_rol || m.rol || '---'}</span></p>
              <p>Data de emissão: <span className="border-b border-black px-8">{new Date().toLocaleDateString('pt-BR')}</span></p>
            </div>
            <div className="w-[90px]"><img src={qrUrl} className="w-[80px] h-[80px]" alt="QR"/></div>
          </div>
          <div className="text-center text-[8px] mt-auto">{igrejaNome} {igrejaEndereco? `— ${igrejaEndereco}` : ''} {igrejaCnpj? `— CNPJ: ${igrejaCnpj}` : ''}</div>
        </div>
      </div>
    </div>
  )
}
