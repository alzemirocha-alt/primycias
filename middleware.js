import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/validar", "/carteira"];
const DEV_PREFIX = "/desenvolvedor";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isDevArea = pathname === DEV_PREFIX || pathname.startsWith(DEV_PREFIX + "/");

  if (isPublic) {
    return NextResponse.next();
  }

  if (isDevArea) {
    const hasDevSession = request.cookies.has("primycias_dev_session");
    if (!hasDevSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const hasSession = request.cookies.has("primycias_session");

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"],
};
