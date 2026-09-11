import { NextResponse } from "next/server";
import { destroyDevSession } from "@/lib/auth";

export async function POST(request) {
  destroyDevSession();
  return NextResponse.redirect(new URL("/login", request.url));
}
