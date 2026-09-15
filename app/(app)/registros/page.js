'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RegistrosPage() {
  const supabase = createClient()
  const [regs, setRegs] = useState([])
  const [eu, setEu] = useState(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const cpf = localStorage.getItem('cpf')
    const { data: user } = await supabase.from('users').select('*').eq('cpf', cpf).single()
    setEu(user)

    let query = supabase.from('records').select('*, criador:criado_por(nome), segundo:segundo_diacono_id(nome)').order('created_at', { ascending: false })
    
    const { data } = await query
    let filtrados = data || []

    // REGRA DE VISIBILIDADE QUE VOCÊ PEDIU
    if (user.oficio === 'pastor') {
      // Pastor só vê o que já foi aprovado pelo tesoureiro
      filtrados = filtrados.filter(r => r.status === 'validado')
    } else if (user.oficio === 'tesoureiro') {
      // Tesoureiro vê o que está aguardando ele + o que ele mesmo lançou/confirmou
      filtrados = filtrados.filter(r => r.status === 'aguardando_tesoureiro' || r.criado_por === user.id || r.segundo_diacono_id === user.id)
    } else if (user.oficio === 'diacono') {
      // Diácono só vê se ele está envolvido OU se está aguardando 2º diácono pra ele confirmar
      filtrados = filtrados.filter(r => r.criado_por === user.id || r.segundo_diacono_id === user.id || r.status === 'aguardando_segundo_diacono' || r.status === 'devolvido_com_erro')
    } else {
      // Presbítero não vê nada
      filtrados = []
    }
    setRegs(filtrados)
  }

  async function confirmar(id, criado_por) {
    if (eu.id === criado_por) return alert('Quem lançou não pode confirmar!')
    await supabase.from('records').update({ segundo_diacono_id: eu.id, status: 'aguardando_tesoureiro' }).eq('id', id)
    carregar()
  }
  async function validar(id) {
    await supabase.from('records').update({ status: 'validado', validado_por: eu.id }).eq('id', id)
    carregar()
  }
  async function devolver(id) {
    const motivo = prompt('Motivo do erro:')
    if (!motivo) return
    await supabase.from('records').update({ status: 'devolvido_com_erro', motivo_devolucao: motivo, segundo_diacono_id: null }).eq('id', id)
    carregar()
  }
  async function excluirDefinitivo(id) {
    if (!confirm('Pastor, excluir DEFINITIVAMENTE esse registro?')) return
    await supabase.from('records').delete().eq('id', id)
    carregar()
  }
  async function reenviar(id) {
    await supabase.from('records').update({ status: 'aguardando_segundo_diacono', motivo_devolucao: null }).eq('id', id)
    carregar()
  }

  if (!eu) return <div className="p-6">Carregando...</div>

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h1 className="font-bold">Olá {eu.nome} ({eu.oficio}) - Você vê {regs.length} registros</h1>

      {regs.map(r => (
        <div key={r.id} className="bg-white p-4 rounded shadow border-l-4 border-l-green-700">
          {/* DETALHE SEMPRE ABERTO QUE VOCÊ PEDIU */}
          <div className="flex justify-between"><b>{r.data} - R$ {r.valor}</b><span className="text-xs bg-gray-100 px-2 rounded">{r.status}</span></div>
          <div className="mt-3 bg-gray-50 p-3 rounded text-sm">
            <p><b>Tipo:</b> {r.tipo}</p>
            <p><b>1º Diácono (Lançou):</b> {r.criador?.nome}</p>
            <p><b>2º Diácono (Confirmou):</b> {r.segundo?.nome || 'Aguardando confirmação'}</p>
            <p><b>Status atual:</b> {r.status}</p>
            {r.motivo_devolucao && <p className="text-red-600"><b>Erro apontado pelo Tesoureiro:</b> {r.motivo_devolucao}</p>}
          </div>

          {/* 1º DIÁCONO - se foi devolvido */}
          {r.status === 'devolvido_com_erro' && r.criado_por === eu.id && (
            <button onClick={() => reenviar(r.id)} className="bg-yellow-600 text-white w-full p-2 mt-3 rounded">Corrigir e Reenviar</button>
          )}

          {/* 2º DIÁCONO - só se não foi quem lançou */}
          {r.status === 'aguardando_segundo_diacono' && eu.oficio === 'diacono' && eu.id !== r.criado_por && (
            <button onClick={() => confirmar(r.id, r.criado_por)} className="bg-green-700 text-white w-full p-2 mt-3 rounded">Confirmar como 2º Diácono</button>
          )}

          {/* TESOUREIRO - Valida ou Devolve */}
          {r.status === 'aguardando_tesoureiro' && eu.oficio === 'tesoureiro' && (
            <div className="flex gap-2 mt-3">
              <button onClick={() => validar(r.id)} className="bg-blue-700 text-white flex-1 p-2 rounded">✓ Validar</button>
              <button onClick={() => devolver(r.id)} className="bg-red-600 text-white flex-1 p-2 rounded">✕ Devolver com Erro</button>
            </div>
          )}

          {/* PASTOR - Só vê e pode excluir depois de validado */}
          {eu.oficio === 'pastor' && r.status === 'validado' && (
            <button onClick={() => excluirDefinitivo(r.id)} className="bg-black text-white w-full p-2 mt-3 rounded">🗑️ Excluir Definitivamente (Pastor)</button>
          )}
        </div>
      ))}

      {regs.length === 0 && <p className="text-center mt-10 text-gray-500">Nenhum registro para você neste momento. (Diáconos não envolvidos não veem nada)</p>}
    </div>
  )
}
