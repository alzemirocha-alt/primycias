"use client";

export default function SelectCulto({ cultos, value, onChange }) {
  const abertos = cultos.filter(c => c.status === 'aberto');

  return (
    <select
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      className="w-full border rounded-lg px-3 py-2 bg-white"
      required
    >
      <option value="">Selecione o culto (obrigatório)</option>
      {abertos.map(c => (
        <option key={c.id} value={c.id}>
          {new Date(c.data+'T00:00:00').toLocaleDateString('pt-BR')} - {c.periodo} {c.total? `- R$ ${c.total}` : ''}
        </option>
      ))}
      {abertos.length === 0 && <option disabled>Nenhum culto aberto. Clique em + Abrir Culto</option>}
    </select>
  );
}
