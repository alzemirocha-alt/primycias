import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST(request) {
  await destroySession();
  return NextResponse.redirect(new URL("/login", request.url));
}

export async function GET(request) {
  await destroySession();
  return NextResponse.redirect(new URL("/login", request.url));
}
