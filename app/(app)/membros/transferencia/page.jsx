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

  function getFormaIndividual(membro, formaComungante){
    const tipo = (membro.tipo_membro || membro.categoria_membro || '').toLowerCase()
    const isComungante = tipo.includes('comungante') &&!tipo.includes('nao') &&!tipo.includes('não')
    if(isComungante) return formaComungante
    return 'Transferência a pedido dos Pais ou Responsáveis e, na falta destes, a Juízo do Conselho - Art. 19, parágrafo único CI/IPB'
  }

  async function buscar(e) {
    const termo = typeof e === 'string'? e : e.target.value
    if (typeof e!== 'string') setBusca(termo)
    if (termo.length < 2) { setResultados([]); return }
    const res = await fetch(`/api/membros/busca?q=${encodeURIComponent(termo)}`)
    const data = await res.json()
    setResultados(data || [])
  }

  async function selecionarMembro(m) {
    setSelecionado(m)
    setResultados([])
    setBusca(m.nome_completo)
    setFamilia([])
    setIncluir({})
    // BUSCA FAMILIA PELA API
    const res = await fetch(`/api/membros/familia?id=${m.id}&nome=${encodeURIComponent(m.nome_completo)}`)
    const dataFam = await res.json()
    setFamilia(dataFam || [])
  }

  async function emitirCarta() {
    if(!selecionado ||!igrejaDestino) return alert('Selecione membro e igreja destino')
    setLoading(true)
    const membrosParaCarta = [selecionado,...familia.filter(f=> incluir[f.id])]
    const {data: carta, error} = await supabase.from('cartas_transferencia').insert({
      igreja_id: selecionado.igreja_id,
      igreja_destino: igrejaDestino,
      forma_transferencia: forma,
      data_emissao: new Date().toISOString().split('T')[0]
    }).select().single()
    if(error){ alert(error.message); setLoading(false); return }
    for(const mem of membrosParaCarta){
      const formaInd = getFormaIndividual(mem, forma)
      const isComungante = formaInd === forma
      const formaDemissao = isComungante? 'Carta de Transferência - Art. 23, alínea "d" CI/IPB' : 'Carta dos Pais/Resp. a juízo do Conselho - Art. 24, alínea "a"'
      await supabase.from('cartas_membros').insert({
        carta_id: carta.id,
        membro_id: mem.id,
        nome_completo: mem.nome_completo,
        tipo_membro: mem.tipo_membro || mem.categoria_membro,
        forma_transferencia_individual: formaInd
      })
      await supabase.from('membros_oficial').update({
        status: 'demitido', situacao: 'demitido', status_membro: 'demitido',
        data_demissao: carta.data_emissao, forma_demissao: formaDemissao, data_transferencia: carta.data_emissao
      }).eq('id', mem.id)
    }
    alert('Carta emitida com sucesso!')
    window.location.href = `/membros/relatorios?carta=${carta.id}`
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[#0A3D26]">Transferência de Membros</h1>
      <div className="mt-6 bg-white border rounded-xl p-6">
        <label className="text-sm font-semibold">Pesquisar Membro (auto-preenchimento)</label>
        <div className="flex gap-2 mt-2">
          <input value={busca} onChange={buscar} placeholder="Digite nome do membro..." className="flex-1 border p-3 rounded-lg" />
          <button onClick={()=>buscar(busca)} className="bg-[#0A3D26] text-white px-6 rounded-lg font-bold">Buscar</button>
        </div>
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
              <div className="mt-6 border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="font-bold text-blue-900 mb-3">Familiares encontrados que são membros (comungante ou não comungante). Marque quem vai na mesma carta:</h3>
                <div className="space-y-3">
                  {familia.map(f=>{
                    const formaInd = getFormaIndividual(f, forma)
                    const isComungante = formaInd === forma
                    return (
                      <label key={f.id} className="flex gap-3 bg-white p-4 rounded-lg border shadow-sm cursor-pointer">
                        <input type="checkbox" checked={!!incluir[f.id]} onChange={e=> setIncluir({...incluir, [f.id]: e.target.checked})} className="mt-1" />
                        <div className="flex-1">
                          <div className="font-bold">{f.nome_completo}</div>
                          <div className="text-xs text-gray-600">Tipo: {f.tipo_membro || f.categoria_membro} - Rol: {f.numero_rol||'---'}</div>
                          <div className="text-xs mt-1 p-2 bg-gray-100 rounded"><b>Forma:</b> {formaInd}</div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 border-t pt-6">
              <h3 className="font-bold mb-2">Resumo dos que irão na carta:</h3>
              <div className="bg-gray-50 border rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm"><span>1. {selecionado.nome_completo}</span><span className="text-xs text-gray-600">{getFormaIndividual(selecionado, forma)}</span></div>
                {familia.filter(f=>incluir[f.id]).map((f,i)=>(
                  <div key={f.id} className="flex justify-between text-sm"><span>{i+2}. {f.nome_completo}</span><span className="text-xs text-gray-600">{getFormaIndividual(f, forma)}</span></div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="flex flex-col text-sm">Forma de Transferência (válida para comungantes)
                <select value={forma} onChange={e=>setForma(e.target.value)} className="border p-3 rounded-lg mt-1">
                  <option>Carta de Transferência com Destino Determinado - Art. 18, alínea "a" CI/IPB</option>
                  <option>Jurisdição Ex officio - Art. 18, alínea "b" CI/IPB</option>
                </select>
              </label>
              <label className="flex flex-col text-sm font-bold">Igreja que receberá a carta (pergunta final)
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
