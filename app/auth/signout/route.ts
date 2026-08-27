import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // 303, not the NextResponse.redirect default of 307. A 307 preserves the
  // request method, so the browser would re-POST to /login — a page route,
  // which only answers GET — and the person clicking "Sign out" lands on a
  // 405 error instead of the login screen. 303 is the status that means
  // "your POST is done, now GO GET this other thing".
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
