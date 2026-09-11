import { redirect } from "next/navigation";
import { getSessionUser, getChurch } from "@/lib/auth";
import { isAdmin } from "@/lib/constants";
import IgrejaClient from "./IgrejaClient";

export default async function IgrejaPage() {
  const me = await getSessionUser();
  if (!isAdmin(me)) redirect("/dashboard");
  const church = await getChurch(me.igreja_id);
  return <IgrejaClient church={church} />;
}
