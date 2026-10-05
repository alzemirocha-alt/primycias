export const dynamic = 'force-dynamic'
export const revalidate = 0

import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSessionUser, getChurch } from "@/lib/auth"
import { isAdmin } from "@/lib/constants"
import { redirect } from "next/navigation"
import Link from "next/link"

function isNaoComungante(m){
  const t = `${m.tipo_membro||''} ${m.categoria_membro||''}`.toLowerCase()
  return t.includes('nao') || t.includes('não')
}

export default async function ListaMembros({ searchParams }) {
  const user = await getSessionUser()
  const church = await getChurch()

  if (!user) {
    return <div className="p-6">Não autenticado</div>
  }

  const funcaoPresb = (user.funcao_presbitero || '').toLowerCase()
  const isSecretario = funcaoPresb.includes('secretario')
  if (!isAdmin(user) && !isSecretario) {
    redirect("/dashboard")
  }

  const q = searchParams?.q || ""
  const filtro = searchParams?.f || "todos" // todos | comungante | nao

  // 1. BUSCA SÓ ATIVOS PARA CONTAGEM (demitido nunca entra aqui)
  const { data: todosAtivos } = await supabaseAdmin
    .from('membros_oficial')
    .select('tipo_membro, categoria_membro')
    .eq('status', 'ativo')

  const listaAtivos = todosAtivos || []
  const totalComungantes = listaAtivos.filter(m=> !isNaoComungante(m)).length
  const totalNao = listaAtivos.filter(m=> isNaoComungante(m)).length
  const totalGeral = listaAtivos.length

  // 2. BUSCA LISTA FILTRADA (só ativos + busca)
  let query = supabaseAdmin
    .from('membros_oficial')
    .select('id, nome_completo, numero_rol, status, tipo_membro, categoria_membro')
    .eq('status', 'ativo')
    .order('nome_completo')

  if (q) {
    query = query.ilike('nome_completo', `%${q}%`)
  }

  const { data: membrosRaw, error } = await query

  if (error) {
    return <div className="p-6">Erro ao carregar: {error.message}</div>
  }

  // Filtra comungante / nao no JS (mais seguro que OR no supabase)
  let membros = membrosRaw || []
  if(filtro === 'comungante'){
    membros = membros.filter(m=> !isNaoComungante(m))
  }
  if(filtro === 'nao'){
    membros = membros.filter(m=> isNaoComungante(m))
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Membros</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden md:block">
            {church?.nome || ''}
          </span>
          <Link href="/membros/novo" className="px-4 py-2 bg-[#0F3A1F] text-white text-sm rounded">
            + Novo Membro
          </Link>
        </div>
      </div>

      {/* NOVO QUADRO RESUMO - SUBSTITUI O 74/72 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link href={`/membros?f=comungante${q?`&q=${q}`:''}`} className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition ${filtro==='comungante'?'ring-2 ring-[#0F3A1F] border-[#0F3A1F]':''}`}>
          <p className="text-sm text-gray-500 font-medium">Membros Comungantes</p>
          <p className="text-3xl font-bold text-[#0F3A1F] mt-1">{totalComungantes}</p>
          <p className="text-xs text-gray-400 mt-1">{filtro==='comungante'?'Filtrando agora • clique em Total para limpar':'Clique para filtrar'}</p>
        </Link>

        <Link href={`/membros?f=nao${q?`&q=${q}`:''}`} className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition ${filtro==='nao'?'ring-2 ring-[#0F3A1F] border-[#0F3A1F]':''}`}>
          <p className="text-sm text-gray-500 font-medium">Membros Não Comungantes</p>
          <p className="text-3xl font-bold text-[#0F3A1F] mt-1">{totalNao}</p>
          <p className="text-xs text-gray-400 mt-1">{filtro==='nao'?'Filtrando agora':'Clique para filtrar'}</p>
        </Link>

        <Link href={`/membros?f=todos${q?`&q=${q}`:''}`} className={`bg-[#0F3A1F] text-white rounded-xl p-5 shadow-sm hover:shadow-md transition ${filtro==='todos'?'ring-2 ring-black':''}`}>
          <p className="text-sm text-white/70 font-medium">Total de Membros Ativos</p>
          <p className="text-3xl font-bold mt-1">{totalGeral}</p>
          <p className="text-xs text-white/60 mt-1">Clique para ver todos</p>
        </Link>
      </div>

      <form className="flex gap-2 mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome..."
          className="border p-2 w-full rounded text-sm"
        />
        {filtro !== 'todos' && <input type="hidden" name="f" value={filtro} />}
        <button className="border px-4 rounded text-sm bg-white">Buscar</button>
        {filtro !== 'todos' && (
          <Link href={`/membros?q=${q}`} className="border px-4 rounded text-sm bg-gray-100 flex items-center">Limpar filtro</Link>
        )}
      </form>

      <div className="grid grid-cols-1 gap-2">
        {membros?.map((m) => (
          <Link
            key={m.id}
            href={`/membros/${m.id}`}
            className="border p-4 rounded hover:bg-gray-50 flex justify-between items-center bg-white"
          >
            <span className="font-medium">{m.nome_completo}</span>
            <span className="text-sm text-gray-500">
              Rol: {m.numero_rol ?? 'a definir'} • {isNaoComungante(m)?'Não Comungante':'Comungante'} • {m.status}
            </span>
          </Link>
        ))}
      </div>

      {(!membros || membros.length === 0) && (
        <p className="text-center text-gray-500 mt-8">
          {filtro!=='todos' ? `Nenhum membro ${filtro==='nao'?'não comungante':'comungante'} encontrado.` : `Nenhum membro encontrado para "${q}".`}
        </p>
      )}
    </div>
  )
}
