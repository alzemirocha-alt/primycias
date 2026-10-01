import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSessionUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { revalidatePath } from "next/cache"

export const dynamic = 'force-dynamic'

async function getMembro(id) {
  const { data } = await supabaseAdmin.from('membros_oficial').select('*').eq('id', id).single()
  return data
}

async function updateMembro(formData) {
  "use server"
  const id = formData.get('id')
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const dados = {
    nome_completo: formData.get('nome_completo'),
    numero_rol: formData.get('numero_rol') ? parseInt(formData.get('numero_rol')) : null,
    cpf: formData.get('cpf') || null,
    foto_url: formData.get('foto_url') || null,
    filiacao_pai: formData.get('filiacao_pai') || null,
    filiacao_mae: formData.get('filiacao_mae') || null,
    endereco: formData.get('endereco') || null,
    cep: formData.get('cep') || null,
    cidade: formData.get('cidade') || null,
    estado: formData.get('estado') || null,
    cidade_nasc: formData.get('cidade_nasc') || null,
    estado_nasc: formData.get('estado_nasc') || null,
    data_nascimento: formData.get('data_nascimento') || null,
    telefone: formData.get('telefone') || null,
    sexo: formData.get('sexo') || null,
    estado_civil: formData.get('estado_civil') || null,
    nome_conjuge: formData.get('nome_conjuge') || null,
    cpf_conjuge: formData.get('cpf_conjuge') || null,
    data_casamento: formData.get('data_casamento') || null,
    escolaridade: formData.get('escolaridade') || null,
    profissao: formData.get('profissao') || null,
    categoria_membro: formData.get('categoria_membro') || 'comungante',
    oficial_tipo: formData.get('oficial_tipo') || null,
    forma_admissao: formData.get('forma_admissao') || null,
    data_admissao: formData.get('data_admissao') || null,
    data_batismo: formData.get('data_batismo') || null,
    local_batismo: formData.get('local_batismo') || null,
    pastor_batismo: formData.get('pastor_batismo') || null,
    data_profissao_fe: formData.get('data_profissao_fe') || null,
    local_profissao_fe: formData.get('local_profissao_fe') || null,
    pastor_profissao_fe: formData.get('pastor_profissao_fe') || null,
    data_ordenacao: formData.get('data_ordenacao') || null,
    data_instalacao: formData.get('data_instalacao') || null,
    status: formData.get('status') || 'ativo',
    tipo_membro: formData.get('categoria_membro') || 'comungante'
  }

  // vincula cônjuge se tiver CPF
  if (dados.cpf_conjuge) {
    const { data: conj } = await supabaseAdmin.from('membros_oficial').select('id').eq('cpf', dados.cpf_conjuge).maybeSingle()
    if (conj) dados.conjuge_membro_id = conj.id
  }

  await supabaseAdmin.from('membros_oficial').update(dados).eq('id', id)
  revalidatePath('/membros')
  revalidatePath(`/membros/${id}`)
}

