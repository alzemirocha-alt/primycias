import "server-only";
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSessionUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PrintButton, FotoUpload, OficialToggle, AcoesFichaDemitido, HistoricoMembro } from './FichaClient'

export const dynamic = 'force-dynamic'
const LOGO_URL = "https://ebqvtoqpoxaklhheaeve.supabase.co/storage/v1/object/public/logos/Code_Generated_Image.png"

async function getMembro(id) {
  try {
    const { data } = await supabaseAdmin.from('membros_oficial').select('*').eq('id', id).single()
    if (data) return data
    const { data: data2 } = await supabaseAdmin.from('membros').select('*').eq('id', id).single()
    return data2 || null
  } catch (e) {
    console.error("getMembro erro", e)
    return null
  }
}

async function getPastorDaIgreja() {
  try {
    let { data } = await supabaseAdmin.from('users').select('nome_completo, nome').eq('oficio', 'pastor').eq('status', 'ativo').limit(1).maybeSingle()
    if (data) return data.nome_completo || data.nome
    const r2 = await supabaseAdmin.from('users').select('nome_completo, nome').ilike('cargo', '%pastor%').limit(1).maybeSingle()
    if (r2.data) return r2.data.nome_completo || r2.data.nome
    const r3 = await supabaseAdmin.from('configuracoes').select('pastor_nome').limit(1).maybeSingle()
    if (r3.data?.pastor_nome) return r3.data.pastor_nome
    return null
  } catch { return null }
}

async function updateMembro(formData) {
  'use server'
  const user = await getSessionUser()
  if (!user) {
    throw new Error('Não autorizado - faça login novamente')
  }

  const id = formData.get('id')
  try {
    const rolRaw = formData.get('numero_rol')
    let numeroRol = null
    if (rolRaw && String(rolRaw).trim() !== "") {
      const p = parseInt(String(rolRaw).trim())
      if (!isNaN(p)) numeroRol = p
    }
    const statusValue = String(formData.get('status') || 'ativo').toLowerCase().trim()
    const categoria = formData.get('categoria_membro') || formData.get('tipo_membro') || 'comungante'

    const dados = {
      numero_rol: numeroRol,
      nome_completo: formData.get('nome_completo'),
      cpf: formData.get('cpf'),
      filiacao_pai: formData.get('filiacao_pai'),
      filiacao_mae: formData.get('filiacao_mae'),
      data_nascimento: formData.get('data_nascimento') || null,
      sexo: formData.get('sexo'),
      cidade_nasc: formData.get('cidade_nasc'),
      estado_nasc: formData.get('estado_nasc'),
      endereco: formData.get('endereco'),
      cep: formData.get('cep'),
      cidade: formData.get('cidade'),
      estado: formData.get('estado'),
      telefone: formData.get('telefone'),
      estado_civil: formData.get('estado_civil'),
      escolaridade: formData.get('escolaridade'),
      profissao: formData.get('profissao'),
      nome_conjuge: formData.get('nome_conjuge') || null,
      cpf_conjuge: formData.get('cpf_conjuge') || null,
      data_casamento: formData.get('data_casamento') || null,
      status: statusValue,
      status_membro: statusValue,
      situacao: statusValue,
      data_demissao: formData.get('data_demissao') || null,
      forma_demissao: formData.get('forma_demissao') || null,
      motivo_demissao: formData.get('motivo_demissao') || null,
      pastor_demissao: formData.get('pastor_demissao') || null,
      categoria_membro: categoria,
      tipo_membro: categoria,
      oficial_tipo: formData.get('oficial_tipo') || null,
      forma_admissao: formData.get('forma_admissao'),
      data_admissao: formData.get('data_admissao') || null,
      data_batismo: formData.get('data_batismo') || null,
      local_batismo: formData.get('local_batismo'),
      pastor_batismo: formData.get('pastor_batismo'),
      data_profissao_fe: formData.get('data_profissao_fe') || null,
      local_profissao_fe: formData.get('local_profissao_fe'),
      pastor_profissao_fe: formData.get('pastor_profissao_fe'),
      data_ordenacao: formData.get('data_ordenacao') || null,
      data_instalacao: formData.get('data_instalacao') || null,
      foto_url: formData.get('foto_url') || null,
    }

    const { error } = await supabaseAdmin.from('membros_oficial').update(dados).eq('id', id)
    if (error) {
      console.error("Erro save completo:", error.message)
      await supabaseAdmin.from('membros_oficial').update({
        status: statusValue,
        status_membro: statusValue,
        situacao: statusValue,
        data_demissao: dados.data_demissao,
        forma_demissao: dados.forma_demissao,
        motivo_demissao: dados.motivo_demissao,
        pastor_demissao: dados.pastor_demissao,
      }).eq('id', id)
    }

    if(statusValue === 'demitido' && dados.data_demissao){
      try {
        await supabaseAdmin.from('membros_historico').insert({
          membro_id: id,
          tipo: 'demissao',
          data_evento: dados.data_demissao,
          forma: dados.forma_demissao,
          pastor_nome: dados.pastor_demissao,
          observacao: dados.motivo_demissao,
          snapshot: dados
        })
      } catch(e){ console.log('historico demissao erro', e.message) }
    }

    await supabaseAdmin.from('membros').update({ status: statusValue, situacao: statusValue }).eq('id', id)
  } catch (e) {
    console.error("updateMembro erro:", e)
    throw e
  }
  revalidatePath('/membros')
  revalidatePath(`/membros/${id}`)
  redirect(`/membros/${id}`)
}

