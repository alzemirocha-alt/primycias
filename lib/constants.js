// -------------------- Plataforma / multi-tenant --------------------

// Desenvolvedor da Plataforma — acesso total a todas as igrejas.
export const DEV_CPF = "09385980408";
export const DEV_EMAIL = "alzemirocha@gmail.com";
export const DEV_NOME = "Alzemir Tarcísio Gomes da Rocha";

// Igreja "raiz" onde o CPF do desenvolvedor entra como Secretário
// (Aba 1 — Acesso Igreja). Identificada pelo CNPJ, não por um id fixo,
// porque o id é gerado pelo Postgres na primeira execução do schema/seed.
export const IGREJA_SUCUPIRA_CNPJ = "12.857.611/0001-30";
export const IGREJA_SUCUPIRA_NOME = "Igreja Sucupira";

export const IGREJA_STATUS_LABEL = {
  pendente_pagamento: "Pendente de aprovação",
  ativa: "Ativa",
  suspensa: "Suspensa",
  expirada: "Expirada",
  reprovada: "Reprovada",
};

export const OFICIOS = {
  pastor: "Pastor",
  presbitero: "Presbítero",
  diacono: "Diácono",
  membro: "Membro",
};

export const FUNC_DIACONO = {
  presidente_junta: "Presidente da Junta Diaconal",
  vice_presidente_junta: "Vice-presidente da Junta Diaconal",
  secretario_junta: "Secretário da Junta Diaconal",
  tesoureiro_junta: "Tesoureiro da Junta Diaconal",
};

export const FUNC_PRESBITERO = {
  vice_presidente_conselho: "Vice-presidente do Conselho da Igreja",
  secretario_conselho: "Secretário do Conselho da Igreja",
  membro_conselho: "Membro do Conselho da Igreja",
};

export const STATUS_LABEL = {
  lancado: "Lançado — aguardando o Tesoureiro",
  validado: "Validado pelo Tesoureiro",
  erro_reportado: "Erro reportado — aguardando correção",
};

export const CATEGORIAS_ENTRADA = ["Dízimo", "Oferta", "Doação especial", "Campanha", "Outras entradas"];
export const CATEGORIAS_SAIDA = ["Água/Luz/Internet", "Aluguel", "Manutenção", "Material de escritório", "Salários", "Ação social", "Eventos", "Outras despesas"];
export const FREQUENCIAS = { semanal: "Semanal", mensal: "Mensal", anual: "Anual" };
export const LANCAMENTO_STATUS_LABEL = {
  rascunho: "Em revisão",
  aprovado: "Aprovado",
  erro_reportado: "Erro reportado",
};

export function officeLabel(u) {
  if (!u) return "";
  if (u.oficio === "pastor") return "Pastor — acesso MASTER";
  if (u.oficio === "presbitero") {
    return `Presbítero${u.funcao_presbitero ? " — " + FUNC_PRESBITERO[u.funcao_presbitero] : ""}`;
  }
  if (u.oficio === "diacono") {
    return `Diácono${u.funcao_diacono ? " — " + FUNC_DIACONO[u.funcao_diacono] : ""}`;
  }
  return "Membro";
}

// O Secretário do Conselho é o presbítero com essa função específica.
export function isCouncilSecretary(u) {
  return !!u && u.oficio === "presbitero" && u.funcao_presbitero === "secretario_conselho";
}

// Acesso MASTER: só o Pastor (conforme pedido — vê e edita tudo).
export function isMaster(u) {
  return !!u && u.oficio === "pastor";
}

// Quem pode administrar usuários / dados da igreja: Pastor e Secretário.
export function isAdmin(u) {
  return isMaster(u) || isCouncilSecretary(u);
}

export function isTreasurer(u, church) {
  return !!u && !!church && u.id === church.tesoureiro_user_id;
}

// Conta fixa do Desenvolvedor da Plataforma logada pela Aba 1 (CPF) como
// Secretário da Igreja Sucupira: só enxerga a secretaria, nunca o financeiro.
export function isRestrictedFinanceiro(u) {
  return !!u && (u.restrito_financeiro === true || u.cpf === DEV_CPF);
}

export function formatCPF(cpf) {
  const d = String(cpf || "").replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function brl(n) {
  return (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR");
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(isoA, isoB) {
  return Math.round((new Date(isoB) - new Date(isoA)) / 86400000);
}

// Tesouraria: Pastor, Secretário do Conselho e Tesoureiro da Igreja.
export function canAccessTesouraria(u, church) {
  if (isRestrictedFinanceiro(u)) return false;
  return isAdmin(u) || isTreasurer(u, church);
}
