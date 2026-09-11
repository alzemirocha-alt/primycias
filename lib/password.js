import "server-only";
import bcrypt from "bcryptjs";

export async function hashPassword(plain) {
  return bcrypt.hash(String(plain), 10);
}

// Aceita hash bcrypt normal ($2a$/$2b$/$2y$...) e, como fallback só para
// contas antigas cujo `senha_hash` acabou salvo em texto puro (ex.: linha
// inserida manualmente na tabela, fora do fluxo de cadastro do app),
// compara em texto puro também. Isso é só uma rede de segurança de
// migração — toda senha nova continua sempre sendo gravada com hash.
export async function verifyPassword(plain, hash) {
  if (!hash) return false;
  const pareceHashBcrypt = /^\$2[aby]\$/.test(hash);
  if (pareceHashBcrypt) {
    return bcrypt.compare(String(plain), hash);
  }
  return String(plain) === String(hash);
}

// Mesmas regras já usadas no protótipo original:
// 4 dígitos, sem sequência, no máximo 2 dígitos repetidos, e diferente do
// ano ou da combinação de dia/mês de nascimento.
export function validarSenha(senha, dataNascimentoISO) {
  if (!/^\d{4}$/.test(senha || "")) {
    return "A senha deve ter exatamente 4 dígitos numéricos.";
  }
  const d = senha.split("").map(Number);
  const seqAsc = d.every((n, i) => i === 0 || n === d[i - 1] + 1);
  const seqDesc = d.every((n, i) => i === 0 || n === d[i - 1] - 1);
  if (seqAsc || seqDesc) {
    return "A senha não pode ser uma sequência (ex.: 1234, 4321).";
  }
  const contagem = {};
  d.forEach((n) => { contagem[n] = (contagem[n] || 0) + 1; });
  if (Object.values(contagem).some((c) => c > 2)) {
    return "A senha não pode ter mais de 2 números iguais.";
  }
  if (dataNascimentoISO) {
    const [ano, mes, dia] = dataNascimentoISO.split("-");
    if (ano && senha === ano) return "A senha não pode ser o ano de nascimento.";
    const diaMes = `${dia}${mes}`;
    const mesDia = `${mes}${dia}`;
    if (senha === diaMes || senha === mesDia) {
      return "A senha não pode ser a combinação do dia e mês de nascimento.";
    }
  }
  return null;
}
