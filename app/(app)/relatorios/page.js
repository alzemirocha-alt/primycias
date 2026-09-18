import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSessionUser } from "@/lib/auth"
import FormRelatorio from "./FormRelatorio"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PageRelatorios(){
  const eu = await getSessionUser()
  if (!eu) return <div className="p-6">Faça login</div>

  // CORREÇÃO: TRAZ PERIODO DO CULTO (manha/noite) JUNTO - PRA SEPARAR NO RELATÓRIO
  const { data: registrosAll } = await supabaseAdmin
  .from('records')
  .select('*, cultos!records_culto_id_fkey(data, periodo)')
  .eq('status', 'validado')
  .order('data_culto', { ascending: true })
  .order('created_at', { ascending: true })

  // --- TRAVA: DIÁCONO SÓ VÊ O QUE PARTICIPOU (EXCETO TESOUREIRO) ---
  const oficio = String(eu.oficio || eu.cargo || '').toLowerCase()
  const funcao = String(eu.funcao || '').toLowerCase()
  const nomeLower = String(eu.nome || '').toLowerCase()
  const meuId = String(eu.id)

  const isTesoureiro = funcao.includes('tesour') || oficio.includes('tesour') || nomeLower.includes('gilson')
  const isPastor = oficio.includes('pastor')
  const isDiacono = oficio.includes('diacono')

  function participei(r){
    const ids = [r.primeiro_diacono_id, r.segundo_diacono_id, r.diacono_id, r.criado_por, r.diacono1_id, r.diacono2_id, r.lancado_por].map(v=>String(v||''))
    if(ids.includes(meuId)) return true
    const nomes = [r.diacono1_nome, r.diacono2_nome, r.tesoureiro_nome].map(v=>String(v||'').toLowerCase())
    if(nomes.some(n=> n && (n.includes(nomeLower) || nomeLower.includes(n)))) return true
    if(Array.isArray(r.historico)){
      const hist = r.historico.map(h=> String(h.usuario||h.usuario_nome||'').toLowerCase()).join(' ')
      if(hist.includes(nomeLower)) return true
    }
    return false
  }

  let registros = registrosAll || []
  if(!isTesoureiro && !isPastor && isDiacono){
    registros = registros.filter(r=> participei(r))
  }

  let igreja = null
  try{
    const { data } = await supabaseAdmin.from('church_settings').select('*').limit(1).single()
    igreja = data
  }catch{}
  if(!igreja){
    try{
      const { data } = await supabaseAdmin.from('dados_igreja').select('*').limit(1).single()
      igreja = data
    }catch{}
  }

  return <FormRelatorio eu={eu} registros={registros} igreja={igreja} />
}
