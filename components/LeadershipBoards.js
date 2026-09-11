import { FUNC_DIACONO, FUNC_PRESBITERO } from "@/lib/constants";

function PersonCard({ nome, foto, cargo, vago }) {
  return (
    <div className={`flex items-center gap-3 p-3 border border-line rounded-sm ${vago ? "bg-paperDeep" : "bg-white"}`}>
      <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-paperDeep flex items-center justify-center">
        {foto && <img src={foto} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="min-w-0">
        <div className={`text-sm font-medium truncate ${vago ? "text-gray-400" : "text-ink"}`}>{vago ? "Vago" : nome}</div>
        <div className="text-xs text-gray-500 truncate">{cargo}</div>
      </div>
    </div>
  );
}

function Board({ title, slots, compact }) {
  return (
    <div className={`bg-white border border-line rounded-sm p-4 ${compact ? "" : "flex-1"}`}>
      <div className="text-sm font-medium text-ink mb-3">{title}</div>
      <div className={compact ? "space-y-2.5" : "grid sm:grid-cols-2 gap-2.5"}>
        {slots.map((s, i) => <PersonCard key={i} nome={s.user?.nome} foto={s.user?.foto} cargo={s.cargo} vago={!s.user} />)}
      </div>
    </div>
  );
}

export default function LeadershipBoards({ users, church }) {
  const ativos = users.filter((u) => u.status === "ativo");

  const pastor = ativos.find((u) => u.oficio === "pastor");
  const vicePresConselho = ativos.find((u) => u.oficio === "presbitero" && u.funcao_presbitero === "vice_presidente_conselho");
  const secConselho = ativos.find((u) => u.oficio === "presbitero" && u.funcao_presbitero === "secretario_conselho");
  const membrosConselho = ativos.filter((u) => u.oficio === "presbitero" && u.funcao_presbitero === "membro_conselho");

  const conselhoSlots = [
    { cargo: "Presidente do Conselho da Igreja", user: pastor },
    { cargo: "Vice-presidente do Conselho da Igreja", user: vicePresConselho },
    { cargo: "Secretário do Conselho da Igreja", user: secConselho },
    ...(membrosConselho.length > 0
      ? membrosConselho.map((u) => ({ cargo: "Membro do Conselho da Igreja", user: u }))
      : [{ cargo: "Membro do Conselho da Igreja", user: null }]),
  ];

  const diaconoPorFuncao = (f) => ativos.find((u) => u.oficio === "diacono" && u.funcao_diacono === f);
  const nomeadosJunta = ["presidente_junta", "vice_presidente_junta", "secretario_junta", "tesoureiro_junta"];
  const outrosDiaconos = ativos.filter((u) => u.oficio === "diacono" && !nomeadosJunta.includes(u.funcao_diacono));

  const juntaSlots = [
    { cargo: "Presidente da Junta Diaconal", user: diaconoPorFuncao("presidente_junta") },
    { cargo: "Vice-presidente da Junta Diaconal", user: diaconoPorFuncao("vice_presidente_junta") },
    { cargo: "Secretário da Junta Diaconal", user: diaconoPorFuncao("secretario_junta") },
    { cargo: "Tesoureiro da Junta Diaconal", user: diaconoPorFuncao("tesoureiro_junta") },
    ...outrosDiaconos.map((u) => ({ cargo: "Membro da Junta Diaconal", user: u })),
  ];

  const tesoureiro = ativos.find((u) => u.id === church.tesoureiro_user_id);

  return (
    <div className="mb-4">
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <Board title="Conselho da Igreja" slots={conselhoSlots} />
        <div className="sm:w-56">
          <Board title="Tesoureiro da Igreja" slots={[{ cargo: "Tesoureiro da Igreja", user: tesoureiro }]} compact />
        </div>
      </div>
      <Board title="Junta Diaconal" slots={juntaSlots} />
    </div>
  );
}
