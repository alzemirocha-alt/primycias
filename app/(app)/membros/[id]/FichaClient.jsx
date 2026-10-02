'use client'
import { useState, useRef } from 'react'

export function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="bg-white border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-50">🖨️ Imprimir Ficha</button>
}

export function FotoUpload({ defaultValue, viewOnly }) {
  const [preview, setPreview] = useState(defaultValue || "")
  const fileRef = useRef(null)
  const inputRef = useRef(null)
  const onFile = (e) => {
    const file = e.target.files?.[0]; if(!file) return
    if(file.size > 2*1024*1024){ alert("Máx 2MB"); return }
    const reader = new FileReader()
    reader.onload = () => { setPreview(reader.result); if(inputRef.current) inputRef.current.value = reader.result }
    reader.readAsDataURL(file)
  }
  if(viewOnly){
    return <div className="border rounded p-3 bg-gray-50 flex flex-col items-center">{preview? <img src={preview} alt="Foto" className="w-[130px] h-[165px] object-cover rounded border" /> : <div className="w-[130px] h-[165px] bg-gray-200 rounded flex items-center justify-center text-[10px]">SEM FOTO</div>}</div>
  }
  return (
    <div className="border rounded p-3 bg-gray-50 flex flex-col items-center">
      <input ref={inputRef} type="hidden" name="foto_url" defaultValue={defaultValue||""} />
      {preview? <img src={preview} alt="Foto" className="w-[130px] h-[165px] object-cover rounded border mb-2" /> : <div className="w-[130px] h-[165px] bg-gray-200 rounded border flex items-center justify-center text-[10px] mb-2">SEM FOTO</div>}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <button type="button" onClick={()=>fileRef.current?.click()} className="w-full bg-[#0F3A1F] text-white text-xs py-2 rounded">📷 {preview?'Trocar Foto':'Foto'}</button>
      {preview && <button type="button" onClick={()=>{setPreview(""); if(inputRef.current) inputRef.current.value="";}} className="w-full mt-1 text-[11px] text-red-600 hover:underline">Remover</button>}
    </div>
  )
}

function Campo({ label, value }){
  return <div className="flex flex-col"><span className="text-[13px] text-gray-700 mb-1">{label}</span><div className="border rounded px-3 py-2.5 bg-white text-[14px] min-h-[42px]">{value || <span className="text-gray-400">-</span>}</div></div>
}

// LISTAS OFICIAIS CI/IPB
const ADMISSAO_COMUNGANTES = [
  {value: 'Profissão de Fé dos que tiverem sido batizados na infância - Art. 16, alínea "a" CI/IPB', label: 'Profissão de Fé dos batizados na infância - Art. 16, alínea "a"'},
  {value: 'Profissão de Fé e Batismo - Art. 16, alínea "b" CI/IPB', label: 'Profissão de Fé e Batismo - Art. 16, alínea "b"'},
  {value: 'Carta de Transferência de Igreja Evangélica - Art. 16, alínea "c" CI/IPB', label: 'Carta de Transferência de Igreja Evangélica - Art. 16, alínea "c"'},
  {value: 'Jurisdição a Pedido sobre os que vierem de outra comunidade evangélica - Art. 16, alínea "d" CI/IPB', label: 'Jurisdição a Pedido - Art. 16, alínea "d"'},
  {value: 'Jurisdição Ex officio sobre membros de comunidade presbiteriana após um ano de residência nos limites da igreja - Art. 16, alínea "e" CI/IPB', label: 'Jurisdição Ex officio - Art. 16, alínea "e"'},
  {value: 'Restauração dos que tiverem sido afastados ou excluídos dos privilégios e direitos da igreja - Art. 16, alínea "f" CI/IPB', label: 'Restauração - Art. 16, alínea "f"'},
]
const ADMISSAO_NAO_COMUNGANTES = [
  {value: 'Batismo na Infância, de menores apresentados pelos pais ou responsáveis - Art. 17, alínea "a" CI/IPB', label: 'Batismo na Infância - Art. 17, alínea "a"'},
  {value: 'Transferência dos Pais ou Responsáveis - Art. 17, alínea "b" CI/IPB', label: 'Transferência dos Pais ou Responsáveis - Art. 17, alínea "b"'},
  {value: 'Jurisdição assumida sobre os pais ou responsáveis - Art. 17, alínea "c" CI/IPB', label: 'Jurisdição assumida sobre os pais - Art. 17, alínea "c"'},
]
const DEMISSAO_COMUNGANTES = [
  {value: 'Exclusão por Disciplina - Art. 23, alínea "a" CI/IPB', label: 'Exclusão por Disciplina - Art. 23, alínea "a"'},
  {value: 'Exclusão a Pedido - Art. 23, alínea "b" CI/IPB', label: 'Exclusão a Pedido - Art. 23, alínea "b"'},
  {value: 'Exclusão por Ausência - Art. 23, alínea "c" CI/IPB', label: 'Exclusão por Ausência - Art. 23, alínea "c"'},
  {value: 'Carta de Transferência - Art. 23, alínea "d" CI/IPB', label: 'Carta de Transferência - Art. 23, alínea "d"'},
  {value: 'Jurisdição assumida por outra igreja - Art. 23, alínea "e" CI/IPB', label: 'Jurisdição assumida por outra igreja - Art. 23, alínea "e"'},
  {value: 'Falecimento - Art. 23, alínea "f" CI/IPB', label: 'Falecimento - Art. 23, alínea "f"'},
]
const DEMISSAO_NAO_COMUNGANTES = [
  {value: 'Carta de Transferência dos Pais ou Responsáveis, a juízo do Conselho - Art. 24, alínea "a" CI/IPB', label: 'Carta dos Pais, a juízo do Conselho - Art. 24, alínea "a"'},
  {value: 'Carta de Transferência nos termos do parágrafo único, in fine, do art. 19 - Art. 24, alínea "b" CI/IPB', label: 'Carta nos termos do art. 19 parágrafo único - Art. 24, alínea "b"'},
  {value: 'Haverem atingido a idade de dezoito anos - Art. 24, alínea "c" CI/IPB', label: 'Atingiu 18 anos - Art. 24, alínea "c"'},
  {value: 'Profissão de Fé - Art. 24, alínea "d" CI/IPB', label: 'Profissão de Fé (migração para comungante) - Art. 24, alínea "d"'},
  {value: 'Solicitação dos pais ou responsáveis que tiverem aderido a outra comunidade religiosa, a juízo do Conselho - Art. 24, alínea "e" CI/IPB', label: 'Solicitação dos pais outra comunidade - Art. 24, alínea "e"'},
  {value: 'Falecimento - Art. 24, alínea "f" CI/IPB', label: 'Falecimento - Art. 24, alínea "f"'},
]

