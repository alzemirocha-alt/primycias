
import { createClient } from "@supabase/supabase-js";

// Este cliente usa a Service Role Key e SÓ pode ser importado em código de
// servidor (Server Actions, Route Handlers, Server Components) — nunca em
// um arquivo com "use client". A diretiva "server-only" garante isso: o
// build falha se algum componente de cliente tentar importar este arquivo.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL no .env.local");
}
if (!serviceKey) {
  throw new Error(
    "Defina SUPABASE_SERVICE_ROLE_KEY no .env.local — pegue em Supabase > Project Settings > API > service_role."
  );
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
