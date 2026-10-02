"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

export default function NovoMembroPage() {
  const router = useRouter()
  const [tipo, setTipo] = useState("comungante")
  const [oficialTipo, setOficialTipo] = useState("")
  const [estadoCivil, setEstadoCivil] = useState("")
  const [isComungante, setIsComungante] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fotoUrl, setFotoUrl] = useState("")
  const [previewFoto, setPreviewFoto] = useState("")
  const [uploadingFoto, setUploadingFoto] = useState(false)

  async function handleFotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const preview = URL.createObjectURL(file)
    setPreviewFoto(preview)

    setUploadingFoto(true)

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Faça login como pastor ou secretário antes')

      const fileName = `${session.user.id}/${Date.now()}_${file.name.replace(/\s/g,'_')}`

      const { error } = await supabase.storage.from('fotos-membros').upload(fileName, file)
      if (error) throw error

      const { data } = supabase.storage.from('fotos-membros').getPublicUrl(fileName)
      setFotoUrl(data.publicUrl)

    } catch (err) {
      alert('Erro ao enviar foto: ' + err.message)
      console.log(err)
    } finally {
      setUploadingFoto(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.target)
    const body = Object.fromEntries(fd)
    if (fotoUrl) body.foto_url = fotoUrl
    if (!body.numero_rol) delete body.numero_rol

    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao salvar")
      router.push(`/membros/${data.id}`)
    } catch (err) {
      alert(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto pb-20">
      <h1 className="text-2xl font-bold mb-6">Ficha de Dados Cadastrais dos Membros</h1>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white border rounded p-6">
        <div>
          <h2 className="font-semibold text-[#0F3A1F] border-b pb-2 mb-4">1. Dados Pessoais</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="col-span-2 flex flex-col text-sm">Nome Completo *<input name="nome_completo" required className="border p-2 rounded mt-1" /></label>

            <label className="flex flex-col text-sm">Nº Cadastro Membro<input name="numero_rol" type="number" placeholder="Ex: 73 - opcional" className="border p-2 rounded mt-1" /><span className="text-[10px] text-gray-500">Opcional</span></label>
            <label className="flex flex-col text-sm">CPF<input name="cpf" className="border p-2 rounded mt-1" /></label>

            <div className="col-span-2 flex flex-col text-sm border p-3 rounded bg-gray-50">
              <span className="font-medium mb-2">Foto de Perfil</span>
              <div className="flex gap-4 items-center">
                <div className="w-20 h-24 bg-white border rounded overflow-hidden flex-shrink-0 grid place-items-center">
                  {previewFoto || fotoUrl? <img src={previewFoto || fotoUrl} className="w-full h-full object-cover" alt="foto" /> : <span className="text-[9px] text-gray-500">Sem foto</span>}
                </div>
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={handleFotoChange} className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#0F3A1F] file:text-white file:text-xs" />
                  {uploadingFoto && <span className="text-[11px] text-blue-600">Enviando foto...</span>}
                  {fotoUrl && <span className="text-[10px] text-green-600 break-all">Foto salva!</span>}
                  <input type="hidden" name="foto_url" value={fotoUrl} />
                  <p className="text-[10px] text-gray-500 mt-1">No celular abre câmera ou galeria</p>
                </div>
              </div>
            </div>

            <label className="flex flex-col text-sm">Filiação - Pai<input name="filiacao_pai" className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Filiação - Mãe<input name="filiacao_mae" className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Data Nascimento<input name="data_nascimento" type="date" className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Sexo<select name="sexo" className="border p-2 rounded mt-1"><option value="">Selecione</option><option value="masculino">Masculino</option><option value="feminino">Feminino</option></select></label>
            <label className="flex flex-col text-sm">Cidade Nasc.<input name="cidade_nasc" className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Estado Nasc.<input name="estado_nasc" className="border p-2 rounded mt-1" /></label>
            <label className="col-span-2 flex flex-col text-sm">Endereço Residência<input name="endereco" className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">CEP<input name="cep" className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Telefone<input name="telefone" className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Cidade<input name="cidade" className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Estado<input name="estado" className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Estado Civil<select name="estado_civil" value={estadoCivil} onChange={e=>setEstadoCivil(e.target.value)} className="border p-2 rounded mt-1"><option value="">Selecione</option><option value="solteiro">Solteiro(a)</option><option value="casado">Casado(a)</option><option value="divorciado">Divorciado(a)</option><option value="viuvo">Viúvo(a)</option></select></label>
            <label className="flex flex-col text-sm">Escolaridade<input name="escolaridade" className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Profissão<input name="profissao" className="border p-2 rounded mt-1" /></label>
          </div>
          {estadoCivil === 'casado' && (
            <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded border">
              <label className="flex flex-col text-sm">Nome Cônjuge<input name="nome_conjuge" className="border p-2 rounded mt-1" /></label>
              <label className="flex flex-col text-sm">CPF Cônjuge<input name="cpf_conjuge" className="border p-2 rounded mt-1" /></label>
              <label className="flex flex-col text-sm">Data Casamento<input name="data_casamento" type="date" className="border p-2 rounded mt-1" /></label>
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold text-[#0F3A1F] border-b pb-2 mb-4">2. Dados Eclesiásticos</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col text-sm">Categoria<select name="categoria_membro" value={tipo} onChange={e=>{setTipo(e.target.value); setIsComungante(e.target.value!=='nao_comungante')}} className="border p-2 rounded mt-1">
              <option value="comungante">Membro Comungante</option>
              <option value="comungante_oficial">Membro Comungante e Oficial</option>
              <option value="nao_comungante">Membro Não Comungante</option>
            </select></label>
            {tipo === 'comungante_oficial' && (
              <label className="flex flex-col text-sm">Oficial<select name="oficial_tipo" value={oficialTipo} onChange={e=>setOficialTipo(e.target.value)} className="border p-2 rounded mt-1"><option value="">Selecione</option><option value="diacono">Diácono</option><option value="presbitero">Presbítero</option></select></label>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-[#0F3A1F] border-b pb-2 mb-4">3. Dados de Admissão</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col text-sm">Data Admissão<input name="data_admissao" type="date" className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm col-span-2">Forma de Admissão
              {isComungante? (
                <select name="forma_admissao" className="border p-2 rounded mt-1">
                  <option value="Art. 16, alínea a - Profissão de Fé dos batizados na infância">Art. 16, a - Profissão de Fé dos batizados na infância</option>
                  <option value="Art. 16, alínea b - Profissão de Fé e Batismo">Art. 16, b - Profissão de Fé e Batismo</option>
                  <option value="Art. 16, alínea c - Carta de Transferência">Art. 16, c - Carta de Transferência de Igreja Evangélica</option>
                  <option value="Art. 16, alínea d - Jurisdição a Pedido">Art. 16, d - Jurisdição a Pedido</option>
                  <option value="Art. 16, alínea e - Jurisdição Ex officio">Art. 16, e - Jurisdição Ex officio</option>
                  <option value="Art. 16, alínea f - Restauração">Art. 16, f - Restauração</option>
                </select>
              ) : (
                <select name="forma_admissao" className="border p-2 rounded mt-1">
                  <option value="Art. 17, alínea a - Batismo na Infância">Art. 17, a - Batismo na Infância</option>
                  <option value="Art. 17, alínea b - Transferência dos Pais">Art. 17, b - Transferência dos Pais</option>
                  <option value="Art. 17, alínea c - Jurisdição sobre os pais">Art. 17, c - Jurisdição sobre os pais</option>
                </select>
              )}
            </label>
            <label className="flex flex-col text-sm">Data Batismo<input name="data_batismo" type="date" className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Local Batismo<input name="local_batismo" className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Pastor Celebrante (Batismo)<input name="pastor_batismo" className="border p-2 rounded mt-1" /></label>

            {isComungante && (
              <>
                <label className="flex flex-col text-sm">Data Profissão de Fé<input name="data_profissao_fe" type="date" className="border p-2 rounded mt-1" /></label>
                <label className="flex flex-col text-sm">Local Profissão de Fé<input name="local_profissao_fe" className="border p-2 rounded mt-1" /></label>
                <label className="flex flex-col text-sm">Pastor Celebrante (Prof. Fé)<input name="pastor_profissao_fe" className="border p-2 rounded mt-1" /></label>
              </>
            )}
          </div>
        </div>

        {tipo === 'comungante_oficial' && (
          <div>
            <h2 className="font-semibold text-[#0F3A1F] border-b pb-2 mb-4">4. Oficial</h2>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col text-sm">Data Ordenação<input name="data_ordenacao" type="date" className="border p-2 rounded mt-1" /></label>
              <label className="flex flex-col text-sm">Data Instalação<input name="data_instalacao" type="date" className="border p-2 rounded mt-1" /></label>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading || uploadingFoto} className="w-full py-3 bg-[#0F3A1F] text-white rounded font-semibold disabled:opacity-50">
          {loading? 'Salvando...' : uploadingFoto? 'Enviando foto...' : 'Salvar Ficha Completa'}
        </button>
      </form>
    </div>
  )
}
