"use client"
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function TransferenciaPage() {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [selecionado, setSelecionado] = useState(null)
  const [familia, setFamilia] = useState([])
  const [incluir, setIncluir] = useState({})
  const [igrejaDestino, setIgrejaDestino] = useState('')
  const [forma, setForma] = useState('Carta de Transferência com Destino Determinado - Art. 18, alínea "a" CI/IPB')
  const [loading, setLoading] = useState(false)

  async function buscar(e) {
    const termo = e.target.value
    setBusca(termo)
    if(termo.length < 2) return
    const {data} = await supabase.from('membros_oficial').select('*').ilike('nome_completo', `%${termo}%`).eq('status','ativo').limit(10)
    setResultados(data || [])
  }

  async function selecionarMembro(m) {
    setSelecionado(m)
    setResultados([])
    setBusca(m.nome_completo)
    
    // BUSCA FAMILIA PELOS NOMES DOS PAIS E CONJUGE
    let fam = []

    // 1. Conjuge pelo ID
    if(m.conjuge_membro_id || m.conjuge_id){
      const idConj = m.conjuge_membro_id || m.conjuge_id
      const {data} = await supabase.from('membros_oficial').select('*').eq('id', idConj).eq('status','ativo')
      if(data) fam.push(...data)
    }
    // 2. Conjuge pelo nome
    if(m.conjuge_nome || m.nome_conjuge){
      const nomeConj = m.conjuge_nome || m.nome_conjuge
      const {data} = await supabase.from('membros_oficial').select('*').ilike('nome_completo', `%${nomeConj}%`).eq('status','ativo')
      if(data) fam.push(...data)
    }
    // 3. Quem tem ele como conjuge
    const {data: quemTemEleComoConjuge} = await supabase.from('membros_oficial').select('*').ilike('conjuge_nome', `%${m.nome_completo}%`).eq('status','ativo')
    if(quemTemEleComoConjuge) fam.push(...quemTemEleComoConjuge)

    // 4. Filhos - quem tem ele como pai ou mae
    const {data: filhos} = await supabase.from('membros_oficial').select('*').or(`filiacao_pai.ilike.%${m.nome_completo}%,filiacao_mae.ilike.%${m.nome_completo}%`).eq('status','ativo')
    if(filhos) fam.push(...filhos)

    // 5. Pais - se os pais dele sao membros
    if(m.filiacao_pai){
      const {data: pai} = await supabase.from('membros_oficial').select('*').ilike('nome_completo', `%${m.filiacao_pai}%`).eq('status','ativo')
      if(pai) fam.push(...pai)
    }
    if(m.filiacao_mae){
      const {data: mae} = await supabase.from('membros_oficial').select('*').ilike('nome_completo', `%${m.filiacao_mae}%`).eq('status','ativo')
      if(mae) fam.push(...mae)
    }

    // remove duplicados e ele mesmo
    const unicos = fam.filter((v,i,a)=>a.findIndex(t=>t.id===v.id)===i && v.id!== m.id)
    setFamilia(unicos)
  }

  async function emitirCarta() {
    if(!selecionado || !igrejaDestino) return alert('Selecione membro e igreja destino')
    setLoading(true)

    // Lista final de membros
    const membrosParaCarta = [selecionado, ...familia.filter(f=> incluir[f.id])]

    // 1. Cria carta
    const {data: carta, error} = await supabase.from('cartas_transferencia').insert({
      igreja_id: selecionado.igreja_id,
      igreja_destino: igrejaDestino,
      forma_transferencia: forma,
      data_emissao: new Date().toISOString().split('T')[0]
    }).select().single()

    if(error){ alert(error.message); setLoading(false); return }

    // 2. Salva membros da carta e demite
    for(const mem of membrosParaCarta){
      const isComungante = (mem.tipo_membro || mem.categoria_membro || '').toLowerCase().includes('comungante') && !(mem.tipo_membro||'').includes('nao')
      const formaInd = isComungante ? forma : 'Transferência a pedido dos Pais ou Responsáveis e, na falta destes, a Juízo do Conselho - Art. 19, parágrafo único CI/IPB'
      const formaDemissao = isComungante 
        ? 'Carta de Transferência - Art. 23, alínea "d" CI/IPB'
        : 'Carta dos Pais/Resp. a juízo do Conselho - Art. 24, alínea "a"'

      await supabase.from('cartas_membros').insert({
        carta_id: carta.id,
        membro_id: mem.id,
        nome_completo: mem.nome_completo,
        tipo_membro: mem.tipo_membro || mem.categoria_membro,
        forma_transferencia_individual: formaInd
      })

      await supabase.from('membros_oficial').update({
        status: 'demitido',
        situacao: 'demitido',
        status_membro: 'demitido',
        data_demissao: carta.data_emissao,
        forma_demissao: formaDemissao,
        data_transferencia: carta.data_emissao
      }).eq('id', mem.id)
    }

    alert('Carta emitida com sucesso! Membros foram demitidos automaticamente.')
    window.location.href = `/membros/relatorios?carta=${carta.id}`
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[#0A3D26]">Transferência de Membros</h1>
      
      <div className="mt-6 bg-white border rounded-xl p-6">
        <label className="text-sm font-semibold">Pesquisar Membro (auto-preenchimento)</label>
        <input value={busca} onChange={buscar} placeholder="Digite nome do membro..." className="w-full border p-3 rounded-lg mt-2" />
        {resultados.length>0 && (
          <div className="border rounded-lg mt-2 max-h-60 overflow-auto">
            {resultados.map(r=>(
              <div key={r.id} onClick={()=>selecionarMembro(r)} className="p-3 hover:bg-gray-100 cursor-pointer border-b">
                <b>{r.nome_completo}</b> <span className="text-xs text-gray-500">- {r.tipo_membro} - Rol {r.numero_rol||'---'}</span>
              </div>
            ))}
          </div>
        )}

        {selecionado && (
          <div className="mt-6">
            <div className="bg-green-50 border border-green-600 rounded-lg p-4">
              <b>Selecionado:</b> {selecionado.nome_completo} ({selecionado.tipo_membro})<br/>
              <span className="text-xs">Pai: {selecionado.filiacao_pai||'---'} | Mãe: {selecionado.filiacao_mae||'---'} | Cônjuge: {selecionado.conjuge_nome||selecionado.nome_conjuge||'---'}</span>
            </div>

            {familia.length>0 && (
              <div className="mt-4 border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="font-bold text-blue-900">Encontramos familiares. Deseja incluir na carta?</h3>
                {familia.map(f=>(
                  <label key={f.id} className="flex items-center gap-3 mt-3 bg-white p-3 rounded border">
                    <input type="checkbox" checked={!!incluir[f.id]} onChange={e=> setIncluir({...incluir, [f.id]: e.target.checked})} />
                    <div>
                      <b>{f.nome_completo}</b> <span className="text-xs">({f.tipo_membro} - {f.filiacao_pai===selecionado.nome_completo?'Filho(a)': f.filiacao_mae===selecionado.nome_completo?'Filho(a)':'Cônjuge/Parente'})</span><br/>
                      <span className="text-xs text-gray-500">Tipo: {f.tipo_membro}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="mt-6 grid gap-4">
              <label className="flex flex-col text-sm">Forma de Transferência (comungante)
                <select value={forma} onChange={e=>setForma(e.target.value)} className="border p-3 rounded-lg mt-1">
                  <option>Carta de Transferência com Destino Determinado - Art. 18, alínea "a" CI/IPB</option>
                  <option>Jurisdição Ex officio - Art. 18, alínea "b" CI/IPB</option>
                  <option>Transferência a pedido dos Pais ou Responsáveis e, na falta destes, a Juízo do Conselho - Art. 19, parágrafo único CI/IPB</option>
                </select>
              </label>
              <label className="flex flex-col text-sm">Igreja que receberá a carta
                <input value={igrejaDestino} onChange={e=>setIgrejaDestino(e.target.value)} placeholder="Ex: Igreja Presbiteriana de..." className="border p-3 rounded-lg mt-1" />
              </label>
              <button onClick={emitirCarta} disabled={loading} className="w-full py-4 bg-[#0A3D26] text-white rounded-lg font-bold mt-4">
                {loading?'Gerando...':'Salvar e Emitir Carta de Transferência'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
