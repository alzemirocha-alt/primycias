import "server-only";
import { fmtDate } from "./constants";

// Formato padrão de colunas pedido para todo Excel exportado:
// Data | Membro | Tipo | Valor | Forma Pagamento | Categoria | Igreja
//
// Observação: o app ainda não registra a forma de pagamento (dinheiro, PIX,
// cartão...) em nenhum lançamento — a coluna existe no Excel para já vir no
// layout combinado, mas hoje sai sempre como "—" até esse dado passar a ser
// coletado nos formulários de lançamento.

export function recordItemsToExportRows(records, churchName) {
  const rows = [];
  for (const r of records || []) {
    for (const item of r.record_items || []) {
      rows.push({
        Data: fmtDate(r.data_culto),
        Membro: item.nome,
        Tipo: item.tipo === "dizimo" ? "Dízimo" : "Oferta",
        Valor: Number(item.valor) || 0,
        "Forma Pagamento": "—",
        Categoria: item.tipo === "dizimo" ? "Dízimo" : "Oferta",
        Igreja: churchName,
      });
    }
  }
  return rows;
}

export function ledgerToExportRows(rows, churchName) {
  return (rows || []).map((r) => ({
    Data: fmtDate(r.data),
    Membro: r.historico || "—",
    Tipo: r.tipo === "entrada" ? "Entrada" : "Saída",
    Valor: Number(r.valor) || 0,
    "Forma Pagamento": "—",
    Categoria: r.categoria || "—",
    Igreja: churchName,
  }));
}
