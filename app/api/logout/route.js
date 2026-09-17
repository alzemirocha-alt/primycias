import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST(request) {
  await destroySession();
  return NextResponse.redirect(new URL("/login", request.url));
}

export async function GET(request) {
  await destroySession();
  // Limpa o sessionStorage do navegador antes de redirecionar pro login
  // Isso garante que a mensagem de Boas Vindas apareça de novo no próximo login
  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta http-equiv="refresh" content="0; url=/login" /></head>
      <body>
        <script>
          try {
            Object.keys(sessionStorage).forEach(function(k){
              if(k.startsWith('boas_vindas_')) sessionStorage.removeItem(k);
            });
            sessionStorage.removeItem('sessao_ativa_primycias');
            sessionStorage.removeItem('boas_vindas_usuario');
            sessionStorage.removeItem('boas_vindas_mostrada');
          } catch(e) {}
          window.location.href = '/login';
        </script>
        Saindo...
      </body>
    </html>
  `;
  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
