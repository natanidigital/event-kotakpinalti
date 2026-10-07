"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import type {EventSnapshot,PlayerSession,Result} from "@/lib/types";
export default function PlayerWheel({code}:{code:string}) {
  const [event,setEvent]=useState<EventSnapshot|null>(null),[player,setPlayer]=useState<PlayerSession|null>(null);
  const [name,setName]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  const [result,setResult]=useState<Result|null>(null),[turn,setTurn]=useState(0);
  const pending=useRef(false),mounted=useRef(true),timer=useRef<ReturnType<typeof setTimeout>>();
  const refresh=useCallback(async()=>{
    try {
      const response=await fetch(`/api/events/${code}`,{cache:"no-store"}),data=await response.json();
      if(!response.ok) throw new Error(data.error);
      if(!mounted.current) return;
      setEvent(data.event);setPlayer(data.player);if(data.player) setName(data.player.name);
      if(!pending.current) setResult(data.player?.result || null);
    } catch(e) {if(mounted.current) setError(e instanceof Error?e.message:"Koneksi gagal.");}
  },[code]);
  useEffect(()=>{mounted.current=true;void refresh();const interval=setInterval(refresh,5000);return()=>{mounted.current=false;clearInterval(interval);clearTimeout(timer.current);};},[refresh]);
  async function spin() {
    if(pending.current || result || !event) return;
    pending.current=true;setBusy(true);setError("");
    try {
      if(!player) {
        const response=await fetch(`/api/events/${code}/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name})}),data=await response.json();
        if(!response.ok) throw new Error(data.error);
      }
      const response=await fetch(`/api/events/${code}/spin`,{method:"POST"}),data=await response.json();
      if(!response.ok) throw new Error(data.error);
      const index=event.teams.findIndex(t=>t.id===data.result.team_id);
      if(index<0) throw new Error("Refresh halaman untuk melihat hasil tersimpan.");
      const target=(360-(index+.5)*360/event.teams.length)%360;
      setTurn(previous=>previous+1800+((target-previous%360+360)%360));
      timer.current=setTimeout(()=>{if(!mounted.current)return;setResult(data.result);pending.current=false;setBusy(false);void refresh();},1800);
    } catch(e) {setError(e instanceof Error?e.message:"Koneksi gagal.");pending.current=false;setBusy(false);void refresh();}
  }
  if(!event)return <section className="rounded-3xl bg-white p-6"><p role="status">{error || "Memuat event…"}</p><button onClick={refresh} className="mt-3 underline">Muat ulang</button></section>;
  const full=event.teams.every(t=>t.assigned_players>=t.max_players);
  const gradient=`conic-gradient(${event.teams.map((t,i)=>`${t.color} ${i*360/event.teams.length}deg ${(i+1)*360/event.teams.length}deg`).join(",")})`;
  return <>
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-5 rounded-3xl bg-teal-700 p-5 text-white"><p className="text-sm">Selamat datang di</p><h2 className="text-2xl font-black">{event.name}</h2><p className="mt-2 text-sm">{event.status==="open"?"Isi nama, putar sekali, dan temui tim Anda.":"Event sudah ditutup."}</p></div>
      <label htmlFor="player-name" className="text-sm font-bold">Nama pemain</label>
      <input id="player-name" value={name} maxLength={80} onChange={e=>setName(e.target.value)} disabled={!!player || busy || !!result} placeholder="Contoh: Anjar" className="mt-2 w-full rounded-2xl border px-4 py-3 disabled:bg-slate-50" />
      <div className="mt-7 flex flex-col items-center" aria-hidden="true"><div className="pointer z-10 mb-[-3px]" /><div className="wheel relative h-64 w-64 rounded-full border-[10px] border-white transition-transform duration-[1800ms] ease-out" style={{background:gradient,transform:`rotate(${turn}deg)`}}>
        {event.teams.map((team,i)=>{const angle=(i+.5)*2*Math.PI/event.teams.length;return <span key={team.id} className="absolute max-w-20 -translate-x-1/2 -translate-y-1/2 break-words text-center text-[10px] font-black text-white" style={{left:`${50+33*Math.sin(angle)}%`,top:`${50-33*Math.cos(angle)}%`,textShadow:"0 1px 3px black"}}>{team.name}</span>;})}
      </div></div>
      <button onClick={spin} disabled={!name.trim() || busy || !!result || full || event.status!=="open"} className="mt-7 w-full rounded-2xl bg-orange-500 py-4 font-black text-white disabled:opacity-40">{busy?"MENGUNDI…":result?"TIM TERSIMPAN":full?"TIM SUDAH PENUH":"SPIN THE WHEEL"}</button>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {result && <div role="status" className="mt-4 rounded-2xl bg-teal-50 p-4 text-center"><p className="text-xs font-bold">TIM ANDA</p><p className="text-2xl font-black" style={{color:result.team_color}}>{result.team_name}</p><p className="mt-1 text-xs text-slate-500">Hasil tersimpan di browser dan perangkat ini.</p></div>}
    </section>
    <section className="mt-4 rounded-3xl bg-white p-5"><h3 className="mb-3 font-black">Ketersediaan tim</h3><div className="grid grid-cols-2 gap-2">{event.teams.map(team=><div key={team.id} className="rounded-2xl border p-3"><p className="text-xs font-black">{team.name}</p><p className="mt-1 text-sm text-slate-500">{Math.max(0,team.max_players-team.assigned_players)} slot tersedia</p></div>)}</div><p className="mt-3 text-xs text-slate-400">Diperbarui setiap 5 detik</p></section>
  </>;
}
