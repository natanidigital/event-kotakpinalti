import Link from "next/link";
export default function Home() {
  return <main className="mx-auto max-w-md px-4 py-12"><p className="text-xs font-bold tracking-widest text-teal-700">KOTAKPINALTI EVENT</p><h1 className="mt-3 text-3xl font-black">Fun Football Draw</h1><p className="mt-4 text-slate-600">Buka link undangan event dari admin untuk mendaftar dan mendapatkan tim Anda.</p><Link href="/admin" className="mt-6 inline-block rounded-xl bg-teal-700 px-5 py-3 font-bold text-white">Kelola Event</Link></main>;
}
