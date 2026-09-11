import { listIgrejasAtivasAction } from "./actions";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  const igrejas = await listIgrejasAtivasAction();
  return <LoginClient igrejas={igrejas} />;
}
