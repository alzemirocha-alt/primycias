import "server-only";
import nodemailer from "nodemailer";
import { DEV_EMAIL } from "./constants";

// Envia e-mail pelo Gmail (SMTP) usando uma Senha de app da conta do
// Desenvolvedor da Plataforma. Configure em .env.local / Vercel:
//   GMAIL_USER=alzemirocha@gmail.com
//   GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx   (gerada em myaccount.google.com/apppasswords,
//                                           exige verificação em 2 etapas ativada)
//
// Se as variáveis não estiverem configuradas, a função não lança erro — só
// registra no log do servidor e segue em frente (o cadastro da igreja não
// pode travar por causa do e-mail).
function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendMail({ to, subject, html, text }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(
      "[email] GMAIL_USER/GMAIL_APP_PASSWORD não configurados — e-mail não enviado. Assunto:",
      subject
    );
    return { sent: false };
  }
  try {
    await transporter.sendMail({
      from: `"Primycias" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });
    return { sent: true };
  } catch (err) {
    console.error("[email] Falha ao enviar:", err);
    return { sent: false, error: String(err) };
  }
}

export async function notificarNovaIgrejaAction({ igreja, urlCnpj, urlResponsavel }) {
  const html = `
    <div style="font-family: sans-serif; font-size: 14px; color: #222;">
      <h2>Nova igreja cadastrada — aguardando aprovação</h2>
      <p><b>Nome:</b> ${igreja.nome}</p>
      <p><b>CNPJ:</b> ${igreja.cnpj || "—"}</p>
      <p><b>Pastor responsável:</b> ${igreja.nome_pastor_responsavel || "—"}</p>
      <p><b>CPF do pastor:</b> ${igreja.cpf_pastor || "—"}</p>
      <p><b>E-mail:</b> ${igreja.email || "—"}</p>
      <p><b>Telefone:</b> ${igreja.telefone || "—"}</p>
      <p><b>Endereço:</b> ${igreja.endereco || "—"}</p>
      <hr />
      <p><b>Cartão CNPJ:</b> <a href="${urlCnpj}">${urlCnpj}</a></p>
      <p><b>Documento do Pastor (RG/CNH):</b> <a href="${urlResponsavel}">${urlResponsavel}</a></p>
      <hr />
      <p>Acesse o painel do desenvolvedor para aprovar ou reprovar este cadastro.</p>
    </div>
  `;
  return sendMail({
    to: DEV_EMAIL,
    subject: `Nova igreja cadastrada: ${igreja.nome}`,
    html,
  });
}
