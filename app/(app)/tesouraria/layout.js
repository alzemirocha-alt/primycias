import { redirect } from "next/navigation";
import { getSessionUser, getChurch } from "@/lib/auth";
import { canAccessTesouraria } from "@/lib/constants";
import TesourariaSubNav from "./TesourariaSubNav";

export default async function TesourariaLayout({ children }) {
  const me = await getSessionUser();
  const church = await getChurch(me.igreja_id);
  if (!canAccessTesouraria(me, church)) redirect("/dashboard");

  return (
    <div>
      <h2 className="text-xl font-serif text-ink mb-1">Controle Financeiro da Tesouraria</h2>
      <p className="text-xs text-gray-500 mb-4">Exclusivo do Tesoureiro da Igreja, Pastor e Secretário do Conselho.</p>
      <TesourariaSubNav />
      <div className="mt-4">{children}</div>
    </div>
  );
}
