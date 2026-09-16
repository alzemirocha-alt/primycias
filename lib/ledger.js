// Combina os registros de culto validados (entradas) com os lançamentos
// aprovados (entradas/saídas manuais) numa única lista cronológica, com
// saldo acumulado a partir do saldo inicial.
export function computeLedgerRealizado(records, lancamentos, financas) {
  const rows = [];

  (records || [])
    .filter((r) => r.status === "validado")
    .forEach((r) => {
      const itens = r.record_items || [];
      
      // NOVO: Se tem itens, mostra cada um com nome
      if (itens.length > 0) {
        itens.forEach((i) => {
          const tipoLabel = (i.tipo||'').toLowerCase() === 'dizimo' ? 'Dízimo' : 'Oferta'
          const nome = i.membro_nome || i.nome || r.membro_nome || 'Membro'
          rows.push({ 
            tipo: "entrada", 
            data: r.data_culto, 
            historico: `${tipoLabel} - ${nome}`, 
            categoria: tipoLabel, 
            valor: Number(i.valor||0),
            membro: nome,
            diacono: r.diacono1_nome
          });
        })
      } else {
        // COMPATIBILIDADE: records antigos sem record_items (tem valor direto)
        // cada record já é um lançamento individual
        const tipoLabel = String(r.tipo||'').toLowerCase().includes('dizimo') ? 'Dízimo' : 'Oferta'
        const nome = r.membro_nome || 'Membro'
        if (Number(r.valor) > 0) {
          rows.push({ 
            tipo: "entrada", 
            data: r.data_culto, 
            historico: `${tipoLabel} - ${nome}`, 
            categoria: tipoLabel, 
            valor: Number(r.valor||0),
            membro: nome,
            diacono: r.diacono1_nome
          });
        }
      }
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
