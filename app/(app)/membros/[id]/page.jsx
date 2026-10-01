export const dynamic = 'force-dynamic'
export const revalidate = 0

import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSessionUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import Link from "next/link"

async function getMembro(id) {
  const { data } = await supabaseAdmin
    .from('membros_oficial')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

async function salvarAction(formData) {
  "use server"
  const id = formData.get('id')
  const numero_rol = formData.get('numero_rol')
  const cpf = formData.get('cpf')
  const filiacao_pai = formData.get('filiacao_pai')
  const filiacao_mae = formData.get('filiacao_mae')
  const telefone = formData.get('telefone')
  const data_admissao = formData.get('data_admissao')

  const update = {
    cpf: cpf || null,
    filiacao_pai: filiacao_pai || null,
    filiacao_mae: filiacao_mae || null,
    telefone: telefone || null,
    data_admissao: data_admissao || null,
  }

  // Só salva numero_rol se preencher
  if (numero_rol) {
    update.numero_rol = parseInt(numero_rol)
  }

  const { error } = await supabaseAdmin
    .from('membros_oficial')
    .update(update)
    .eq('id', id)

  if (error) {
    console.log('Erro ao salvar:', error.message)
  }

  revalidatePath(`/membros/${id}`)
  revalidatePath('/membros')
}

export default async function FichaMembro({ params }) {
  const user = await getSessionUser()
  if (!user) return <div className="p-6">Não autenticado</div>

  const membro = await getMembro(params.id)

  if (!membro) {
    return <div className="p-6">Membro não encontrado</div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/membros" className="text-blue-600 text-sm mb-4 inline-block">
        ← Voltar para lista
      </Link>

      <h1 className="text-2xl font-bold mb-2">{membro.nome_completo}</h1>
      <p className="text-gray-500 mb-6">Rol: {membro.numero_rol ?? 'a definir'} • {membro.status} • {membro.tipo_membro}</p>

      <form action={salvarAction} className="bg-white border rounded p-6 grid grid-cols-2 gap-4">
        <input type="hidden" name="id" value={membro.id} />

        <label className="flex flex-col text-sm font-medium">
          Nº do Rol (deixe vazio por enquanto)
          <input name="numero_rol" type="number" defaultValue={membro.numero_rol || ''} placeholder="A definir" className="border p-2 rounded mt-1 font-normal" />
        </label>

        <label className="flex flex-col text-sm font-medium">
          CPF
          <input name="cpf" defaultValue={membro.cpf || ''} className="border p-2 rounded mt-1 font-normal" />
        </label>

        <label className="flex flex-col text-sm font-medium col-span-2">
          Filiação Pai
          <input name="filiacao_pai" defaultValue={membro.filiacao_pai || ''} className="border p-2 rounded mt-1 font-normal" />
        </label>

        <label className="flex flex-col text-sm font-medium col-span-2">
          Filiação Mãe
          <input name="filiacao_mae" defaultValue={membro.filiacao_mae || ''} className="border p-2 rounded mt-1 font-normal" />
        </label>

        <label className="flex flex-col text-sm font-medium">
          Telefone / WhatsApp
          <input name="telefone" defaultValue={membro.telefone || ''} className="border p-2 rounded mt-1 font-normal" />
        </label>

        <label className="flex flex-col text-sm font-medium">
          Data Admissão
          <input name="data_admissao" type="date" defaultValue={membro.data_admissao || ''} className="border p-2 rounded mt-1 font-normal" />
        </label>

        <div className="col-span-2 mt-4">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Salvar
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded text-sm">
        <p><strong>ID:</strong> {membro.id}</p>
        <p><strong>Foto URL:</strong> {membro.foto_url || 'sem foto'}</p>
        <p><strong>Email:</strong> {membro.email || '-'}</p>
      </div>
    </div>
  )
}