export default async function Page({ params }) {
  const { id } = await params
  const m = await getMembro(id)
  if (!m) return <div className="p-6">Membro não encontrado</div>

  return (
    <div className="p-6 max-w-5xl mx-auto pb-20">
      <Link href="/membros" className="text-sm text-blue-600">← Voltar para lista</Link>
      <div className="flex justify-between items-start mt-2 mb-4">
        <div>
          <h1 className="text-2xl font-bold">{m.nome_completo}</h1>
          <p className="text-sm text-gray-500">Rol: {m.numero_rol || 'a definir'} • {m.status} • {m.categoria_membro || m.tipo_membro}</p>
        </div>
        <Link href={`/membros/${m.id}/carteira`} className="bg-[#0F3A1F] text-white px-4 py-2 rounded text-sm">Emitir Carteira de Membro</Link>
      </div>

      <form action={updateMembro} className="space-y-8 bg-white border rounded p-6">
        <input type="hidden" name="id" value={m.id} />
        
        <div>
          <h2 className="font-semibold text-[#0F3A1F] border-b pb-2 mb-4">1. Dados Pessoais</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="col-span-2 flex flex-col text-sm">Nome Completo<input name="nome_completo" defaultValue={m.nome_completo} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Nº Cadastro<input name="numero_rol" type="number" defaultValue={m.numero_rol} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">CPF<input name="cpf" defaultValue={m.cpf} className="border p-2 rounded mt-1" /></label>
            <label className="col-span-2 flex flex-col text-sm">Foto URL<input name="foto_url" defaultValue={m.foto_url} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Filiação Pai<input name="filiacao_pai" defaultValue={m.filiacao_pai} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Filiação Mãe<input name="filiacao_mae" defaultValue={m.filiacao_mae} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Data Nasc.<input name="data_nascimento" type="date" defaultValue={m.data_nascimento} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Sexo<select name="sexo" defaultValue={m.sexo} className="border p-2 rounded mt-1"><option value="">Selecione</option><option value="masculino">Masculino</option><option value="feminino">Feminino</option></select></label>
            <label className="flex flex-col text-sm">Cidade Nasc.<input name="cidade_nasc" defaultValue={m.cidade_nasc} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Estado Nasc.<input name="estado_nasc" defaultValue={m.estado_nasc} className="border p-2 rounded mt-1" /></label>
            <label className="col-span-2 flex flex-col text-sm">Endereço<input name="endereco" defaultValue={m.endereco} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">CEP<input name="cep" defaultValue={m.cep} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Telefone<input name="telefone" defaultValue={m.telefone} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Cidade<input name="cidade" defaultValue={m.cidade} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Estado<input name="estado" defaultValue={m.estado} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Estado Civil<select name="estado_civil" defaultValue={m.estado_civil} className="border p-2 rounded mt-1"><option value="">Selecione</option><option value="solteiro">Solteiro(a)</option><option value="casado">Casado(a)</option><option value="divorciado">Divorciado(a)</option><option value="viuvo">Viúvo(a)</option></select></label>
            <label className="flex flex-col text-sm">Escolaridade<input name="escolaridade" defaultValue={m.escolaridade} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Profissão<input name="profissao" defaultValue={m.profissao} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Nome Cônjuge<input name="nome_conjuge" defaultValue={m.nome_conjuge} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">CPF Cônjuge<input name="cpf_conjuge" defaultValue={m.cpf_conjuge} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Data Casamento<input name="data_casamento" type="date" defaultValue={m.data_casamento} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Status<select name="status" defaultValue={m.status} className="border p-2 rounded mt-1"><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="demitido">Demitido</option></select></label>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-[#0F3A1F] border-b pb-2 mb-4">2. Dados Eclesiásticos</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col text-sm">Categoria<select name="categoria_membro" defaultValue={m.categoria_membro || m.tipo_membro} className="border p-2 rounded mt-1"><option value="comungante">Comungante</option><option value="comungante_oficial">Comungante e Oficial</option><option value="nao_comungante">Não Comungante</option></select></label>
            <label className="flex flex-col text-sm">Oficial<select name="oficial_tipo" defaultValue={m.oficial_tipo} className="border p-2 rounded mt-1"><option value="">Nenhum</option><option value="diacono">Diácono</option><option value="presbitero">Presbítero</option></select></label>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-[#0F3A1F] border-b pb-2 mb-4">3. Admissão e Ordenação</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col text-sm">Data Admissão<input name="data_admissao" type="date" defaultValue={m.data_admissao} className="border p-2 rounded mt-1" /></label>
            <label className="col-span-2 flex flex-col text-sm">Forma Admissão<input name="forma_admissao" defaultValue={m.forma_admissao} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Data Batismo<input name="data_batismo" type="date" defaultValue={m.data_batismo} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Local Batismo<input name="local_batismo" defaultValue={m.local_batismo} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Pastor Batismo<input name="pastor_batismo" defaultValue={m.pastor_batismo} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Data Prof. Fé<input name="data_profissao_fe" type="date" defaultValue={m.data_profissao_fe} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Local Prof. Fé<input name="local_profissao_fe" defaultValue={m.local_profissao_fe} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Pastor Prof. Fé<input name="pastor_profissao_fe" defaultValue={m.pastor_profissao_fe} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Data Ordenação<input name="data_ordenacao" type="date" defaultValue={m.data_ordenacao} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Data Instalação<input name="data_instalacao" type="date" defaultValue={m.data_instalacao} className="border p-2 rounded mt-1" /></label>
          </div>
        </div>

        <button className="w-full py-3 bg-[#0F3A1F] text-white rounded font-semibold">Salvar Ficha Completa</button>
      </form>
      <div className="mt-4 text-xs text-gray-500">ID: {m.id} • Foto URL: {m.foto_url || 'sem foto'}</div>
    </div>
  )
}
