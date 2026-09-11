function diffDays(nascimento) {
  if (!nascimento) return null;
  const hoje = new Date();
  const [, m, d] = nascimento.split("-").map(Number);
  const aniversarioEsteAno = new Date(hoje.getFullYear(), m - 1, d);
  const ontem = new Date(hoje); ontem.setDate(hoje.getDate() - 1);
  const isHoje = hoje.getMonth() === m - 1 && hoje.getDate() === d;
  const isOntem = ontem.getMonth() === m - 1 && ontem.getDate() === d;
  return { isHoje, isOntem };
}

export default function BirthdayBanners({ me, users }) {
  const meuAniversario = diffDays(me.data_nascimento);
  const souAniversariante = meuAniversario?.isHoje || meuAniversario?.isOntem;

  const outrosHoje = users.filter((u) => {
    if (u.id === me.id || u.status !== "ativo") return false;
    const d = diffDays(u.data_nascimento);
    return d?.isHoje;
  });

  if (!souAniversariante && outrosHoje.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      {souAniversariante && (
        <div className="p-3 rounded-sm text-sm" style={{ background: "#E9F2EC", color: "#1E5631" }}>
          🎉 Parabéns pelo seu aniversário, {me.nome.split(" ")[0]}! Que Deus continue te abençoando.
        </div>
      )}
      {outrosHoje.map((u) => (
        <div key={u.id} className="p-3 rounded-sm text-sm bg-paperDeep">
          🎂 Hoje é aniversário de <b>{u.nome}</b>! Que tal mandar uma mensagem ou ligar para desejar feliz aniversário?
        </div>
      ))}
    </div>
  );
}
