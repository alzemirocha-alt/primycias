import { redirect } from "next/navigation";
import { getSessionUser, getChurch } from "@/lib/auth";
import { isAdmin, canAccessTesouraria, officeLabel } from "@/lib/constants";
import NavShell from "./NavShell";

export default async function AppLayout({ children }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const church = await getChurch(user.igreja_id);
  if (!church) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-sm text-gray-600">
        Dados da igreja ainda não cadastrados. Rode o script de seed (`npm run seed`) apontando para o
        backup, ou cadastre a igreja diretamente no Supabase (tabela <code>igrejas</code>).
      </div>
    );
  }
  if (church.status!== "ativa") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-sm text-gray-600">
        O acesso da sua igreja está indisponível no momento ({church.status}). Procure a liderança ou o
        suporte da plataforma.
      </div>
    );
  }

  // === REGRA: PRESBÍTERO NÃO VÊ DÍZIMO E RELATÓRIO ===
  const oficio = (user.oficio || '').toLowerCase()
  const funcao = (user.funcao_diacono || user.funcao || '').toLowerCase()
  const funcaoPresb = (user.funcao_presbitero || '').toLowerCase()
  const nome = (user.nome || '').toLowerCase()
  const isTesoureiro = funcao === 'tesoureiro' || oficio === 'tesoureiro' || funcao === 'tesoureiro_junta'
  const isPastor = oficio === 'pastor'
  const isSecretarioConselho = funcaoPresb === 'secretario_conselho'
  const isPresbitero = oficio === 'presbitero' || funcaoPresb!== '' || nome.includes('alzemir') || nome.includes('jairo magero') || nome.includes('nilo da silva')
  const isPresbiteroPuro = isPresbitero &&!isTesoureiro &&!isPastor &&!isSecretarioConselho

  const nav = [
    { href: "/dashboard", label: "Início" },
  ...(isAdmin(user)? [{ href: "/usuarios", label: "Usuários" }] : []),
    // SÓ MOSTRA SE NÃO FOR PRESBÍTERO PURO
  ...(!isPresbiteroPuro? [{ href: "/registros", label: "Dízimos e Ofertas" }] : []),
  ...(!isPresbiteroPuro? [{ href: "/relatorios", label: "Relatórios" }] : []),
    { href: "/calendario", label: "Agenda" },
  ...(canAccessTesouraria(user, church)? [{ href: "/tesouraria", label: "Tesouraria" }] : []),
  ...(canAccessTesouraria(user, church)? [{ href: `/igreja/${user.igreja_id}/orcamento-anual`, label: "Orçamento Anual" }] : []),
  ...(isAdmin(user)? [{ href: "/igreja", label: "Dados da Igreja" }] : []),
    { href: "/perfil", label: "Meus dados" },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="w-full md:w-56 shrink-0 flex md:flex-col p-4" style={{ background: "#0F3A1F" }}>
        <div className="flex-1 flex md:flex-col items-center md:items-start gap-4 md:gap-1">
          <div className="text-sm font-serif text-white mb-0 md:mb-6">{church.nome}</div>
          <NavShell items={nav} />
        </div>
        <div className="hidden md:block pt-4 mt-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="text-xs text-white truncate">{user.nome}</div>
          <div className="text-[10px] text-gray-300 truncate mb-2">{officeLabel(user)}</div>
          <form action="/api/logout" method="post">
            <button className="text-xs text-gray-300 underline">Sair</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-5 md:p-8 max-w-4xl">{children}</main>
    </div>
  );
}
