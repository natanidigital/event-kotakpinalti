import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

export function publicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } });
}
export const validCode = (code: string) => /^[a-z0-9-]{3,40}$/.test(code);
export function sessionToken(request: NextRequest, code: string) {
  const token = request.cookies.get(`kp_${code}`)?.value;
  return token && /^[0-9a-f-]{36}$/.test(token) ? token : null;
}
export function newToken() { return randomUUID(); }
export function saveToken(response: NextResponse, code: string, token: string) {
  response.cookies.set(`kp_${code}`,token,{ httpOnly:true,secure:process.env.NODE_ENV === "production",sameSite:"lax",path:"/",maxAge:60*60*24*30 });
}
export function sameOrigin(request: NextRequest) {
  return request.headers.get("origin") === request.nextUrl.origin;
}
export function failure(message: string) {
  const known: Record<string,string> = { EVENT_FULL:"Semua tim sudah penuh.",EVENT_NOT_OPEN:"Event belum dibuka atau sudah ditutup.",PLAYER_NOT_FOUND:"Daftarkan nama Anda terlebih dahulu.",EVENT_NOT_FOUND:"Event tidak ditemukan." };
  const code = Object.keys(known).find(key => message.includes(key));
  return NextResponse.json({ error: code ? known[code] : "Permintaan gagal. Coba lagi atau hubungi admin." },{status:code ? 409 : 503});
}
