'use client'
import { useEffect, useState, useRef } from 'react'

function formatarDataBR(d){
  if(!d) return '---'
  const s = String(d).split('T')[0].split('-')
  if(s.length!==3) return '---'
  return `${s[2]}/${s[1]}/${s[0]}`
}

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="bg-white border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50">
      Imprimir Ficha
    </button>
  )
}

export function FotoUpload({ defaultValue }) {
  const [preview, setPreview] = useState(defaultValue || "")
  const fileRef = useRef(null)
  const inputRef = useRef(null)
  const onFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result
      setPreview(base64)
      if (inputRef.current) inputRef.current.value = base64
    }
    reader.readAsDataURL(file)
  }
  return (
    <div className="col-span-1 row-span-2 border rounded p-3 bg-gray-50 flex flex-col items-center justify-center">
      <input ref={inputRef} type="hidden" name="foto_url" id="foto_url_hidden" defaultValue={defaultValue || ""} />
      {preview? (
        <img src={preview} alt="Foto" className="w-[110px] h-[140px] object-cover rounded border bg-white mb-2" />
      ) : (
        <div className="w-[110px] h-[140px] bg-gray-200 rounded border flex items-center justify-center text-[10px] text-gray-500 text-center mb-2">SEM FOTO</div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <button data-foto-action type="button" onClick={() => fileRef.current?.click()} className="no-print w-full bg-[#0F3A1F] text-white text-xs py-2 rounded foto-action">
        {preview? 'Trocar Foto' : 'Upload'}
      </button>
      {preview && (
        <button data-foto-action type="button" onClick={() => { setPreview(""); if (inputRef.current) inputRef.current.value = ""; }} className="no-print w-full mt-1 text-[11px] text-red-600 hover:underline foto-action">Remover</button>
      )}
    </div>
  )
}

export function OficialToggle() {
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    const form = document.getElementById('ficha-form') || document.querySelector('form')
    if (!form) return

    const selEC = document.getElementById('estado_civil')
    const selStatus = document.getElementById('status_membro')
    const selCat = document.getElementById('categoria_membro')
    const selOficial = document.getElementById('oficial_tipo_select')
    const selAdm = document.getElementById('forma_admissao')
    const selDem = document.getElementById('forma_demissao')
    const gConj = document.getElementById('grupo-conjuge')
    const gDem = document.getElementById('grupo-demissao')
    const gProf = document.getElementById('grupo-prof-fe')
    const cOf = document.getElementById('campo-oficial-tipo')
    const cOrd = document.getElementById('campo-data-ordenacao')
    const cInst = document.getElementById('campo-data-instalacao')
    const cConcessao = document.getElementById('campo-data-concessao')

    const applyRules = () => {
      if (gConj && selEC) gConj.style.display = selEC.value === 'casado'? 'grid' : 'none'
      if (gDem && selStatus) gDem.style.display = (selStatus.value === 'inativo' || selStatus.value === 'demitido')? 'block' : 'none'
      if (selCat) {
        const isNao = selCat.value === 'nao_comungante'
        const isOf = selCat.value === 'comungante_oficial'
        if (gProf) gProf.style.display = isNao? 'none' : 'grid'
        if (cOf) cOf.style.display = isOf? '' : 'none'
        if (cOrd) cOrd.style.display = isOf? '' : 'none'
        if (cInst) cInst.style.display = isOf? '' : 'none'
        if (selAdm) selAdm.querySelectorAll('optgroup').forEach((og) => { og.hidden = isNao?!og.label.includes('Art. 17') :!og.label.includes('Art. 16') })
        if (selDem) selDem.querySelectorAll('optgroup').forEach((og) => { og.hidden = isNao?!og.label.includes('Art. 24') :!og.label.includes('Art. 23') })
        if (cConcessao) {
          const isEmerito = selOficial && (selOficial.value === 'diacono_emerito' || selOficial.value === 'presbitero_emerito')
          cConcessao.style.display = (isOf && isEmerito)? 'flex' : 'none'
        }
      } else {
        if (cConcessao && selOficial) {
          const isEmerito = selOficial.value === 'diacono_emerito' || selOficial.value === 'presbitero_emerito'
          cConcessao.style.display = isEmerito? 'flex' : 'none'
        }
      }
    }

    selEC?.addEventListener('change', applyRules)
    selStatus?.addEventListener('change', applyRules)
    selCat?.addEventListener('change', applyRules)
    selOficial?.addEventListener('change', applyRules)

    const btnSalvar = document.getElementById('btn-salvar')
    const inputs = form.querySelectorAll('input, select, textarea')
    const fotoBtns = document.querySelectorAll('[data-foto-action]')

    if (editando) {
      if (btnSalvar) btnSalvar.style.display = 'block'
      form.classList.remove('modo-visualizar')
      inputs.forEach((el) => {
        if (el.type!== 'hidden') {
          el.disabled = false
          el.readOnly = false
          el.style.pointerEvents = 'auto'
        }
      })
      fotoBtns.forEach((b) => { b.style.display = '' })
    } else {
      if (btnSalvar) btnSalvar.style.display = 'none'
      form.classList.add('modo-visualizar')
      inputs.forEach((el) => {
        if (el.type === 'hidden') return
        el.disabled = false
        if (el.tagName === 'SELECT') {
          el.style.pointerEvents = 'none'
        } else {
          el.readOnly = true
          el.style.pointerEvents = 'none'
        }
      })
      fotoBtns.forEach((b) => { b.style.display = 'none' })
    }

    const onSubmit = () => {
      inputs.forEach((el) => {
        el.disabled = false
        el.readOnly = false
        el.style.pointerEvents = 'auto'
      })
    }
    form.addEventListener('submit', onSubmit)

    applyRules()

    return () => {
      selEC?.removeEventListener('change', applyRules)
      selStatus?.removeEventListener('change', applyRules)
      selCat?.removeEventListener('change', applyRules)
      selOficial?.removeEventListener('change', applyRules)
      form.removeEventListener('submit', onSubmit)
    }
  }, [editando])

  const handleToggle = () => {
    if (editando) {
      window.location.reload()
    } else {
      setEditando(true)
    }
  }

  return (
    <button id="btn-editar-ficha" type="button" onClick={handleToggle} className="bg-[#0F3A1F] text-white px-4 py-2 rounded text-sm">
      {editando? '❌ Cancelar' : '✏️ Editar Ficha'}
    </button>
  )
}

