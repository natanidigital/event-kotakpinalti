import PlayerWheel from "@/components/PlayerWheel";

export default function JoinPage({ params }: { params: { code: string } }) {
  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-md">
        <header className="mb-5">
          <div className="text-xs font-bold tracking-[.22em] text-teal-600">EVENT CODE</div>
          <h1 className="text-2xl font-black">{params.code.toUpperCase()}</h1>
        </header>
        <PlayerWheel />
      </div>
    </main>
  );
}
