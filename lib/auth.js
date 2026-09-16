import { SignJWT, jwtVerify } from "jose";
import { supabaseAdmin } from "./supabaseAdmin";
import { DEV_EMAIL } from "./constants";

const COOKIE_NAME = "primycias_session";
const DEV_COOKIE_NAME = "primycias_dev_session";
const ONE_WEEK = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Defina SESSION_SECRET no .env.local");
  return new TextEncoder().encode(secret);
}

async function getCookieStore() {
  const mod = await import("next/headers");
  // Next 15: cookies() é async. Next 14: é sync. Esse código funciona nos dois.
  const store = typeof mod.cookies === 'function' ? await mod.cookies() : mod.cookies;
  return store;
}

export async function createSession(userId) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ONE_WEEK}s`)
    .sign(getSecret());
  const cookieStore = await getCookieStore();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_WEEK,
  });
}

export async function destroySession() {
  const cookieStore = await getCookieStore();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUser() {
  const cookieStore = await getCookieStore();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  let payload;
  try { ({ payload } = await jwtVerify(token, getSecret())); } catch { return null; }
  let { data, error } = await supabaseAdmin.from("users").select("*").eq("id", payload.uid).maybeSingle();
  if (!data) {
    const fallback = await supabaseAdmin.from("usuarios").select("*").eq("id", payload.uid).maybeSingle();
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
export async function getChurch(igrejaId) { return getIgreja(igrejaId); }

export async function createDevSession(adminId, email) {
  const token = await new SignJWT({ aid: adminId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ONE_WEEK}s`)
    .sign(getSecret());
  const cookieStore = await getCookieStore();
  cookieStore.set(DEV_COOKIE_NAME, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: ONE_WEEK,
  });
}

export async function destroyDevSession() {
  const cookieStore = await getCookieStore();
  cookieStore.delete(DEV_COOKIE_NAME);
}

export async function getDevSessionUser() {
  const cookieStore = await getCookieStore();
  const token = cookieStore.get(DEV_COOKIE_NAME)?.value;
  if (!token) return null;
  let payload;
  try { ({ payload } = await jwtVerify(token, getSecret())); } catch { return null; }
  if (payload.email !== DEV_EMAIL) return null;
  const { data } = await supabaseAdmin.from("plataforma_admins").select("id, email, nome").eq("id", payload.aid).eq("email", DEV_EMAIL).maybeSingle();
  return data || null;
}
