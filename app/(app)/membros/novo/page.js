"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NovoMembroPage() {
  const router = useRouter()
  const [tipo, setTipo] = useState("comungante")
  const [oficialTipo, setOficialTipo] = useState("")
  const [estadoCivil, setEstadoCivil] = useState("")
  const [isComungante, setIsComungante] = useState(true)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.target)
    const body = Object.fromEntries(fd)

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
        {/* DADOS PESSOAIS */}
        <div>
          <h2 className="font-semibold text-[#0F3A1F] border-b pb-2 mb-4">1. Dados Pessoais</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="col-span-2 flex flex-col text-sm">Nome Completo *<input name="nome_completo" required className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Nº Cadastro Membro *<input name="numero_rol" type="number" required placeholder="Ex: 73" className="border p-2 rounded mt-1" /><span className="text-[10px] text-gray-500">Nunca pode repetir</span></label>
            <label className="flex flex-col text-sm">CPF<input name="cpf" className="border p-2 rounded mt-1" placeholder="Importa do sistema se já tiver" /></label>
            <label className="col-span-2 flex flex-col text-sm">Foto de Perfil URL<input name="foto_url" className="border p-2 rounded mt-1" placeholder="URL da foto" /></label>
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
              <span className="col-span-3 text-xs text-gray-500">O sistema buscará se o cônjuge é membro e vinculará automaticamente.</span>
            </div>
          )}
        </div>

        {/* DADOS ECLESIÁSTICOS */}
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

        {/* DADOS ADMISSÃO */}
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
            <label className="flex flex-col text-sm">Data Profissão de Fé<input name="data_profissao_fe" type="date" className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Local Profissão de Fé<input name="local_profissao_fe" className="border p-2 rounded mt-1" /></label>
            <label className="flex flex-col text-sm">Pastor Celebrante (Prof. Fé)<input name="pastor_profissao_fe" className="border p-2 rounded mt-1" /></label>
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

        <button type="submit" disabled={loading} className="w-full py-3 bg-[#0F3A1F] text-white rounded font-semibold disabled:opacity-50">
          {loading? 'Salvando...' : 'Salvar Ficha Completa'}
        </button>
      </form>
    </div>
  )
}