export function AcoesFichaDemitido({ membroId, statusAtual }) {
  const [loading, setLoading] = useState(false)
  const [showReadmitir, setShowReadmitir] = useState(false)
  const [showDemitir, setShowDemitir] = useState(false)
  const [formRead, setFormRead] = useState({
    data_evento: '',
    forma: 'Restauração - Art. 16, alínea "f" CI/IPB',
    pastor_epoca: '',
    ata_numero: ''
  })
  const [formDem, setFormDem] = useState({
    data_evento: '',
    forma: 'Exclusão a Pedido - Art. 23, alínea "b" CI/IPB',
    pastor_epoca: '',
    ata_numero: '',
    motivo: ''
  })

  const isDemitido = (statusAtual||'').toLowerCase().includes('demitido') || (statusAtual||'').toLowerCase().includes('inativo')

  const handleVoltar = () => {
    if(document.referrer.includes('relatorios')) {
      window.history.back()
    } else {
      window.location.href = '/relatorios?aba=demitidos'
    }
  }

  const handleReadmitir = async () => {
    if(!formRead.data_evento ||!formRead.pastor_epoca){
      alert('Preencha a Data da Readmissão e o Pastor na época!')
      return
    }
    setLoading(true)
    const res = await fetch('/api/membros/readmitir', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        id: membroId,
        data_evento: formRead.data_evento,
        forma_admissao: formRead.forma,
        pastor_epoca: formRead.pastor_epoca,
        ata_numero: formRead.ata_numero
      })
    })
    const j = await res.json()
    setLoading(false)
    if(res.ok){
      alert('Membro readmitido com sucesso!')
      window.location.reload()
    } else {
      alert('Erro: '+(j.error||'falha'))
    }
  }

  const handleDemitir = async () => {
    if(!formDem.data_evento ||!formDem.pastor_epoca){
      alert('Preencha a Data da Demissão e o Pastor na época!')
      return
    }
    setLoading(true)
    const res = await fetch('/api/membros/demitir', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        id: membroId,
        data_evento: formDem.data_evento,
        forma_demissao: formDem.forma,
        pastor_epoca: formDem.pastor_epoca,
        ata_numero: formDem.ata_numero,
        motivo: formDem.motivo
      })
    })
    const j = await res.json()
    setLoading(false)
    if(res.ok){
      alert('Membro demitido com sucesso! Histórico atualizado.')
      window.location.reload()
    } else {
      alert('Erro: '+(j.error||'falha'))
    }
  }

  return (
    <>
      <div className="no-print flex gap-2 mt-4">
        <button type="button" onClick={handleVoltar} className="flex-1 border border-gray-300 bg-white px-4 py-2 rounded text-sm font-bold hover:bg-gray-50">
          ← Voltar para Demitidos
        </button>
        {isDemitido? (
          <button type="button" onClick={()=>setShowReadmitir(true)} className="flex-1 bg-[#0A3D26] text-white px-4 py-2 rounded text-sm font-bold hover:bg-[#123f2a]">
            🔄 Readmitir Membro
          </button>
        ) : (
          <button type="button" onClick={()=>setShowDemitir(true)} className="flex-1 bg-red-700 text-white px-4 py-2 rounded text-sm font-bold hover:bg-red-800">
            📤 Demitir Membro
          </button>
        )}
      </div>

      {showReadmitir && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-[#0F3A1F] text-[16px] mb-1">Readmitir Membro</h3>
            <p className="text-[12px] text-gray-500 mb-4">Informe os dados da época da readmissão (da Ata do Conselho), não a data de hoje.</p>

            <label className="block text-xs font-bold mb-1">Data que foi readmitida *</label>
            <input type="date" className="w-full border rounded p-2 mb-3 text-sm"
              value={formRead.data_evento} onChange={e=>setFormRead({...formRead, data_evento: e.target.value})} />

            <label className="block text-xs font-bold mb-1">Forma de Admissão *</label>
            <select className="w-full border rounded p-2 mb-3 text-sm"
              value={formRead.forma} onChange={e=>setFormRead({...formRead, forma: e.target.value})}>
              <option>Restauração - Art. 16, alínea "f" CI/IPB</option>
              <option>Profissão de Fé e Batismo - Art. 16, alínea "a" CI/IPB</option>
              <option>Profissão de Fé - Art. 16, alínea "b" CI/IPB</option>
              <option>Carta de Transferência - Art. 16, alínea "c" CI/IPB</option>
              <option>Jurisdição a Pedido - Art. 16, alínea "d" CI/IPB</option>
              <option>Jurisdição Ex-Officio - Art. 16, alínea "e" CI/IPB</option>
            </select>

            <label className="block text-xs font-bold mb-1">Pastor na época da readmissão *</label>
            <input type="text" className="w-full border rounded p-2 mb-3 text-sm"
              value={formRead.pastor_epoca} onChange={e=>setFormRead({...formRead, pastor_epoca: e.target.value})} />

            <label className="block text-xs font-bold mb-1">Nº da Ata (opcional)</label>
            <input type="text" className="w-full border rounded p-2 mb-5 text-sm"
              value={formRead.ata_numero} onChange={e=>setFormRead({...formRead, ata_numero: e.target.value})} />

            <div className="flex gap-2">
              <button type="button" onClick={()=>setShowReadmitir(false)} className="flex-1 border rounded p-2 text-sm">Cancelar</button>
              <button type="button" onClick={handleReadmitir} disabled={loading} className="flex-1 bg-[#0F3A1F] text-white rounded p-2 text-sm font-bold disabled:opacity-50">
                {loading? 'Salvando...' : 'Confirmar Readmissão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDemitir && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-red-700 text-[16px] mb-1">Demitir Membro</h3>
            <p className="text-[12px] text-gray-500 mb-4">Informe os dados da época da demissão (da Ata do Conselho).</p>

            <label className="block text-xs font-bold mb-1">Data que foi demitida *</label>
            <input type="date" className="w-full border rounded p-2 mb-3 text-sm"
              value={formDem.data_evento} onChange={e=>setFormDem({...formDem, data_evento: e.target.value})} />

            <label className="block text-xs font-bold mb-1">Forma de Demissão *</label>
            <select className="w-full border rounded p-2 mb-3 text-sm"
              value={formDem.forma} onChange={e=>setFormDem({...formDem, forma: e.target.value})}>
              <option>Exclusão a Pedido - Art. 23, alínea "b" CI/IPB</option>
              <option>Transferência - Art. 23, alínea "a" CI/IPB</option>
              <option>Exclusão por Jurisdição - Art. 23, alínea "c" CI/IPB</option>
              <option>Falecimento - Art. 23</option>
            </select>

            <label className="block text-xs font-bold mb-1">Pastor na época *</label>
            <input type="text" className="w-full border rounded p-2 mb-3 text-sm"
              value={formDem.pastor_epoca} onChange={e=>setFormDem({...formDem, pastor_epoca: e.target.value})} />

            <label className="block text-xs font-bold mb-1">Nº da Ata (opcional)</label>
            <input type="text" className="w-full border rounded p-2 mb-5 text-sm"
              value={formDem.ata_numero} onChange={e=>setFormDem({...formDem, ata_numero: e.target.value})} />

            <div className="flex gap-2">
              <button type="button" onClick={()=>setShowDemitir(false)} className="flex-1 border rounded p-2 text-sm">Cancelar</button>
              <button type="button" onClick={handleDemitir} disabled={loading} className="flex-1 bg-red-700 text-white rounded p-2 text-sm font-bold disabled:opacity-50">
                {loading? 'Salvando...' : 'Confirmar Demissão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function HistoricoMembro({ membroId, ficha }) {
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    if(!membroId) return
    fetch(`/api/historico?membro_id=${membroId}`)
.then(r => r.json())
.then(data => {
        const lista = Array.isArray(data)? data : []
        lista.sort((a,b)=> new Date(a.data_evento) - new Date(b.data_evento))
        setHistorico(lista)
        setLoading(false)
      })
.catch(()=> setLoading(false))
  },[membroId])

  if(!membroId) return null

  return (
    <div className="mt-10 border-t-2 border-[#0F3A1F] pt-6">
      <h3 className="font-bold text-[#0F3A1F] text-[15px] mb-4">📜 Histórico de Admissões e Demissões na Igreja</h3>

      {loading? <p className="text-xs text-gray-500">Carregando histórico...</p> : (
        <div className="space-y-2">
          {ficha?.data_admissao && (
            <div className="border rounded p-3 text-xs bg-green-50">
              <div className="flex gap-2 font-bold"><span>{formatarDataBR(ficha.data_admissao)}</span><span className="bg-green-200 px-2 rounded text-[10px]">ADMISSÃO</span><span>{ficha.forma_admissao || ficha.forma_de_admissao || '---'}</span></div>
              <div className="text-[11px] text-gray-600 mt-1">
                {ficha.local_batismo && `Local: ${ficha.local_batismo} | `}
                {ficha.pastor_batismo && `Pastor: ${ficha.pastor_batismo}`}
              </div>
            </div>
          )}
          {historico.map(h=>(
            <div key={h.id} className="border rounded p-3 text-xs bg-white shadow-sm">
              <div className="flex gap-2 items-center flex-wrap">
                <span className="font-bold text-[13px]">{formatarDataBR(h.data_evento)}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${h.tipo==='demissao'?'bg-red-200 text-red-800': h.tipo==='readmissao'?'bg-blue-200 text-blue-800':'bg-green-200 text-green-800'}`}>
                  {h.tipo.toUpperCase()}
                </span>
                <span className="font-semibold">{h.forma || '---'}</span>
              </div>
              <div className="text-[11px] text-gray-600 mt-1 leading-4">
                {h.local_evento && <span>Local: {h.local_evento} | </span>}
                {h.pastor_nome && <span>Pastor: {h.pastor_nome} | </span>}
                {h.observacao && <span>{h.observacao}</span>}
              </div>
            </div>
          ))}
          {historico.length===0 &&!ficha?.data_admissao && <p className="text-xs text-gray-400 italic">O histórico será preenchido automaticamente a cada demissão/readmissão.</p>}
        </div>
      )}
    </div>
  )
}
