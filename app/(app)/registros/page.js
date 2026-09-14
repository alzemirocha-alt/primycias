import Link from "next/link"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

async function criar(formData) {
  "use server"
  const me = await getSessionUser()
  if (!me) redirect("/login")

  const valor = Number(formData.get("valor"))
  const nome = formData.get("nome")
  const tipo = formData.get("tipo")

  // 1. Cria o culto
  const { data: rec, error: err1 } = await supabaseAdmin.from("records").insert({
    igreja_id: me.igreja_id,
    diacono_id: me.id,
    data_culto: new Date().toISOString().split('T')[0],
    status: "lancado",
  }).select().single()

  if (err1) throw new Error(err1.message)

  // 2. Cria o item (COLUNA CERTA = nome)
  const { error: err2 } = await supabaseAdmin.from("record_items").insert({
    record_id: rec.id,
    tipo: tipo,
    nome: nome,
    valor: valor,
  })

  if (err2) throw new Error(err2.message)

  redirect("/registros")
}

export default async function NovoRegistroPage() {
  return (
    <div style={{ padding: 20 }}>
      <Link href="/registros">← Voltar</Link>
      <h2 style={{ marginTop: 10 }}>Lançar Dízimo / Oferta</h2>

      <form action={criar} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400, marginTop: 20 }}>
        <label>
          Nome do membro
          <input name="nome" required defaultValue="Valdecy Santana" style={{ width: '100%', padding: 10, marginTop: 4 }} />
        </label>

        <label>
          Tipo
          <select name="tipo" style={{ width: '100%', padding: 10, marginTop: 4 }}>
            <option value="dizimo">Dízimo</option>
            <option value="oferta">Oferta</option>
          </select>
        </label>

        <label>
          Valor (R$)
          <input name="valor" type="number" step="0.01" required defaultValue="10" style={{ width: '100%', padding: 10, marginTop: 4 }} />
        </label>

        <button type="submit" style={{ background: '#1a4d2e', color: 'white', padding: 12, border: 0, borderRadius: 6, cursor: 'pointer', marginTop: 10 }}>
          Salvar
        </button>
      </form>
    </div>
  )
}