export default async function Page({ params }) {
  try {
    const { id } = await params
    const m = await getMembro(id)
    const pastorDaIgreja = await getPastorDaIgreja()
    if (!m) return <div className="p-6">Membro não encontrado ID: {id} <br/><Link href="/membros" className="text-blue-600 underline">Voltar</Link></div>
    return (
      <div className="p-6 max-w-5xl mx-auto pb-20">
       <style>{`
          #btn-salvar{display:none}
         .modo-visualizar.no-print.w-full{display:none!important}
         .modo-visualizar input,.modo-visualizar select,.modo-visualizar textarea{pointer-events:none; background:#f9fafb!important;}
          @media print {
            body * { visibility: hidden; }
            #ficha-print, #ficha-print * { visibility: visible; }
            #ficha-print { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
           .no-print { display: none!important; }
            input, select { border: none!important; padding: 0!important; appearance: none; background: transparent!important; }
          }
         .modo-visualizar input,.modo-visualizar select,.modo-visualizar textarea { background:#f9fafb!important; pointer-events:none; border-color:#e5e7eb!important; }
        `}</style>
        <div className="no-print flex justify-between items-center">
          <Link href="/membros" className="text-sm text-blue-600">← Voltar para lista</Link>
          <div className="flex gap-2 items-center">
            <OficialToggle />
            <PrintButton />
            <Link href={`/membros/${m.id}/carteira`} className="bg-[#0F3A1F] text-white px-4 py-2 rounded text-sm">Emitir Carteira</Link>
          </div>
        </div>
        <div id="ficha-print" className="mt-2 bg-white border rounded p-3">
          <div className="flex items-center gap-3 mb-6 border-b pb-4">
            <img src={LOGO_URL} alt="Logo IPS" className="w-14 h-14 object-contain rounded-full bg-white border p-1" />
            <div>
              <h1 className="text-xl font-bold leading-tight">Igreja Presbiteriana em Sucupira</h1>
              <p className="text-sm font-semibold text-[#0F3A1F]">Ficha de Cadastro de Membro</p>
            </div>
          </div>
          <form action={updateMembro} id="ficha-form" className="space-y-8 modo-visualizar">
            <input type="hidden" name="id" value={m.id} />
            <input type="hidden" name="foto_url" id="foto_url_hidden" defaultValue={m.foto_url || ""} />
            <div>
              <h2 className="font-semibold text-[#0F3A1F] border-b pb-2 mb-4">1. Dados Pessoais</h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <label className="col-span-3 flex flex-col text-sm">Nome Completo<input name="nome_completo" defaultValue={m.nome_completo} className="border p-2 rounded mt-1" /></label>
                <label className="flex flex-col text-sm font-semibold">Nº Rol (Manual)<input name="numero_rol" type="text" placeholder="Ex: 123" defaultValue={m.numero_rol || ""} className="border p-2 rounded mt-1" /></label>
                <label className="flex flex-col text-sm">CPF<input name="cpf" defaultValue={m.cpf} className="border p-2 rounded mt-1" /></label>
                <FotoUpload defaultValue={m.foto_url || ""} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col text-sm">Filiação Pai<input name="filiacao_pai" defaultValue={m.filiacao_pai} className="border p-2 rounded mt-1" /></label>
                <label className="flex flex-col text-sm">Filiação Mãe<input name="filiacao_mae" defaultValue={m.filiacao_mae} className="border p-2 rounded mt-1" /></label>
                <label className="flex flex-col text-sm">Data Nasc.<input name="data_nascimento" type="date" defaultValue={m.data_nascimento} className="border p-2 rounded mt-1" /></label>
                <label className="flex flex-col text-sm">Sexo<select name="sexo" defaultValue={m.sexo} className="border p-2 rounded mt-1"><option value="">Selecione</option><option value="masculino">Masculino</option><option value="feminino">Feminino</option></select></label>
                <label className="flex flex-col text-sm">Cidade Nasc.<input name="cidade_nasc" defaultValue={m.cidade_nasc} className="border p-2 rounded mt-1" /></label>
                <label className="flex flex-col text-sm">Estado Nasc.<input name="estado_nasc" defaultValue={m.estado_nasc} className="border p-2 rounded mt-1" /></label>
                <label className="col-span-2 flex flex-col text-sm">Endereço<input name="endereco" defaultValue={m.endereco} className="border p-2 rounded mt-1" /></label>
                <label className="flex flex-col text-sm">CEP<input name="cep" defaultValue={m.cep} className="border p-2 rounded mt-1" /></label>
                <label className="flex flex-col text-sm">Telefone<input name="telefone" defaultValue={m.telefone} className="border p-2 rounded mt-1" /></label>
                <label className="flex flex-col text-sm">Cidade<input name="cidade" defaultValue={m.cidade} className="border p-2 rounded mt-1" /></label>
                <label className="flex flex-col text-sm">Estado<input name="estado" defaultValue={m.estado} className="border p-2 rounded mt-1" /></label>
                <label className="flex flex-col text-sm">Estado Civil<select id="estado_civil" name="estado_civil" defaultValue={m.estado_civil} className="border p-2 rounded mt-1"><option value="">Selecione</option><option value="solteiro">Solteiro(a)</option><option value="casado">Casado(a)</option><option value="divorciado">Divorciado(a)</option><option value="viuvo">Viúvo(a)</option></select></label>
                <label className="flex flex-col text-sm">Escolaridade<input name="escolaridade" defaultValue={m.escolaridade} className="border p-2 rounded mt-1" /></label>
                <label className="flex flex-col text-sm">Profissão<input name="profissao" defaultValue={m.profissao} className="border p-2 rounded mt-1" /></label>
                <div id="grupo-conjuge" className="col-span-2 grid grid-cols-3 gap-4" style={{display: m.estado_civil === 'casado'? 'grid' : 'none'}}>
                  <label className="flex flex-col text-sm">Nome Cônjuge<input name="nome_conjuge" defaultValue={m.nome_conjuge} className="border p-2 rounded mt-1" /></label>
                  <label className="flex flex-col text-sm">CPF Cônjuge<input name="cpf_conjuge" defaultValue={m.cpf_conjuge} className="border p-2 rounded mt-1" /></label>
                  <label className="flex flex-col text-sm">Data Casamento<input name="data_casamento" type="date" defaultValue={m.data_casamento} className="border p-2 rounded mt-1" /></label>
                </div>
                <label className="flex flex-col text-sm">Status<select id="status_membro" name="status" defaultValue={m.status} className="border p-2 rounded mt-1"><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="demitido">Demitido</option></select></label>
              </div>
              <div id="grupo-demissao" className="mt-6 bg-red-50 p-4 rounded-xl border border-red-200" style={{display: (m.status === 'inativo' || m.status === 'demitido')? 'block' : 'none'}}>
                <h3 className="font-bold text-red-700 text-sm mb-3">Dados de Demissão / Inativação</h3>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col text-sm">Data da Demissão/Inativação<input name="data_demissao" type="date" defaultValue={m.data_demissao} className="border p-2 rounded mt-1" /></label>
                  <label className="flex flex-col text-sm">Pastor da Demissão<input name="pastor_demissao" defaultValue={m.pastor_demissao || pastorDaIgreja || ""} className="border p-2 rounded mt-1" placeholder="Rev. ..." /></label>
                  <label className="col-span-2 flex flex-col text-sm">Forma de Demissão
                    <select id="forma_demissao" name="forma_demissao" defaultValue={m.forma_demissao} className="border p-2 rounded mt-1">
                      <option value="">Selecione...</option>
                      <optgroup label="COMUNGANTES - Art. 23 CI/IPB">
                        <option value="Exclusão por Disciplina - Art. 23, alínea &quot;a&quot; CI/IPB">Exclusão por Disciplina - Art. 23, alínea "a" CI/IPB</option>
                        <option value="Exclusão a Pedido - Art. 23, alínea &quot;b&quot; CI/IPB">Exclusão a Pedido - Art. 23, alínea "b" CI/IPB</option>
                        <option value="Exclusão por Ausência - Art. 23, alínea &quot;c&quot; CI/IPB">Exclusão por Ausência - Art. 23, alínea "c" CI/IPB</option>
                        <option value="Carta de Transferência - Art. 23, alínea &quot;d&quot; CI/IPB">Carta de Transferência - Art. 23, alínea "d" CI/IPB</option>
                        <option value="Jurisdição assumida por outra igreja - Art. 23, alínea &quot;e&quot; CI/IPB">Jurisdição assumida por outra igreja - Art. 23, alínea "e" CI/IPB</option>
                        <option value="Falecimento - Art. 23, alínea &quot;f&quot; CI/IPB">Falecimento - Art. 23, alínea "f" CI/IPB</option>
                      </optgroup>
                      <optgroup label="NÃO COMUNGANTES - Art. 24 CI/IPB">
                        <option value="Carta de Transferência dos Pais ou Responsáveis, a juízo do Conselho - Art. 24, alínea &quot;a&quot; CI/IPB">Carta dos Pais/Resp. a juízo do Conselho - Art. 24, alínea "a"</option>
                        <option value="Carta de Transferência nos termos do parágrafo único, in fine, do art. 19 - Art. 24, alínea &quot;b&quot; CI/IPB">Carta Transf. parágrafo único art.19 - Art. 24, alínea "b"</option>
                        <option value="Haverem atingido a idade de dezoito anos - Art. 24, alínea &quot;c&quot; CI/IPB">Atingiu 18 anos - Art. 24, alínea "c"</option>
                        <option value="Profissão de Fé - Art. 24, alínea &quot;d&quot; CI/IPB">Profissão de Fé - Art. 24, alínea "d"</option>
                        <option value="Solicitação dos pais ou responsáveis que tiverem aderido a outra comunidade religiosa, a juízo do Conselho - Art. 24, alínea &quot;e&quot; CI/IPB">Solicitação dos pais outra comunidade - Art. 24, alínea "e"</option>
                        <option value="Falecimento - Art. 24, alínea &quot;f&quot; CI/IPB">Falecimento - Art. 24, alínea "f"</option>
                      </optgroup>
                    </select>
                  </label>
                  <label className="col-span-2 flex flex-col text-sm">Motivo / Observação da Demissão<textarea name="motivo_demissao" defaultValue={m.motivo_demissao} className="border p-2 rounded mt-1 h-20" placeholder="Descreva o motivo detalhado..."></textarea></label>
                </div>
              </div>
            </div>
            <div>
              <h2 className="font-semibold text-[#0F3A1F] border-b pb-2 mb-4">2. Dados Eclesiásticos</h2>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col text-sm">Categoria<select id="categoria_membro" name="categoria_membro" defaultValue={m.categoria_membro || m.tipo_membro} className="border p-2 rounded mt-1"><option value="comungante">Comungante</option><option value="comungante_oficial">Comungante e Oficial</option><option value="nao_comungante">Não Comungante</option></select></label>
                <label id="campo-oficial-tipo" className="flex flex-col text-sm">Oficial<select name="oficial_tipo" defaultValue={m.oficial_tipo} className="border p-2 rounded mt-1"><option value="">Nenhum</option><option value="diacono">Diácono</option><option value="presbitero">Presbítero</option></select></label>
              </div>
            </div>
            <div>
              <h2 className="font-semibold text-[#0F3A1F] border-b pb-2 mb-4">3. Admissão e Ordenação</h2>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col text-sm">Data Admissão<input name="data_admissao" type="date" defaultValue={m.data_admissao} className="border p-2 rounded mt-1" /></label>
                <label className="col-span-2 flex flex-col text-sm">Forma Admissão<select id="forma_admissao" name="forma_admissao" defaultValue={m.forma_admissao} className="border p-2 rounded mt-1"><option value="">Selecione a forma</option><optgroup label="NÃO COMUNGANTES - Art. 17 CI/IPB"><option value="Batismo na Infância, de menores apresentados pelos pais ou responsáveis - Art. 17, alínea &quot;a&quot; CI/IPB">Batismo na Infância - Art. 17, alínea "a" CI/IPB</option><option value="Transferência dos Pais ou Responsáveis - Art. 17, alínea &quot;b&quot; CI/IPB">Transferência dos Pais ou Responsáveis - Art. 17, alínea "b" CI/IPB</option><option value="Jurisdição assumida sobre os pais ou responsáveis - Art. 17, alínea &quot;c&quot; CI/IPB">Jurisdição assumida sobre os pais ou responsáveis - Art. 17, alínea "c" CI/IPB</option></optgroup><optgroup label="COMUNGANTES - Art. 16 CI/IPB"><option value="Profissão de Fé dos que tiverem sido batizados na infância - Art. 16, alínea &quot;a&quot; CI/IPB">Profissão de Fé dos batizados na infância - Art. 16, alínea "a" CI/IPB</option><option value="Profissão de Fé e Batismo - Art. 16, alínea &quot;b&quot; CI/IPB">Profissão de Fé e Batismo - Art. 16, alínea "b" CI/IPB</option><option value="Carta de Transferência de Igreja Evangélica - Art. 16, alínea &quot;c&quot; CI/IPB">Carta de Transferência de Igreja Evangélica - Art. 16, alínea "c" CI/IPB</option><option value="Jurisdição a Pedido sobre os que vierem de outra comunidade evangélica - Art. 16, alínea &quot;d&quot; CI/IPB">Jurisdição a Pedido sobre os que vierem de outra comunidade evangélica - Art. 16, alínea "d" CI/IPB</option><option value="Jurisdição Ex officio sobre membros de comunidade presbiteriana após um ano de residência nos limites da igreja - Art. 16, alínea &quot;e&quot; CI/IPB">Jurisdição Ex officio - Art. 16, alínea "e" CI/IPB</option><option value="Restauração dos que tiverem sido afastados ou excluídos dos privilégios e direitos da igreja - Art. 16, alínea &quot;f&quot; CI/IPB">Restauração - Art. 16, alínea "f" CI/IPB</option></optgroup></select></label>
                <label className="flex flex-col text-sm">Data Batismo<input name="data_batismo" type="date" defaultValue={m.data_batismo} className="border p-2 rounded mt-1" /></label>
                <label className="flex flex-col text-sm">Local Batismo<input name="local_batismo" defaultValue={m.local_batismo} className="border p-2 rounded mt-1" /></label>
                <label className="flex flex-col text-sm">Pastor Batismo<input name="pastor_batismo" defaultValue={m.pastor_batismo || pastorDaIgreja || ""} className="border p-2 rounded mt-1" /></label>
                <div id="grupo-prof-fe" className="col-span-2 grid grid-cols-3 gap-4" style={{display: (m.categoria_membro === 'nao_comungante' || m.tipo_membro === 'nao_comungante')? 'none' : 'grid'}}>
                  <label className="flex flex-col text-sm">Data Prof. Fé<input name="data_profissao_fe" type="date" defaultValue={m.data_profissao_fe} className="border p-2 rounded mt-1" /></label>
                  <label className="flex flex-col text-sm">Local Prof. Fé<input name="local_profissao_fe" defaultValue={m.local_profissao_fe} className="border p-2 rounded mt-1" /></label>
                  <label className="flex flex-col text-sm">Pastor Prof. Fé<input name="pastor_profissao_fe" defaultValue={m.pastor_profissao_fe || pastorDaIgreja || ""} className="border p-2 rounded mt-1" /></label>
                </div>
                <label id="campo-data-ordenacao" className="flex flex-col text-sm">Data Ordenação<input name="data_ordenacao" type="date" defaultValue={m.data_ordenacao} className="border p-2 rounded mt-1" /></label>
                <label id="campo-data-instalacao" className="flex flex-col text-sm">Data Instalação<input name="data_instalacao" type="date" defaultValue={m.data_instalacao} className="border p-2 rounded mt-1" /></label>
              </div>
            </div>

            <AcoesFichaDemitido membroId={m.id} statusAtual={m.status || m.status_membro} />
            <HistoricoMembro membroId={m.id} ficha={m} />

            <button id="btn-salvar" type="submit" className="no-print w-full py-3 bg-[#0F3A1F] text-white rounded font-semibold mt-8">Salvar Alteracoes</button>
          </form>
          <div className="mt-4 text-xs text-gray-500">ID: {m.id} {pastorDaIgreja? " - Pastor: " + pastorDaIgreja : ""}</div>
        </div>
      </div>
    )
  } catch (e) {
    return <div className="p-10 bg-red-50"><h1 className="font-bold text-red-600">Erro ao carregar ficha</h1><pre className="text-xs mt-2 bg-white p-2 border">{String(e)} {e.stack}</pre></div>
  }
}
