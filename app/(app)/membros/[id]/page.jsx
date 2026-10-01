import { createClient } from "@supabase/supabase-js"
import Link from "next/link"

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export default async function MembroPage({ params }) {
  const { id } = await params
  const supabase = getSupabase()

  let { data: m } = await supabase.from("membros_oficial").select("*").eq("id", id).single()
  if (!m) {
    const { data } = await supabase.from("membros").select("*").eq("id", id).single()
    m = data
  }

  if (!m) return <div className="p-10">Membro não encontrado: {id}</div>

  const Field = ({ label, value }) => (
    <div className="flex flex-col">
      <span className="text-[11px] text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-[13px] font-medium text-gray-800 mt-1">{value || "---"}</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f4f5f4] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/membros" className="text-sm text-[#0F3A1F] font-bold">← Voltar</Link>

        <div className="mt-4 bg-white rounded-2xl shadow-sm border overflow-hidden">
          {/* HEADER VERDE */}
          <div className="bg-[#0F3A1F] text-white p-6 flex gap-6 items-center">
            <div className="w-24 h-28 bg-white/10 rounded-xl overflow-hidden border border-white/20">
              {m.foto_url? <img src={m.foto_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-xs">Sem foto</div>}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold leading-tight">{m.nome_completo}</h1>
              <p className="text-sm opacity-80 mt-1">Rol: {m.numero_rol || "---"} • CPF: {m.cpf || "---"} • {m.categoria_membro || m.tipo_membro}</p>
              {m.oficial_tipo && <span className="inline-block mt-2 bg-white text-[#0F3A1F] text-[11px] font-bold px-3 py-1 rounded-full uppercase">{m.oficial_tipo}</span>}
            </div>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="font-bold text-[#0F3A1F] border-b pb-2">Dados Pessoais</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Data Nascimento" value={m.data_nascimento? new Date(m.data_nascimento).toLocaleDateString('pt-BR') : null} />
                <Field label="Sexo" value={m.sexo} />
                <Field label="Estado Civil" value={m.estado_civil} />
                <Field label="Escolaridade" value={m.escolaridade} />
                <Field label="Profissão" value={m.profissao} />
                <Field label="Filiação Pai" value={m.filiacao_pai} />
                <Field label="Filiação Mãe" value={m.filiacao_mae} />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-bold text-[#0F3A1F] border-b pb-2">Dados Eclesiásticos</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipo Membro" value={m.tipo_membro} />
                <Field label="Categoria" value={m.categoria_membro} />
                <Field label="Oficial" value={m.oficial_tipo} />
                <Field label="Data Admissão" value={m.data_admissao? new Date(m.data_admissao).toLocaleDateString('pt-BR') : null} />
                <Field label="Forma Admissão" value={m.forma_admissao_nao_comungante || m.forma_admissao_comungante} />
                <Field label="Batismo" value={m.data_batismo? new Date(m.data_batismo).toLocaleDateString('pt-BR') : null} />
                <Field label="Cidade" value={m.cidade} />
                <Field label="Endereço" value={m.endereco} />
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t flex gap-3">
            <Link href={`/membros/${m.id}/carteira`} className="flex-1 bg-[#0F3A1F] text-white text-center py-3 rounded-xl font-bold text-sm">Emitir Carteira</Link>
            <Link href={`/validar/${m.id}`} className="flex-1 bg-white border text-center py-3 rounded-xl font-bold text-sm">Validar QR</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