export function FichaPage({ m, pastorDaIgreja, action }){
  const [editando, setEditando] = useState(false)
  const [estadoCivil, setEstadoCivil] = useState(m.estado_civil || "")
  const [status, setStatus] = useState(m.status || "ativo")
  const [categoria, setCategoria] = useState(m.categoria_membro || m.tipo_membro || "comungante")

  const isCasado = (editando? estadoCivil : m.estado_civil) === 'casado'
  const isDemitido = (editando? status : m.status) === 'inativo' || (editando? status : m.status) === 'demitido'
  const isNaoCom = categoria === 'nao_comungante'
  const isOficial = categoria === 'comungante_oficial'

  // Listas filtradas conforme categoria
  const listaAdmissao = isNaoCom? ADMISSAO_NAO_COMUNGANTES : ADMISSAO_COMUNGANTES
  const listaDemissao = isNaoCom? DEMISSAO_NAO_COMUNGANTES : DEMISSAO_COMUNGANTES

  if(!editando){
    return (
      <>
        <div className="no-print flex gap-2 mb-3">
          <button onClick={()=>setEditando(true)} className="bg-[#0F3A1F] text-white px-4 py-2 rounded text-sm">✏️ Editar Ficha</button>
          <PrintButton />
        </div>
        <div className="space-y-8">
          <div><h2 className="font-semibold text-[#0F3A1F] border-b pb-2 mb-4">1. Dados Pessoais</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3"><Campo label="Nome Completo" value={m.nome_completo} /></div>
              <Campo label="Nº Rol" value={m.numero_rol} /><Campo label="CPF" value={m.cpf} />
              <div className="row-span-3"><FotoUpload defaultValue={m.foto_url} viewOnly /></div>
              <Campo label="Filiação Pai" value={m.filiacao_pai} /><Campo label="Filiação Mãe" value={m.filiacao_mae} />
              <Campo label="Data Nasc." value={m.data_nascimento} /><Campo label="Sexo" value={m.sexo} />
              <Campo label="Cidade Nasc." value={m.cidade_nasc} /><Campo label="Estado Nasc." value={m.estado_nasc} />
              <div className="col-span-2"><Campo label="Endereço" value={m.endereco} /></div>
              <Campo label="CEP" value={m.cep} /><Campo label="Telefone" value={m.telefone} />
              <Campo label="Cidade" value={m.cidade} /><Campo label="Estado" value={m.estado} />
              <Campo label="Estado Civil" value={m.estado_civil} /><Campo label="Escolaridade" value={m.escolaridade} />
              <Campo label="Profissão" value={m.profissao} />
              {isCasado && <><Campo label="Nome Cônjuge" value={m.nome_conjuge} /><Campo label="CPF Cônjuge" value={m.cpf_conjuge} /><Campo label="Data Casamento" value={m.data_casamento} /></>}
              <Campo label="Status" value={m.status} />
            </div>
            {isDemitido && <div className="mt-6 bg-red-50 p-4 rounded-xl border border-red-200"><h3 className="font-bold text-red-700 text-sm mb-3">Dados de Demissão</h3><div className="grid grid-cols-2 gap-4"><Campo label="Data Demissão" value={m.data_demissao} /><Campo label="Forma Demissão" value={m.forma_demissao} /><div className="col-span-2"><Campo label="Motivo" value={m.motivo_demissao} /></div></div></div>}
          </div>
          <div><h2 className="font-semibold text-[#0F3A1F] border-b pb-2 mb-4">2. Dados Eclesiásticos</h2><div className="grid grid-cols-2 gap-4"><Campo label="Categoria" value={m.categoria_membro || m.tipo_membro} />{isOficial && <Campo label="Oficial" value={m.oficial_tipo} />}</div></div>
          <div><h2 className="font-semibold text-[#0F3A1F] border-b pb-2 mb-4">3. Admissão e Ordenação</h2><div className="grid grid-cols-3 gap-4"><Campo label="Data Admissão" value={m.data_admissao} /><div className="col-span-2"><Campo label="Forma Admissão" value={m.forma_admissao} /></div><Campo label="Data Batismo" value={m.data_batismo} /><Campo label="Local Batismo" value={m.local_batismo} /><Campo label="Pastor Batismo" value={m.pastor_batismo} />{!isNaoCom && <><Campo label="Data Prof. Fé" value={m.data_profissao_fe} /><Campo label="Local Prof. Fé" value={m.local_profissao_fe} /><Campo label="Pastor Prof. Fé" value={m.pastor_profissao_fe} /></>}{isOficial && <><Campo label="Data Ordenação" value={m.data_ordenacao} /><Campo label="Data Instalação" value={m.data_instalacao} /></>}</div></div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="no-print flex gap-2 mb-3"><button onClick={()=>setEditando(false)} className="border px-4 py-2 rounded text-sm bg-white">Cancelar</button><PrintButton /></div>
      <form action={async (fd)=>{ await action(fd); setEditando(false); }} className="space-y-8">
        <input type="hidden" name="id" value={m.id} />
        <div><h2 className="font-semibold text-[#0F3A1F] border-b pb-2 mb-4">1. Dados Pessoais</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <label className="col-span-3 flex flex-col text-sm">Nome Completo<input name="nome_completo" defaultValue={m.nome_completo} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Nº Rol<input name="numero_rol" defaultValue={m.numero_rol||""} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">CPF<input name="cpf" defaultValue={m.cpf||""} className="border p-2 rounded mt-1" /></label>
            <FotoUpload defaultValue={m.foto_url||""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col text-sm">Filiação Pai<input name="filiacao_pai" defaultValue={m.filiacao_pai||""} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Filiação Mãe<input name="filiacao_mae" defaultValue={m.filiacao_mae||""} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Data Nasc.<input name="data_nascimento" type="date" defaultValue={m.data_nascimento||""} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Sexo<select name="sexo" defaultValue={m.sexo||""} className="border p-2 rounded mt-1"><option value="">Selecione</option><option value="masculino">Masculino</option><option value="feminino">Feminino</option></select></label>
            <label className="flex flex-col text-sm">Cidade Nasc.<input name="cidade_nasc" defaultValue={m.cidade_nasc||""} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Estado Nasc.<input name="estado_nasc" defaultValue={m.estado_nasc||""} className="border p-2 rounded mt-1" /></label>
            <label className="col-span-2 flex flex-col text-sm">Endereço<input name="endereco" defaultValue={m.endereco||""} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">CEP<input name="cep" defaultValue={m.cep||""} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Telefone<input name="telefone" defaultValue={m.telefone||""} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Cidade<input name="cidade" defaultValue={m.cidade||""} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Estado<input name="estado" defaultValue={m.estado||""} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Estado Civil<select name="estado_civil" value={estadoCivil} onChange={e=>setEstadoCivil(e.target.value)} className="border p-2 rounded mt-1"><option value="">Selecione</option><option value="solteiro">Solteiro</option><option value="casado">Casado</option><option value="divorciado">Divorciado</option><option value="viuvo">Viúvo</option></select></label>
            <label className="flex flex-col text-sm">Escolaridade<input name="escolaridade" defaultValue={m.escolaridade||""} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Profissão<input name="profissao" defaultValue={m.profissao||""} className="border p-2 rounded mt-1" /></label>
            {isCasado && <><label className="flex flex-col text-sm">Nome Cônjuge<input name="nome_conjuge" defaultValue={m.nome_conjuge||""} className="border p-2 rounded mt-1" /></label><label className="flex flex-col text-sm">CPF Cônjuge<input name="cpf_conjuge" defaultValue={m.cpf_conjuge||""} className="border p-2 rounded mt-1" /></label><label className="flex flex-col text-sm">Data Casamento<input name="data_casamento" type="date" defaultValue={m.data_casamento||""} className="border p-2 rounded mt-1" /></label></>}
            <label className="flex flex-col text-sm">Status<select name="status" value={status} onChange={e=>setStatus(e.target.value)} className="border p-2 rounded mt-1"><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="demitido">Demitido</option></select></label>
          </div>
          {isDemitido && (
            <div className="mt-6 bg-red-50 p-4 rounded-xl border border-red-200">
              <h3 className="font-bold text-red-700 text-sm mb-3">Dados de Demissão - {isNaoCom? 'Não Comungante Art.24' : 'Comungante Art.23'}</h3>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col text-sm">Data Demissão<input name="data_demissao" type="date" defaultValue={m.data_demissao||""} className="border p-2 rounded mt-1" /></label>
                <label className="flex flex-col text-sm">Forma Demissão
                  <select name="forma_demissao" defaultValue={m.forma_demissao||""} className="border p-2 rounded mt-1">
                    <option value="">Selecione...</option>
                    {listaDemissao.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </label>
                <label className="col-span-2 flex flex-col text-sm">Motivo<textarea name="motivo_demissao" defaultValue={m.motivo_demissao||""} className="border p-2 rounded mt-1 h-20"></textarea></label>
              </div>
            </div>
          )}
        </div>
        <div><h2 className="font-semibold text-[#0F3A1F] border-b pb-2 mb-4">2. Dados Eclesiásticos</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col text-sm">Categoria
              <select name="categoria_membro" value={categoria} onChange={e=>setCategoria(e.target.value)} className="border p-2 rounded mt-1 font-semibold">
                <option value="comungante">Comungante</option>
                <option value="comungante_oficial">Comungante e Oficial</option>
                <option value="nao_comungante">Não Comungante</option>
              </select>
            </label>
            {isOficial && <label className="flex flex-col text-sm">Oficial<select name="oficial_tipo" defaultValue={m.oficial_tipo||""} className="border p-2 rounded mt-1"><option value="">Nenhum</option><option value="diacono">Diácono</option><option value="presbitero">Presbítero</option></select></label>}
          </div>
        </div>
        <div><h2 className="font-semibold text-[#0F3A1F] border-b pb-2 mb-4">3. Admissão e Ordenação</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col text-sm">Data Admissão<input name="data_admissao" type="date" defaultValue={m.data_admissao||""} className="border p-2 rounded mt-1" /></label>
            <label className="col-span-2 flex flex-col text-sm">Forma Admissão - {isNaoCom? 'Não Comungante Art.17' : 'Comungante Art.16'}
              <select name="forma_admissao" defaultValue={m.forma_admissao||""} className="border p-2 rounded mt-1">
                <option value="">Selecione a forma...</option>
                {listaAdmissao.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col text-sm">Data Batismo<input name="data_batismo" type="date" defaultValue={m.data_batismo||""} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Local Batismo<input name="local_batismo" defaultValue={m.local_batismo||""} className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Pastor Batismo<input name="pastor_batismo" defaultValue={m.pastor_batismo||pastorDaIgreja||""} className="border p-2 rounded mt-1" /></label>
            {!isNaoCom && <><label className="flex flex-col text-sm">Data Prof. Fé<input name="data_profissao_fe" type="date" defaultValue={m.data_profissao_fe||""} className="border p-2 rounded mt-1" /></label><label className="flex flex-col text-sm">Local Prof. Fé<input name="local_profissao_fe" defaultValue={m.local_profissao_fe||""} className="border p-2 rounded mt-1" /></label><label className="flex flex-col text-sm">Pastor Prof. Fé<input name="pastor_profissao_fe" defaultValue={m.pastor_profissao_fe||pastorDaIgreja||""} className="border p-2 rounded mt-1" /></label></>}
            {isOficial && <><label className="flex flex-col text-sm">Data Ordenação<input name="data_ordenacao" type="date" defaultValue={m.data_ordenacao||""} className="border p-2 rounded mt-1" /></label><label className="flex flex-col text-sm">Data Instalação<input name="data_instalacao" type="date" defaultValue={m.data_instalacao||""} className="border p-2 rounded mt-1" /></label></>}
          </div>
        </div>
        <button className="w-full py-3 bg-[#0F3A1F] text-white rounded font-semibold">Salvar Alterações</button>
      </form>
    </>
  )
}
export function OficialToggle(){ return null }
