import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST(request) {
  destroySession();
  return NextResponse.redirect(new URL("/login", request.url));
}
