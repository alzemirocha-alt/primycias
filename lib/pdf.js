import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { brl, fmtDate, officeLabel } from "./constants";

const PAGE_W = 595.28, PAGE_H = 841.89, MARGIN = 50, BOTTOM = 792;
const INK = rgb(0x1e / 255, 0x56 / 255, 0x31 / 255);
const GRAY = rgb(0x45 / 255, 0x4a / 255, 0x45 / 255);
const LINE_GRAY = rgb(0.82, 0.85, 0.81);
const BLACK = rgb(0, 0, 0);

function wrap(t, maxChars) {
  const words = String(t?? "").split(/\s+/);
  const lines = [];
  let cur = "";
  words.forEach((w) => {
    if ((cur + " " + w).trim().length > maxChars) { lines.push(cur.trim()); cur = w; }
    else cur = (cur + " " + w).trim();
  });
  if (cur) lines.push(cur);
  return lines.length? lines : [""];
}

export async function createPDFCursor() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = MARGIN;
  let logoImg = null;
  let logoDims = null;

  function newPage() { page = doc.addPage([PAGE_W, PAGE_H]); y = MARGIN; }
  function ensureRoom(need) { if (y + need > BOTTOM) newPage(); }
  function text(x, t, { size = 10, boldText = false, color = BLACK } = {}) {
    page.drawText(String(t?? ""), { x, y: PAGE_H - y, size, font: boldText? bold : font, color });
  }
  function hrLine() {
    page.drawLine({ start: { x: MARGIN, y: PAGE_H - y }, end: { x: PAGE_W - MARGIN, y: PAGE_H - y }, thickness: 0.7, color: LINE_GRAY });
  }

  return {
    async setLogo(dataUrl) {
      if (!dataUrl ||!dataUrl.startsWith("data:image")) return;
      try {
        const base64 = dataUrl.split(",")[1];
        const bytes = Buffer.from(base64, "base64");
        logoImg = dataUrl.includes("image/png")? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
        const scale = 54 / logoImg.height;
        logoDims = { width: logoImg.width * scale, height: 54 };
      } catch {
        logoImg = null;
      }
    },
    title(t) { ensureRoom(30); text(MARGIN, t, { size: 16, boldText: true, color: INK }); y += 26; },
    header(church, me) {
      ensureRoom(70);
      const startY = y;
      const textX = logoImg? MARGIN + logoDims.width + 14 : MARGIN;
      if (logoImg) {
        page.drawImage(logoImg, { x: MARGIN, y: PAGE_H - startY - logoDims.height, width: logoDims.width, height: logoDims.height });
      }
      text(textX, church.nome || "", { size: 11, boldText: true, color: INK }); y += 14;
      const linha2 = [church.cnpj? `CNPJ: ${church.cnpj}` : "", church.cep? `CEP: ${church.cep}` : ""].filter(Boolean).join(" · ");
      if (linha2) { text(textX, linha2, { size: 8.5, color: GRAY }); y += 12; }
      if (church.endereco) { text(textX, church.endereco, { size: 8.5, color: GRAY }); y += 12; }
      if (logoImg) y = Math.max(y, startY + logoDims.height + 4);
      text(textX, `Emitido em: ${new Date().toLocaleString("pt-BR")}${me? ` · Por: ${me.nome} (${officeLabel(me)})` : ""}`, { size: 8, color: GRAY }); y += 10;
      hrLine(); y += 18;
    },
    subtitle(t) { ensureRoom(18); text(MARGIN, t, { size: 11.5, boldText: true, color: INK }); y += 18; },
    line(t, opts = {}) { ensureRoom(16); text(MARGIN, t, { size: opts.size || 10, boldText:!!opts.bold, color: opts.color || BLACK }); y += (opts.size || 10) + 4; },
    paragraph(t, maxChars = 100) { wrap(t, maxChars).forEach((l) => { ensureRoom(14); text(MARGIN, l, { size: 9.5 }); y += 14; }); },
    hr() { ensureRoom(10); hrLine(); y += 14; },
    space(n = 14) { y += n; },
    table(cols, rows) {
      ensureRoom(22);
      cols.forEach((c) => text(c.x, c.label, { size: 8.5, boldText: true, color: GRAY }));
      y += 4; hrLine(); y += 14;
      rows.forEach((r) => {
        ensureRoom(15);
        cols.forEach((c, i) => text(c.x, String(r[i]?? ""), { size: 9 }));
        y += 14;
      });
    },
    signature(lines) {
      ensureRoom(60 + lines.length * 13);
      y += 40;
      page.drawLine({ start: { x: MARGIN, y: PAGE_H - y }, end: { x: MARGIN + 250, y: PAGE_H - y }, thickness: 0.8, color: BLACK });
      y += 14;
      lines.forEach((l) => { text(MARGIN, l, { size: 9 }); y += 13; });
    },
    async bytes() { return doc.save(); },
  };
}

// ---------------------------------------------------------------------
// Construtores de relatórios específicos
// ---------------------------------------------------------------------

