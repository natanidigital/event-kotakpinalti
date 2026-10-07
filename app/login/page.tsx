"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/browser";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const { error } = await browserClient().auth.signInWithPassword({
        email: String(form.get("email")), password: String(form.get("password")),
      });
      if (error) throw error;
      router.replace("/admin"); router.refresh();
    } catch { setError("Login gagal. Periksa email dan password admin Anda."); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-md px-4 py-12">
    <h1 className="mb-6 text-3xl font-black">Login Admin</h1>
    <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
      <label className="block">Email<input required name="email" type="email" autoComplete="username" className="mt-2 w-full rounded-xl border p-3" /></label>
      <label className="block">Password<input required name="password" type="password" autoComplete="current-password" className="mt-2 w-full rounded-xl border p-3" /></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-teal-700 p-3 font-bold text-white disabled:opacity-50">{busy ? "Memproses…" : "Masuk"}</button>
    </form>
  </main>;
}
