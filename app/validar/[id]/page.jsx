import { createClient } from "@supabase/supabase-js"

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url ||!key) throw new Error("ENV faltando")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export default async function ValidarPage({ params, searchParams }) {
  const { id } = await params
  const sp = searchParams? await searchParams : {}
  const tipo = (sp?.t || sp?.tipo || '').toString().toLowerCase()
  const isBatismo = tipo === 'batismo' || tipo === 'certificado' || tipo === 'batismo_certificado'

  const supabase = getSupabaseAdmin()

  let m = null
  let r1 = await supabase.from('membros_oficial').select('*').eq('id', id).maybeSingle()
  if (r1.data) m = r1.data
  else {
    let r2 = await supabase.from('membros').select('*').eq('id', id).maybeSingle()
    if (r2.data) m = r2.data
  }

  if (!m) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow max-w-md w-full text-center border-t-4 border-red-600">
          <h1 className="text-xl font-bold text-red-700">{isBatismo? 'Certificado não encontrado' : 'Carteira não encontrada'}</h1>
          <p className="text-sm mt-2 text-gray-600">ID: {id}</p>
        </div>
      </div>
    )
  }

  let igreja = null
  if (m.igreja_id) {
    const { data } = await supabase.from('igrejas').select('*').eq('id', m.igreja_id).maybeSingle()
    if (data) igreja = data
  }

  // CORREÇÃO - verifica TODOS os campos de status, não só o primeiro
  const todosStatus = [m.situacao, m.status, m.status_membro].filter(Boolean).map(v => String(v).toLowerCase().trim())
  const situacaoRaw = todosStatus[0] || 'ativo'
  const isDemitido = todosStatus.some(s => ['demitido','excluido','excluído','inativo','falecido','transferido'].includes(s))
  const isAtivo =!isDemitido

  const dataAdmissao = m.data_admissao? new Date(m.data_admissao).toLocaleDateString('pt-BR') : '---'
  const dataDemissao = m.data_demissao || m.data_exclusao || m.data_saida || null
  const dataDemissaoFmt = dataDemissao? new Date(dataDemissao).toLocaleDateString('pt-BR') : null
  const motivoDemissao = m.motivo_demissao || m.motivo_exclusao || m.motivo_saida || m.observacao_demissao || '---'
  const formaDemissao = m.forma_demissao || m.modo_demissao || ''

  const igrejaNome = igreja?.nome || ''
  const igrejaLogo = igreja?.logo_url || igreja?.logo || ''

  // Dados específicos de batismo
  const dataBatismo = m.data_batismo? new Date(m.data_batismo).toLocaleDateString('pt-BR') : '---'
  const dataNasc = m.data_nascimento? new Date(m.data_nascimento).toLocaleDateString('pt-BR') : '---'

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-4 flex items-center justify-center">
      <div className="bg-white w-full max-w-[500px] rounded-[20px] shadow-xl border border-gray-200 overflow-hidden">
        <div className={`bg-white p-5 flex items-center gap-4 border-b-2 ${isBatismo? 'border-[#b89a5a]' : 'border-[#0A3D26]'}`}>
          {igrejaLogo && <img src={igrejaLogo} className="h-[50px] w-auto" alt="logo"/>}
          <div>
            <h1 className="text-[#0A3D26] font-bold text-[14px] leading-tight">{igrejaNome}</h1>
            <p className="text-[11px] text-gray-500">{isBatismo? 'Validação de Certificado de Batismo' : 'Validação de Carteira'}</p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-4">
            <div className="w-[80px] h-[100px] border border-black overflow-hidden flex-shrink-0 bg-gray-100">
              {m.foto_url? <img src={m.foto_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px]">SEM FOTO</div>}
            </div>
            <div>
              <h2 className="font-bold text-[#0A3D26] text-[18px] leading-tight">{m.nome_completo}</h2>
              <p className="text-sm mt-1">Rol: <b>{m.numero_rol || m.rol || '---'}</b></p>
              <p className="text-sm">CPF: {m.cpf || '---'}</p>
              <p className="text-xs text-gray-500 mt-1">Emitida em: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="mt-6">
            {isBatismo? (
              <div className="bg-[#fdf6e3] border-2 border-[#b89a5a] rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="bg-[#b89a5a] text-white px-3 py-1 rounded-full text-xs font-bold">BATISMO</span>
                  <span className="text-[#7a5a2a] font-bold">Certificado Autêntico</span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-[#5a4320]">
                  <p>Data de Nascimento: <b>{dataNasc}</b></p>
                  <p>Data do Batismo: <b>{dataBatismo}</b></p>
                  <p>Local do Batismo: <b>{m.local_batismo || igrejaNome}</b></p>
                  <p>Oficiado por: <b>{m.pastor_batismo || '---'}</b></p>
                  <p className="pt-2 text-xs">Forma de Admissão: {m.forma_admissao || m.forma_de_admissao || '---'}</p>
                </div>
                <p className="text-[11px] mt-3 text-[#b89a5a]">Este QR comprova que o sacramento do Batismo foi administrado conforme livro de registros da igreja.</p>
              </div>
            ) : isAtivo? (
              <div className="bg-green-50 border-2 border-green-600 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">ATIVO</span>
                  <span className="text-green-800 font-bold">Membro em comunhão</span>
                </div>
                <p className="text-sm mt-3 text-green-900">Membro ativo desde <b>{dataAdmissao}</b></p>
                <p className="text-xs mt-1 text-green-700">Modo: {m.modo_admissao || m.forma_admissao || '---'}</p>
              </div>
            ) : (
              <div className="bg-red-50 border-2 border-red-600 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">{situacaoRaw}</span>
                  <span className="text-red-800 font-bold">Não está em comunhão</span>
                </div>
                <p className="text-sm mt-3 text-red-900">Data da {situacaoRaw}: <b>{dataDemissaoFmt || '---'}</b></p>
                {formaDemissao && <p className="text-sm text-red-800">Forma: {formaDemissao}</p>}
                <p className="text-sm mt-2 text-red-800">Motivo: <b>{motivoDemissao}</b></p>
                <p className="text-xs mt-2 text-gray-600">Admitido em: {dataAdmissao}</p>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-[10px] text-gray-400">ID: {m.id}</p>
            <p className="text-[10px] text-gray-400">Validação oficial • {igrejaNome}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
