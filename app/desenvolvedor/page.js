import { listarIgrejasAction } from "./actions";
import IgrejasClient from "./IgrejasClient";

export default async function DesenvolvedorPage() {
  const igrejas = await listarIgrejasAction();
  return <IgrejasClient igrejasIniciais={igrejas} />;
}
