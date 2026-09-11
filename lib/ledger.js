// Combina os registros de culto validados (entradas) com os lançamentos
// aprovados (entradas/saídas manuais) numa única lista cronológica, com
// saldo acumulado a partir do saldo inicial.
export function computeLedgerRealizado(records, lancamentos, financas) {
  const rows = [];

  (records || [])
    .filter((r) => r.status === "validado")
    .forEach((r) => {
      const itens = r.record_items || [];
      const dz = itens.filter((i) => i.tipo === "dizimo").reduce((s, i) => s + Number(i.valor), 0);
      const of = itens.filter((i) => i.tipo === "oferta").reduce((s, i) => s + Number(i.valor), 0);
      if (dz > 0) rows.push({ tipo: "entrada", data: r.data_culto, historico: "Dízimos do culto", categoria: "Dízimo", valor: dz });
      if (of > 0) rows.push({ tipo: "entrada", data: r.data_culto, historico: "Ofertas do culto", categoria: "Oferta", valor: of });
    });

  (lancamentos || [])
    .filter((l) => l.status === "aprovado" && l.data <= new Date().toISOString().slice(0, 10))
    .forEach((l) => {
      rows.push({ tipo: l.tipo, data: l.data, historico: l.historico, categoria: l.categoria, valor: Number(l.valor) });
    });

  rows.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));

  let saldo = Number(financas?.saldo_inicial_valor) || 0;
  if (financas?.saldo_inicial_data) {
    rows.unshift({ tipo: null, data: financas.saldo_inicial_data, historico: "Saldo inicial", categoria: "", valor: 0, saldo });
  }
  return rows.map((r) => {
    if (r.tipo === "entrada") saldo += r.valor;
    if (r.tipo === "saida") saldo -= r.valor;
    return { ...r, saldo };
  });
}

export function futureRows(lancamentos) {
  const hoje = new Date().toISOString().slice(0, 10);
  return (lancamentos || [])
    .filter((l) => l.data > hoje)
    .map((l) => ({ tipo: l.tipo, data: l.data, historico: l.historico, categoria: l.categoria, valor: Number(l.valor) }))
    .sort((a, b) => (a.data < b.data ? -1 : 1));
}