export async function buildRecordsPDF({ church, title, records, me }) {
  const c = await createPDFCursor();
  await c.setLogo(church.logo);
  c.title(title);
  c.header(church, me);
  let totalDz = 0, totalOf = 0;
  if (records.length === 0) c.line("Nenhum registro para exibir.");
  for (const r of records) {
    const itens = r.record_items || [];
    const dz = itens.filter((i) => i.tipo === "dizimo").reduce((s, i) => s + Number(i.valor), 0);
    const of = itens.filter((i) => i.tipo === "oferta").reduce((s, i) => s + Number(i.valor), 0);
    totalDz += dz; totalOf += of;
    c.subtitle(`Culto de ${fmtDate(r.data_culto)}`);
    c.table(
      [{ label: "Tipo", x: MARGIN }, { label: "Nome", x: MARGIN + 90 }, { label: "Valor", x: MARGIN + 380 }],
      itens.map((i) => [i.tipo === "dizimo"? "Dizimo" : "Oferta", i.nome, brl(i.valor)])
    );
    c.line(`Dizimos: ${brl(dz)} · Ofertas: ${brl(of)} · Total: ${brl(dz + of)}`, { bold: true, size: 9 });
    c.space(10);
  }
  c.hr();
  c.line(`Dizimos: ${brl(totalDz)} · Ofertas: ${brl(totalOf)} · Total geral: ${brl(totalDz + totalOf)}`, { bold: true, size: 11 });
  return c.bytes();
}

export async function buildLedgerPDF({ church, title, subtitle, rows, showSaldo, me }) {
  const c = await createPDFCursor();
  await c.setLogo(church.logo);
  c.title(title);
  c.header(church, me);
  if (subtitle) c.line(subtitle, { size: 9 });
  let totalEntradas = 0, totalSaidas = 0;
  rows.forEach((r) => { if (r.tipo === "entrada") totalEntradas += Number(r.valor); if (r.tipo === "saida") totalSaidas += Number(r.valor); });
  const cols = [
    { label: "Data", x: MARGIN }, { label: "Historico", x: MARGIN + 55 }, { label: "Categoria", x: MARGIN + 210 },
    { label: "Entrada", x: MARGIN + 320 }, { label: "Saida", x: MARGIN + 400 },
   ...(showSaldo? [{ label: "Saldo", x: MARGIN + 460 }] : []),
  ];
  const dataRows = rows.map((r) => [
    fmtDate(r.data), r.historico, r.categoria || "-",
    r.tipo === "entrada"? brl(r.valor) : "", r.tipo === "saida"? brl(r.valor) : "",
   ...(showSaldo? [brl(r.saldo)] : []),
  ]);
  if (dataRows.length === 0) c.line("Nenhum lançamento no período.");
  else c.table(cols, dataRows);
  c.hr();
  c.line(`Total de entradas: ${brl(totalEntradas)} · Total de saidas: ${brl(totalSaidas)} · Resultado: ${brl(totalEntradas - totalSaidas)}`, { bold: true, size: 10.5 });
  return c.bytes();
}

export async function buildBalancetePDF({ church, saldoInicial, totalEntradas, totalSaidas, categoriasEntrada, categoriasSaida, periodo, me }) {
  const c = await createPDFCursor();
  await c.setLogo(church.logo);
  c.title("Balancete");
  c.header(church, me);
  c.line(periodo, { size: 9 });
  c.space(6);
  c.line(`Saldo inicial ${saldoInicial?.saldo_inicial_data? `(em ${fmtDate(saldoInicial.saldo_inicial_data)})` : ""}: ${brl(saldoInicial?.saldo_inicial_valor || 0)}`);
  c.line(`(+) Total de entradas no periodo: ${brl(totalEntradas)} (100%)`);
  c.line(`(-) Total de saidas no periodo: ${brl(totalSaidas)} (100%)`);
  c.space(10);

  // ENTRADAS POR CATEGORIA COM PERCENTUAL
  c.subtitle("Entradas por categoria");
  const ent = Object.entries(categoriasEntrada || {});
  if (ent.length === 0) {
    c.line("Nenhuma entrada no período.", { size: 9.5 });
  } else {
    const cols = [
      { label: "Categoria", x: MARGIN },
      { label: "Valor", x: MARGIN + 200 },
      { label: "% do total", x: MARGIN + 350 },
    ];
    const rows = ent.map(([cat, val]) => {
      const pct = totalEntradas > 0? (Number(val) / totalEntradas) * 100 : 0;
      const nomeCat = cat === "dizimo"? "Dízimos" : cat === "oferta"? "Ofertas" : cat;
      return [nomeCat, brl(val), `${pct.toFixed(1).replace(".", ",")}%`];
    });
    rows.push(["TOTAL", brl(totalEntradas), "100,0%"]);
    c.table(cols, rows);
  }
  c.space(8);

  // SAÍDAS POR CATEGORIA COM PERCENTUAL
  c.subtitle("Saídas por categoria");
  const sai = Object.entries(categoriasSaida || {});
  if (sai.length === 0) {
    c.line("Nenhuma saída no período.", { size: 9.5 });
  } else {
    const cols = [
      { label: "Categoria", x: MARGIN },
      { label: "Valor", x: MARGIN + 200 },
      { label: "% do total", x: MARGIN + 350 },
    ];
    const rows = sai.map(([cat, val]) => {
      const pct = totalSaidas > 0? (Number(val) / totalSaidas) * 100 : 0;
      return [cat, brl(val), `${pct.toFixed(1).replace(".", ",")}%`];
    });
    rows.push(["TOTAL", brl(totalSaidas), "100,0%"]);
    c.table(cols, rows);
  }

  c.hr();
  const saldoFinal = (Number(saldoInicial?.saldo_inicial_valor) || 0) + totalEntradas - totalSaidas;
  c.line(`Saldo final do período: ${brl(saldoFinal)}`, { bold: true, size: 11 });
  return c.bytes();
}

