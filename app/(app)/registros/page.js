import Link from "next/link"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

async function criarRegistro(formData) {
  "use server"
  const me = await getSessionUser()
  if (!me) redirect("/login")

  const nome = String(formData.get("nome") || "").trim()
  const tipo = String(formData.get("tipo") || "dizimo")
  const valor = Number(formData.get("valor"))
  const data_culto = String(formData.get("data_culto") || new Date().toISOString().split('T')[0])

  if (!nome ||!valor) throw new Error("Preencha nome e valor")

  // 1. Cria o registro do culto
  const { data: rec, error: errRec } = await supabaseAdmin
   .from("records")
   .insert({
      igreja_id: me.igreja_id,
      diacono_id: me.id,
      data_culto: data_culto,
      status: "lancado",
    })
   .select()
   .single()

  if (errRec) throw new Error("Erro ao criar culto: " + errRec.message)

  // 2. Cria o item - COLUNA CORRETA É 'nome' (não membro_nome)
  const { error: errItem } = await supabaseAdmin.from("record_items").insert({
    record_id: rec.id,
    tipo: tipo,
    nome: nome,
    valor: valor,
  })

  if (errItem) throw new Error("Erro ao criar item: " + errItem.message)

  redirect("/registros")
}

export default function NovoRegistroPage() {
  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div className="p-6 max-w-xl">
      <Link href="/registros" className="text-sm text-gray-600 hover:underline">
        ← Voltar para registros
      </Link>

      <h1 className="text-2xl font-bold mt-4">Lançar Dízimo / Oferta</h1>
      <p className="text-gray-500 text-sm mt-1">Preencha os dados do culto</p>

      <form action={criarRegistro} className="mt-6 flex flex-col gap-4 bg-white border rounded-xl p-6 shadow-sm">

        <div>
          <label className="text-sm font-medium">Data do Culto</label>
          <input name="data_culto" type="date" defaultValue={hoje} required className="mt-1 w-full border rounded-lg p-3" />
        </div>

        <div>
          <label className="text-sm font-medium">Nome do Membro</label>
          <input name="nome" placeholder="Ex: Valdecy Santana" required defaultValue="Valdecy Santana" className="mt-1 w-full border rounded-lg p-3" />
        </div>

        <div>
          <label className="text-sm font-medium">Tipo</label>
          <select name="tipo" className="mt-1 w-full border rounded-lg p-3">
            <option value="dizimo">Dízimo</option>
            <option value="oferta">Oferta</option>
            <option value="oferta_especial">Oferta Especial</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Valor R$</label>
          <input name="valor" type="number" step="0.01" placeholder="10.00" required className="mt-1 w-full border rounded-lg p-3" />
        </div>

        <button type="submit" className="mt-2 bg-[#1a4d2e] text-white font-semibold py-3 rounded-lg hover:bg-[#143d24]">
          Salvar Registro
        </button>
      </form>
    </div>
  )
}
