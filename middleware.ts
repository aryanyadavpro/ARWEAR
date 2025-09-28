import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  // In a full SSR setup you'd refresh Supabase session here if needed
  return NextResponse.next()
}
