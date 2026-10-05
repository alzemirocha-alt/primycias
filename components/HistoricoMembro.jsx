"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

function formatarDataBR(d){
  if(!d) return '---'
  const s = String(d).split('T')[0].split('-')
  return `${s[2]}/${s[1]}/${s[0]}`
}

export default function HistoricoMembro({ membroId, ficha }){
  const [historico, setHistorico] = useState([])

  useEffect(()=>{
    if(!membroId) return
    supabase.from('membros_historico').select('*').eq('membro_id', membroId).order('data_evento', {ascending:true}).then(({data})=> setHistorico(data||[]))
  },[membroId])

  if(!membroId) return null

  // Se ainda não tem histórico, monta um provisório da ficha atual
  const temHistorico = historico.length>0

  return (
    <div className="mt-8 border-t-2 border-[#0A3D26] pt-6">
      <h3 className="font-bold text-[#0A3D26] mb-4">📜 Histórico de Movimentações na Igreja</h3>

      <div className="space-y-2">
        {!temHistorico? (
          <>
            {ficha?.data_admissao && (
              <div className="border rounded p-3 bg-green-50 text-sm">
                <div className="flex gap-2 font-bold">
                  <span>{formatarDataBR(ficha.data_admissao)}</span>
                  <span className="bg-green-200 px-2 rounded text-[10px]">ADMISSÃO</span>
                  <span>{ficha.forma_admissao || ficha.forma_de_admissao || '---'}</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {ficha.local_batismo && `Local: ${ficha.local_batismo} | `}
                  {ficha.pastor_batismo && `Pastor: ${ficha.pastor_batismo}`}
                </div>
              </div>
            )}
            {ficha?.data_demissao && (
              <div className="border rounded p-3 bg-red-50 text-sm">
                <div className="flex gap-2 font-bold">
                  <span>{formatarDataBR(ficha.data_demissao)}</span>
                  <span className="bg-red-200 px-2 rounded text-[10px]">DEMISSÃO</span>
                  <span>{ficha.forma_demissao || ficha.motivo_demissao || '---'}</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {ficha.pastor_demissao && `Pastor: ${ficha.pastor_demissao}`}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-400 italic">O histórico completo começará a ser registrado automaticamente a partir da próxima movimentação.</p>
          </>
        ) : (
          historico.map(h=>(
            <div key={h.id} className="border rounded p-3 text-sm bg-white">
              <div className="flex gap-2 items-center flex-wrap">
                <span className="font-bold">{formatarDataBR(h.data_evento)}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${h.tipo==='demissao'?'bg-red-200 text-red-800': h.tipo==='readmissao'?'bg-blue-200 text-blue-800':'bg-green-200 text-green-800'}`}>
                  {h.tipo.toUpperCase()}
                </span>
                <span className="font-semibold">{h.forma || '---'}</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {h.local_evento && <span>Local: {h.local_evento} | </span>}
                {h.pastor_nome && <span>Pastor: {h.pastor_nome} | </span>}
                {h.observacao && <span>Obs: {h.observacao}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
