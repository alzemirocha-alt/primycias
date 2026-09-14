import Link from "next/link"
import { getSessionUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { revalidatePath } from "next/cache"

async function confirmarSegundo(formData) {
  "use server"
  const me = await getSessionUser()
  const id = formData.get("id")
  await supabaseAdmin.from("records").update({
    diacono2_nome: me.nome,
    diacono2_at: new Date().toISOString(),
    status: "aguardando_tesoureiro"
  }).eq("id", id)
  revalidatePath("/registros")
}

async function validarTesoureiro(formData) {
  "use server"
  const me = await getSessionUser()
  const id = formData.get("id")
  await supabaseAdmin.from("records").update({
    tesoureiro_nome: me.nome,
    tesoureiro_at: new Date().toISOString(),
    status: "aguardando_pastor"
  }).eq("id", id)
  revalidatePath("/registros")
}

async function reportarErro(formData) {
  "use server"
  const id = formData.get("id")
  const motivo = formData.get("motivo")
  await supabaseAdmin.from("records").update({
    status: "erro_reportado",
    motivo_erro: motivo
  }).eq("id", id)
  revalidatePath("/registros")
}

export default async function RegistrosPage() {
  const me = await getSessionUser()
  const { data: records } = await supabaseAdmin
    .from("records")
    .select("*, record_items(*)")
    .eq("igreja_id", me.igreja_id)
    .order("created_at", { ascending: false })

  return (
    <div style={{ padding: 20, maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>Dízimos e Ofertas - {records?.length || 0}</h2>
        {me.oficio === 'diacono' && (
          <Link href="/registros/novo" style={{ background: '#1a4d2e', color: 'white', padding: '10px 15px', borderRadius: 6, textDecoration: 'none' }}>
            + Lançar registro
          </Link>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        {records?.map((r) => {
          const total = r.record_items?.reduce((s, i) => s + Number(i.valor), 0) || 0
          return (
            <div key={r.id} style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16, marginBottom: 16, background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <b>{r.data_culto} - R$ {total.toFixed(2)}</b>
                <span style={{ background: '#eee', padding: '2px 8px', borderRadius: 10, fontSize: 12 }}>{r.status}</span>
              </div>

              {r.record_items?.map((it) => (
                <div key={it.id} style={{ marginTop: 4, fontSize: 14 }}>- {it.tipo}: {it.nome} - R$ {it.valor}</div>
              ))}

              {/* LINHA DO TEMPO QUE VOCÊ PEDIU */}
              <div style={{ marginTop: 12, padding: 10, background: '#f9f9f9', borderRadius: 8, fontSize: 13 }}>
                <div>✅ <b>Lançado por:</b> {r.diacono1_nome || 'Diácono 1'} em {new Date(r.diacono1_at || r.created_at).toLocaleString('pt-BR')}</div>
                
                {r.diacono2_nome ? (
                  <div>✅ <b>Confirmado por (2º diácono):</b> {r.diacono2_nome} em {new Date(r.diacono2_at).toLocaleString('pt-BR')}</div>
                ) : (
                  <div>⏳ <b>Aguardando confirmação do 2º diácono</b></div>
                )}

                {r.tesoureiro_nome && <div>✅ <b>Validado por Tesoureiro:</b> {r.tesoureiro_nome} em {new Date(r.tesoureiro_at).toLocaleString('pt-BR')}</div>}
                {r.motivo_erro && <div style={{ color: 'red' }}>❌ <b>Erro reportado:</b> {r.motivo_erro}</div>}
              </div>

              {/* BOTÕES DE AÇÃO */}
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                {r.status === 'aguardando_segundo' && me.oficio === 'diacono' && (
                  <form action={confirmarSegundo}>
                    <input type="hidden" name="id" value={r.id} />
                    <button style={{ background: '#1a4d2e', color: 'white', padding: '8px 12px', borderRadius: 6, border: 0 }}>Confirmar como 2º Diácono</button>
                  </form>
                )}

                {r.status === 'aguardando_tesoureiro' && me.oficio === 'tesoureiro' && (
                  <>
                    <form action={validarTesoureiro}>
                      <input type="hidden" name="id" value={r.id} />
                      <button style={{ background: '#1a4d2e', color: 'white', padding: '8px 12px', borderRadius: 6, border: 0 }}>Validar</button>
                    </form>
                    <form action={reportarErro} style={{ display: 'flex', gap: 4 }}>
                      <input type="hidden" name="id" value={r.id} />
                      <input name="motivo" placeholder="Motivo do erro" required style={{ padding: 6, border: '1px solid #ccc', borderRadius: 6 }} />
                      <button style={{ background: '#c0392b', color: 'white', padding: '8px 12px', borderRadius: 6, border: 0 }}>Reportar Erro</button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
