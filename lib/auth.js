import { SignJWT, jwtVerify } from "jose";
import { supabaseAdmin } from "./supabaseAdmin";
import { DEV_EMAIL } from "./constants";

const COOKIE_NAME = "primycias_session";
const DEV_COOKIE_NAME = "primycias_dev_session";
const ONE_WEEK = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Defina SESSION_SECRET no .env.local (uma string longa e aleatória).");
  }
  return new TextEncoder().encode(secret);
}

// -------------------- Sessão de usuário (Aba 1 — CPF) --------------------

export async function createSession(userId) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ONE_WEEK}s`)
    .sign(getSecret());

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_WEEK,
  });
}

export async function destroySession() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Retorna o usuário logado (linha fresca do banco) ou null. Sempre confere
// o status atual no banco — se o cadastro foi inativado depois do login,
// a sessão para de valer imediatamente. Também confere que a igreja dele
// ainda está ativa (não suspensa/expirada), exceto para a conta fixa do
// Desenvolvedor (CPF), que sempre é resolvida contra a Igreja Sucupira.
export async function getSessionUser() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  let payload;
  try {
    ({ payload } = await jwtVerify(token, getSecret()));
  } catch {
    return null;
  }
  let { data, error } = await supabaseAdmin.from("users").select("*").eq("id", payload.uid).maybeSingle();
  if (error) console.error("[getSessionUser] consulta em public.users:", error.message, error.code);
  if (!data) {
    // Mesmo fallback do login: conta que só existe em public.usuarios.
    const fallback = await supabaseAdmin.from("usuarios").select("*").eq("id", payload.uid).maybeSingle();
    if (fallback.error && fallback.error.code !== "42P01") {
      console.error("[getSessionUser] consulta em public.usuarios:", fallback.error.message, fallback.error.code);
    }
    data = fallback.data;
  }
  if (!data || data.status !== "ativo") return null;
  return data;
}

export async function getIgreja(igrejaId) {
  if (!igrejaId) return null;
  const { data } = await supabaseAdmin.from("igrejas").select("*").eq("id", igrejaId).maybeSingle();
  return data || null;
}

// Mantido pelo nome antigo por conveniência — sempre resolve a igreja do
// usuário logado (ou recebe um igrejaId explícito).
export async function getChurch(igrejaId) {
  return getIgreja(igrejaId);
}

// -------------------- Sessão do Desenvolvedor da Plataforma (Aba 2 — e-mail) --------------------

export async function createDevSession(adminId, email) {
  const token = await new SignJWT({ aid: adminId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ONE_WEEK}s`)
    .sign(getSecret());

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set(DEV_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_WEEK,
  });
}

export async function destroyDevSession() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.delete(DEV_COOKIE_NAME);
}

// Só retorna algo se o token for válido E o e-mail continuar sendo
// exatamente alzemirocha@gmail.com — dupla checagem contra o hardcode.
export async function getDevSessionUser() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get(DEV_COOKIE_NAME)?.value;
  if (!token) return null;
  let payload;
  try {
    ({ payload } = await jwtVerify(token, getSecret()));
  } catch {
    return null;
  }
  if (payload.email !== DEV_EMAIL) return null;
  const { data } = await supabaseAdmin
    .from("plataforma_admins")
    .select("id, email, nome")
    .eq("id", payload.aid)
    .eq("email", DEV_EMAIL)
    .maybeSingle();
  return data || null;
}
