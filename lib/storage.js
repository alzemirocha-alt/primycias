import "server-only";
import { supabaseAdmin } from "./supabaseAdmin";

const BUCKET = "documentos-licencas";

function extFromDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,/.exec(dataUrl || "");
  const mime = match?.[1] || "application/octet-stream";
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  return "bin";
}

// Recebe uma data URL (base64) vinda do formulário do navegador e sobe para
// o bucket privado `documentos-licencas`. Retorna o caminho salvo no bucket
// (não uma URL pública — o bucket é privado, então toda leitura passa por
// signed URL gerada sob demanda no painel do desenvolvedor).
export async function uploadIgrejaDoc(igrejaSlug, campo, dataUrl) {
  if (!dataUrl || !dataUrl.startsWith("data:")) {
    throw new Error("Arquivo inválido.");
  }
  const [, base64] = dataUrl.split(",");
  const buffer = Buffer.from(base64, "base64");
  const ext = extFromDataUrl(dataUrl);
  const contentType = /^data:([^;]+);/.exec(dataUrl)[1];
  const path = `${igrejaSlug}/${campo}-${Date.now()}.${ext}`;

  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) throw new Error(`Não foi possível enviar o documento (${campo}): ${error.message}`);
  return path;
}

// Gera uma URL temporária (1 hora) para o Desenvolvedor visualizar o
// documento no painel /desenvolvedor.
export async function getSignedDocUrl(path, expiresInSeconds = 3600) {
  if (!path) return null;
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data?.signedUrl || null;
}

export function slugify(nome) {
  return String(nome || "igreja")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "igreja";
}