export async function buildOrcamentoAnualPDF({ church, ano, categorias, me }) {
  const c = await createPDFCursor();
  await c.setLogo(church.logo);
  c.title(`Orçamento Anual — ${ano}`);
  c.header(church, me);
  const cols = [
    { label: "Categoria", x: MARGIN }, { label: "Previsto", x: MARGIN + 260 },
    { label: "Realizado", x: MARGIN + 360 }, { label: "Diferença", x: MARGIN + 460 },
  ];
  const dataRows = categorias.map((cat) => [
    cat.categoria, brl(cat.valor_previsto), brl(cat.valor_realizado), brl(cat.valor_realizado - cat.valor_previsto),
  ]);
  c.table(cols, dataRows);
  c.hr();
  const totalPrevisto = categorias.reduce((s, c2) => s + c2.valor_previsto, 0);
  const totalRealizado = categorias.reduce((s, c2) => s + c2.valor_realizado, 0);
  c.line(`Total previsto: ${brl(totalPrevisto)} · Total realizado: ${brl(totalRealizado)}`, { bold: true, size: 10.5 });
  return c.bytes();
}

export async function buildReciboDizimistaPDF({ church, nomeDizimista, itens, periodo, tesoureiro, me, titulo }) {
  const c = await createPDFCursor();
  await c.setLogo(church.logo);
  c.title(titulo || "Recibo de Dízimos e Ofertas");
  c.header(church, me);
  c.line(periodo, { size: 9 });
  c.subtitle(`Dizimista / Ofertante: ${nomeDizimista}`);
  const total = itens.reduce((s, i) => s + Number(i.valor), 0);
  if (itens.length === 0) {
    c.line("Nenhum dízimo ou oferta registrado no período.");
  } else {
    c.table(
      [
        { label: "Data", x: MARGIN },
        { label: "Tipo", x: MARGIN + 110 },
        { label: "Valor", x: MARGIN + 250 }
      ],
      itens.map((i) => [fmtDate(i.data), i.tipo? (i.tipo === "dizimo"? "Dízimo" : "Oferta") : "Dízimo", brl(i.valor)])
    );
  }
  c.hr();
  c.line(`Total no período (Dízimos e Ofertas): ${brl(total)}`, { bold: true, size: 11 });
  c.signature([tesoureiro?.nome || "—", "Tesoureiro(a) da Igreja", `Emitido em: ${new Date().toLocaleString("pt-BR")}`]);
  return c.bytes();
}

export async function buildReciboPagamentoPDF({ church, data, historico, valor, recebedorNome, recebedorDoc, me }) {
  const c = await createPDFCursor();
  await c.setLogo(church.logo);
  c.title("Recibo de Pagamento");
  c.header(church, me);
  c.subtitle("Fonte pagadora");
  c.line(`Nome: ${church.nome}`, { size: 9.5 });
  c.line(`CNPJ: ${church.cnpj || "-"}`, { size: 9.5 });
  c.line(`CEP: ${church.cep || "-"}`, { size: 9.5 });
  c.line(`Endereço: ${church.endereco || "-"}`, { size: 9.5 });
  c.space(6);
  c.subtitle("Recebedor(a)");
  c.line(`Nome: ${recebedorNome}`, { size: 9.5 });
  c.line(`CPF/CNPJ: ${recebedorDoc || "-"}`, { size: 9.5 });
  c.space(6);
  c.subtitle("Pagamento");
  c.line(`Data: ${fmtDate(data)}`, { size: 9.5 });
  c.line(`Histórico: ${historico}`, { size: 9.5 });
  c.line(`Valor: ${brl(valor)}`, { bold: true, size: 11 });
  c.hr();
  c.paragraph(`Declaro, para os devidos fins, ter recebido de ${church.nome}, CNPJ ${church.cnpj || "-"}, a quantia de ${brl(valor)}, referente a: ${historico}, em ${fmtDate(data)}.`);
  c.signature([recebedorNome, `CPF/CNPJ: ${recebedorDoc || "-"}`, "Assinatura do(a) recebedor(a)", `Emitido em: ${new Date().toLocaleString("pt-BR")}`]);
  return c.bytes();
}
