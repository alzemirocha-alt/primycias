import { redirect } from "next/navigation";
import { getDevSessionUser } from "@/lib/auth";

export default async function DesenvolvedorLayout({ children }) {
  const admin = await getDevSessionUser();
  if (!admin) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="w-full md:w-56 shrink-0 flex md:flex-col p-4" style={{ background: "#0F3A1F" }}>
        <div className="flex-1 flex md:flex-col items-center md:items-start gap-4 md:gap-1">
          <div className="text-sm font-serif text-white mb-0 md:mb-6">Painel do Desenvolvedor</div>
        </div>
        <div className="hidden md:block pt-4 mt-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="text-xs text-white truncate">{admin.nome}</div>
          <div className="text-[10px] text-gray-300 truncate mb-2">{admin.email}</div>
          <form action="/api/logout-dev" method="post">
            <button className="text-xs text-gray-300 underline">Sair</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-5 md:p-8 max-w-5xl">{children}</main>
    </div>
  );
}
