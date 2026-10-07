import PlayerWheel from "@/components/PlayerWheel";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const {code}=await params;
  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-md">
        <header className="mb-5">
          <div className="text-xs font-bold tracking-[.22em] text-teal-600">EVENT CODE</div>
          <h1 className="text-2xl font-black">{code.toUpperCase()}</h1>
        </header>
        <PlayerWheel code={code.toLowerCase()} />
      </div>
    </main>
  );
}
