export const dynamic = 'force-dynamic'
export const revalidate = 0

import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSessionUser } from "@/lib/auth"
import { isAdmin } from "@/lib/constants"
import { redirect } from "next/navigation"
import Link from "next/link"
import { revalidatePath } from "next/cache"

async function criarMembro(formData) {
  "use server"
  const nome_completo = formData.get('nome_completo')
  const numero_rol = formData.get('numero_rol')
  const cpf = formData.get('cpf')
  const filiacao_pai = formData.get('filiacao_pai')
  const filiacao_mae = formData.get('filiacao_mae')
  const telefone = formData.get('telefone')
  const data_admissao = formData.get('data_admissao')
  const status = formData.get('status') || 'ativo'
  const tipo_membro = formData.get('tipo_membro') || 'membro'

  if (!nome_completo) {
    throw new Error('Nome é obrigatório')
  }

  const insert = {
    nome_completo,
    status,
    tipo_membro,
    cpf: cpf || null,
    filiacao_pai: filiacao_pai || null,
    filiacao_mae: filiacao_mae || null,
    telefone: telefone || null,
    data_admissao: data_admissao || null,
  }

  if (numero_rol) {
    insert.numero_rol = parseInt(numero_rol)
  }

  const { data, error } = await supabaseAdmin
   .from('membros_oficial')
   .insert([insert])
   .select()
   .single()

  if (error) {
    console.log('Erro ao criar:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/membros')
  redirect(`/membros/${data.id}`)
}

export default async function NovoMembroPage() {
  const user = await getSessionUser()
  if (!user) return <div className="p-6">Não autenticado</div>

  const funcaoPresb = (user.funcao_presbitero || '').toLowerCase()
  const isSecretario = funcaoPresb.includes('secretario')
  if (!isAdmin(user) &&!isSecretario) {
    redirect("/dashboard")
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/membros" className="text-blue-600 text-sm mb-4 inline-block">
        ← Voltar para lista
      </Link>

      <h1 className="text-2xl font-bold mb-6">Novo Membro</h1>

      <form action={criarMembro} className="bg-white border rounded p-6 grid grid-cols-2 gap-4">
        <label className="flex flex-col text-sm font-medium col-span-2">
          Nome Completo *
          <input name="nome_completo" required placeholder="Nome completo do membro" className="border p-2 rounded mt-1 font-normal" />
        </label>

        <label className="flex flex-col text-sm font-medium">
          Nº do Rol
          <input name="numero_rol" type="number" placeholder="A definir ou número" className="border p-2 rounded mt-1 font-normal" />
        </label>

        <label className="flex flex-col text-sm font-medium">
          CPF
          <input name="cpf" placeholder="000.000.000-00" className="border p-2 rounded mt-1 font-normal" />
        </label>

        <label className="flex flex-col text-sm font-medium col-span-2">
          Filiação Pai
          <input name="filiacao_pai" placeholder="Nome do pai" className="border p-2 rounded mt-1 font-normal" />
        </label>

        <label className="flex flex-col text-sm font-medium col-span-2">
          Filiação Mãe
          <input name="filiacao_mae" placeholder="Nome da mãe" className="border p-2 rounded mt-1 font-normal" />
        </label>

        <label className="flex flex-col text-sm font-medium">
          Telefone / WhatsApp
          <input name="telefone" placeholder="(00) 00000-0000" className="border p-2 rounded mt-1 font-normal" />
        </label>

        <label className="flex flex-col text-sm font-medium">
          Data Admissão
          <input name="data_admissao" type="date" className="border p-2 rounded mt-1 font-normal" />
        </label>

        <label className="flex flex-col text-sm font-medium">
          Status
          <select name="status" className="border p-2 rounded mt-1 font-normal">
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="disciplinado">Disciplinado</option>
          </select>
        </label>

        <label className="flex flex-col text-sm font-medium">
          Tipo
          <select name="tipo_membro" className="border p-2 rounded mt-1 font-normal">
            <option value="membro">Membro</option>
            <option value="congregado">Congregado</option>
            <option value="visitante">Visitante</option>
          </select>
        </label>

        <div className="col-span-2 mt-4">
          <button type="submit" className="bg-[#0F3A1F] text-white px-6 py-2 rounded hover:bg-[#133e23] w-full md:w-auto">
            Salvar Novo Membro
          </button>
        </div>
      </form>
    </div>
  )
}
