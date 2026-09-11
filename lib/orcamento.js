import "server-only";
import { CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA } from "./constants";

export const TODAS_CATEGORIAS = [...CATEGORIAS_ENTRADA, ...CATEGORIAS_SAIDA];

// Soma o realizado do ano (todos os meses) por categoria, a partir das
// linhas já combinadas de records + lancamentos (ver lib/ledger.js).
export function realizadoPorCategoriaNoAno(ledgerRows, ano) {
  const totals = {};
  for (const cat of TODAS_CATEGORIAS) totals[cat] = 0;
  for (const r of ledgerRows || []) {
    if (!r.tipo || !r.data) continue;
    if (r.data.slice(0, 4) !== String(ano)) continue;
    const cat = r.categoria || "Outras entradas";
    if (!(cat in totals)) totals[cat] = 0;
    totals[cat] += r.tipo === "saida" ? -Number(r.valor) : Number(r.valor);
  }
  return totals;
}

// Série mensal (Jan-Dez) de entradas e saídas realizadas no ano, para o
// gráfico comparativo Previsto x Realizado.
export function realizadoMensalNoAno(ledgerRows, ano) {
  const meses = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, entradas: 0, saidas: 0 }));
  for (const r of ledgerRows || []) {
    if (!r.tipo || !r.data) continue;
    if (r.data.slice(0, 4) !== String(ano)) continue;
    const mesIdx = Number(r.data.slice(5, 7)) - 1;
    if (mesIdx < 0 || mesIdx > 11) continue;
    if (r.tipo === "entrada") meses[mesIdx].entradas += Number(r.valor);
    else if (r.tipo === "saida") meses[mesIdx].saidas += Number(r.valor);
  }
  return meses;
}
