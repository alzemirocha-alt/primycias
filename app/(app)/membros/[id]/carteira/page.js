import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const dynamic = 'force-dynamic'

async function getMembro(id) {
  const { data } = await supabaseAdmin.from('membros_oficial').select('*').eq('id', id).single()
  return data
}

export default async function CarteiraPage({ params }) {
  const { id } = await params
  const m = await getMembro(id)
  if (!m) return <div>Membro não encontrado</div>

  const isOficial = m.categoria_membro === 'comungante_oficial' || m.tipo_membro === 'comungante_oficial'
  const oficialTxt = m.oficial_tipo || m.tipo_oficial || ''
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seu-site.com'
  const validacaoUrl = `${baseUrl}/validar/${m.id}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(validacaoUrl)}`

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between print:hidden">
          <a href={`/membros/${id}`} className="text-sm text-blue-600">← Voltar</a>
          <button onClick={() => window.print()} className="bg-[#0F3A1F] text-white px-6 py-2 rounded">Imprimir</button>
        </div>

        <div className="flex gap-8 flex-wrap justify-center">
          {/* FRENTE */}
          <div className="w-[340px] h-[216px] bg-white rounded-xl shadow-lg border overflow-hidden flex flex-col relative">
            <div className="bg-[#0F3A1F] text-white px-4 py-2 flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#0F3A1F] font-bold text-xs">IPB</div>
              <div className="leading-tight"><div className="text-[10px] uppercase">Igreja Presbiteriana do Brasil</div><div className="text-[11px] font-semibold">Carteira de Membro</div></div>
              <img src={qrUrl} className="ml-auto w-[40px] h-[40px] bg-white p-0.5 rounded" />
            </div>
            <div className="flex flex-1 p-3 gap-3">
              <div className="w-[80px] h-[100px] bg-gray-200 rounded border overflow-hidden flex-shrink-0">
                {m.foto_url? <img src={m.foto_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">Sem foto</div>}
              </div>
              <div className="flex-1 text-[11px] leading-[13px]">
                <div className="font-bold text-[13px] leading-tight mb-1">{m.nome_completo}</div>
                <div className="text-gray-600">Rol: {m.numero_rol || 'a definir'} • {m.categoria_membro || m.tipo_membro}</div>
                {isOficial && <div className="mt-1 inline-block bg-[#0F3A1F] text-white px-2 py-0.5 rounded text-[9px] uppercase">{oficialTxt}</div>}
                <div className="mt-2">Nasc: {m.data_nascimento? new Date(m.data_nascimento).toLocaleDateString('pt-BR') : '--'}</div>
                <div>Admissão: {m.data_admissao? new Date(m.data_admissao).toLocaleDateString('pt-BR') : '--'}</div>
                <div className="text-[8px] text-gray-500 mt-2">Escaneie o QR para validar</div>
              </div>
            </div>
            <div className="px-3 pb-2 text-[8px] text-gray-400 flex justify-between"><span>Emissão: {new Date().toLocaleDateString('pt-BR')}</span><span>IPB Boa Viagem - Recife/PE</span></div>
          </div>

          {/* VERSO */}
          <div className="w-[340px] h-[216px] bg-white rounded-xl shadow-lg border p-3 flex flex-col justify-between">
            <div>
              <div className="text-[9px] font-bold uppercase text-[#0F3A1F] border-b mb-2 pb-1 flex justify-between"><span>Dados do Membro</span><span className="font-normal">Validação: {baseUrl}/validar/{m.id.slice(0,8)}...</span></div>
              <div className="text-[10px] space-y-1 leading-tight">
                <div><b>Filiação:</b> {m.filiacao_pai || '--'} e {m.filiacao_mae || '--'}</div>
                <div><b>Naturalidade:</b> {m.cidade_nasc || m.cidade_nascimento || '--'}/{m.estado_nasc || m.estado_nascimento || '--'}</div>
                <div><b>Estado Civil:</b> {m.estado_civil || '--'} {m.nome_conjuge? `• ${m.nome_conjuge}` : ''}</div>
                <div><b>Forma Admissão:</b> {m.forma_admissao || m.forma_admissao_comungante || '--'}</div>
                <div><b>Prof. Fé:</b> {m.data_profissao_fe? new Date(m.data_profissao_fe).toLocaleDateString('pt-BR') : '--'} - {m.local_profissao_fe || '--'}</div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[9px] mt-2">
                <div className="text-center w-[45%]"><div className="border-t border-black pt-1">Pastor Efetivo</div></div>
                <div className="text-center w-[45%]"><div className="border-t border-black pt-1">Secretário do Conselho</div></div>
              </div>
              <div className="flex items-center gap-2 mt-2 bg-gray-50 p-1 rounded">
                <img src={qrUrl} className="w-[50px] h-[50px]" />
                <div className="text-[7px] text-gray-600 leading-tight">Carteira válida com QR Code. Para validar a autenticidade, aponte a câmera do celular para o QR Code ou acesse {validacaoUrl}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
