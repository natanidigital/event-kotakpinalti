const teams = [
  { name: "BLUE TEAM", count: "4/6", players: ["Anjar", "Yuke", "Rafid", "Mozi"] },
  { name: "ORANGE TEAM", count: "3/6", players: ["Bagas", "Uteh", "Bobo"] },
  { name: "TOSCA TEAM", count: "5/6", players: ["Dmar", "Sina", "Zaky", "Basir", "Pavlovic"] },
  { name: "BLACK TEAM", count: "2/6", players: ["Yaemo", "Payjanic"] }
];

export default function Admin() {
  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <div className="text-xs font-bold tracking-[.22em] text-orange-500">ADMIN PROTOTYPE</div>
          <h1 className="text-3xl font-black">Event Control</h1>
          <p className="mt-1 text-sm text-slate-500">Realtime controls and database persistence arrive in the Supabase phase.</p>
        </div>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {["24 Capacity", "14 Assigned", "10 Available"].map(x => (
            <div key={x} className="rounded-2xl bg-white p-3 text-center text-xs font-bold shadow-sm">{x}</div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {teams.map(t => (
            <section key={t.name} className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-black">{t.name}</h2>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-teal-700">{t.count}</span>
              </div>
              <ol className="mt-4 space-y-2 text-sm text-slate-600">
                {t.players.map((p,i)=><li key={p}>{i+1}. {p}</li>)}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
