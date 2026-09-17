function diffDays(nascimento) {
  if (!nascimento) return null;
  const hoje = new Date();
  // nascimento vem como YYYY-MM-DD
  const parts = nascimento.split("-").map(Number);
  if (parts.length < 3) return null;
  const [, m, d] = parts;
  const isHoje = hoje.getMonth() === m - 1 && hoje.getDate() === d;
  return { isHoje };
}

export default function BirthdayBanners({ me, users }) {
  const meuAniversario = diffDays(me.data_nascimento);
  const souAniversariante = meuAniversario?.isHoje;

  const outrosHoje = users.filter((u) => {
    if (u.id === me.id || u.status!== "ativo") return false;
    const d = diffDays(u.data_nascimento);
    return d?.isHoje;
  });

  if (!souAniversariante && outrosHoje.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      {souAniversariante && (
        <div className="p-3 rounded-sm text-sm" style={{ background: "#E9F2EC", color: "#1E5631", borderLeft: "4px solid #1E5631" }}>
          🎉 Parabéns pelo seu aniversário, {me.nome.split(" ")[0]}! Que Deus continue te abençoando com muita saúde, paz e alegria. Você é importante para nós!
        </div>
      )}
      {outrosHoje.map((u) => (
        <div key={u.id} className="p-3 rounded-sm text-sm bg-paperDeep" style={{ borderLeft: "4px solid #D4A017" }}>
          🎂 Hoje é aniversário de <b>{u.nome}</b>! Que tal entrar em contato e desejar felicitações? {u.telefone? `📱 ${u.telefone}` : ""}
        </div>
      ))}
    </div>
  );
}
