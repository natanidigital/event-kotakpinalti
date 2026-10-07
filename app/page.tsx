import Link from "next/link";
import PlayerWheel from "@/components/PlayerWheel";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-md">
        <header className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold tracking-[.22em] text-teal-600">KOTAKPINALTI EVENT</div>
            <h1 className="text-2xl font-black">Fun Football Draw</h1>
          </div>
          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700">OPEN</span>
        </header>
        <PlayerWheel />
        <div className="mt-4 flex justify-center">
          <Link href="/admin" className="text-xs font-bold text-slate-400 underline">Admin prototype</Link>
        </div>
        <p className="py-5 text-center text-xs text-slate-400">Powered by KotakPinalti.com</p>
      </div>
    </main>
  );
}
