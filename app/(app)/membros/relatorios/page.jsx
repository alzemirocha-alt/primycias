"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function RelatoriosPage(){
  const [busca, setBusca] = useState('')
  const [cartas, setCartas] = useState([])
  const [loading, setLoading] = useState(false)
  const [cartaAberta, setCartaAberta] = useState(null)
  const [membros, setMembros] = useState([])

  async function buscar(){
    setLoading(true)
    const { data } = await supabase
      .from('cartas_membros')
      .select('carta_id, nome_completo, cartas_transferencia(*)')
      .ilike('nome_completo', `%${busca}%`)
      .limit(20)
    
    const unicas = {}
    data?.forEach(d=>{
      if(d.cartas_transferencia) unicas[d.carta_id] = d.cartas_transferencia
    })
    setCartas(Object.values(unicas))
    setLoading(false"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function RelatoriosPage(){
  const [cartas, setCartas] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartaAberta, setCartaAberta] = useState(null)
  const [membros, setMembros] = useState([])
  const [busca, setBusca] = useState('')

  async function carregarTodas(){
    setLoading(true)
    const { data } = await supabase
     .from('cartas_transferencia')
     .select('*')
     .order('data_emissao', { ascending: false })
     .limit(100)
    setCartas(data || [])
    setLoading(false)
  }

  useEffect(()=>{ carregarTodas() },[])

  useEffect(()=>{
    const params = new URLSearchParams(window.location.search)
    const id = params.get('carta')
    if(id) abrirCarta(id)
  },[cartas])

  async function abrirCarta(id){
    const { data: c } = await supabase.from('cartas_transferencia').select('*').eq('id', id).single()
    const { data: m } = await supabase.from('cartas_membros').select('*').eq('carta_id', id)
    setCartaAberta(c)
    setMembros(m || [])
    window.scrollTo({top:0, behavior:'smooth'})
  }

  const filtradas = cartas.filter(c =>
    c.igreja_destino?.toLowerCase().includes(busca.toLowerCase()) ||
    c.id?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-[#0A3D26]">Relatórios</h1>
      <p className="text-sm text-gray-500 mb-6">Cartas de transferência emitidas</p>

      {/* LISTA QUE VOCÊ QUERIA DE VOLTA */}
      <div className="bg-white border rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold">Cartas de Transferência Cadastradas</h2>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Filtrar por igreja..." className="border p-2 rounded-lg text-sm w-64" />
        </div>

        {loading? <p>Carregando...</p> : (
          <div className="space-y-2 max-h-[400px] overflow-auto">
            {filtradas.length === 0 && <p className="text-sm text-gray-500">Nenhuma carta encontrada.</p>}
            {filtradas.map(c=>(
              <div key={c.id} onClick={()=>abrirCarta(c.id)} className="flex justify-between items-center border p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div>
                  <b className="text-sm">{c.igreja_destino}</b>
                  <div className="text-xs text-gray-500">{new Date(c.data_emissao).toLocaleDateString('pt-BR')} - {c.id.slice(0,8)}</div>
                </div>
                <span className="text-xs bg-[#0A3D26] text-white px-3 py-1 rounded">Ver / Imprimir</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* IMPRESSÃO */}
      {cartaAberta && (
        <div className="mt-8 bg-white border rounded-xl p-8" id="area-impressao">
          <div className="flex justify-between items-start border-b pb-4">
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-[#0A3D26] rounded flex items-center justify-center text-white font-bold">IPB</div>
              <div>
                <h2 className="font-bold">Igreja Presbiteriana de Sucupira</h2>
                <p className="text-xs text-gray-600">Carta de Transferência</p>
              </div>
            </div>
            <button onClick={()=>window.print()} className="bg-black text-white px-6 py-2 rounded-lg text-sm">Imprimir PDF</button>
          </div>

          <div className="mt-6 text-sm space-y-1">
            <p><b>Destino:</b> {cartaAberta.igreja_destino}</p>
            <p><b>Data de Emissão:</b> {new Date(cartaAberta.data_emissao).toLocaleDateString('pt-BR')}</p>
          </div>

          <h3 className="font-bold mt-6 mb-2">Membros incluídos nesta carta:</h3>
          <ol className="list-decimal ml-6 space-y-3">
            {membros.map((m,i)=>(
              <li key={i} className="text-sm">
                <b>{m.nome_completo}</b> - {m.tipo_membro}<br/>
                <span className="text-xs text-gray-700 italic">{m.forma_transferencia_individual}</span>
              </li>
            ))}
          </ol>

          <div className="mt-20 text-sm">
            <p>Sucupira, {new Date().toLocaleDateString('pt-BR', {day:'numeric', month:'long', year:'numeric'})}</p>
            <div className="mt-16 grid grid-cols-2 gap-10">
              <div className="border-t pt-2 text-center">Pastor</div>
              <div className="border-t pt-2 text-center">Secretário do Conselho</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
