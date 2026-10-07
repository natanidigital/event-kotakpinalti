"use client";
import {useCallback,useEffect,useMemo,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {browserClient} from "@/lib/supabase/browser";
type EventRow={id:string;name:string;code:string;status:string;randomization_mode:string};
type TeamRow={id:string;name:string;color:string;max_players:number};
type Assignment={id:string;team_id:string;player_id:string};
type Player={id:string;name:string};
export default function AdminDashboard({userId}:{userId:string}) {
  const db=useMemo(()=>browserClient(),[]),router=useRouter();
  const [events,setEvents]=useState<EventRow[]>([]),[selected,setSelected]=useState("");
  const [teams,setTeams]=useState<TeamRow[]>([]),[players,setPlayers]=useState<Player[]>([]),[assignments,setAssignments]=useState<Assignment[]>([]);
  const [error,setError]=useState(""),[busy,setBusy]=useState(false),[live,setLive]=useState(false);
  const [draftTeams,setDraftTeams]=useState([{name:"BLUE TEAM",color:"#2563eb",max_players:6},{name:"ORANGE TEAM",color:"#f97316",max_players:6},{name:"TOSCA TEAM",color:"#14b8a6",max_players:6},{name:"BLACK TEAM",color:"#17202a",max_players:6}]);
  const loadEvents=useCallback(async()=>{
    const {data,error}=await db.from("events").select("id,name,code,status,randomization_mode").eq("created_by",userId).order("created_at",{ascending:false});
    if(error){setError("Gagal memuat event. Periksa koneksi dan migration database.");return;}
    setEvents(data || []);setSelected(current=>current || data?.[0]?.id || "");
  },[db,userId]);
  const loadRoster=useCallback(async()=>{
    if(!selected){setTeams([]);setPlayers([]);setAssignments([]);return;}
    const results=await Promise.all([db.from("teams").select("id,name,color,max_players").eq("event_id",selected).order("sort_order"),db.from("players").select("id,name").eq("event_id",selected),db.from("assignments").select("id,team_id,player_id").eq("event_id",selected)]);
    if(results.some(r=>r.error)){setError("Gagal memuat roster.");return;}
    setTeams(results[0].data || []);setPlayers(results[1].data || []);setAssignments(results[2].data || []);
  },[db,selected]);
  useEffect(()=>{void loadEvents();},[loadEvents]);
  useEffect(()=>{
    void loadRoster();if(!selected)return;
    const channel=db.channel(`roster-${selected}`).on("postgres_changes",{event:"*",schema:"public",table:"assignments",filter:`event_id=eq.${selected}`},()=>void loadRoster()).on("postgres_changes",{event:"*",schema:"public",table:"players",filter:`event_id=eq.${selected}`},()=>void loadRoster()).subscribe(status=>setLive(status==="SUBSCRIBED"));
    const interval=setInterval(loadRoster,10000);
    return()=>{clearInterval(interval);setLive(false);void db.removeChannel(channel);};
  },[db,selected,loadRoster]);
  async function create(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();const form=event.currentTarget,values=new FormData(form);setBusy(true);setError("");
    try {
      const response=await fetch("/api/admin/events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:values.get("name"),code:String(values.get("code")).toLowerCase(),mode:values.get("mode"),teams:draftTeams})}),data=await response.json();
      if(!response.ok)throw new Error(data.error);await loadEvents();setSelected(data.id);form.reset();
    }catch(e){setError(e instanceof Error?e.message:"Koneksi gagal.");}finally{setBusy(false);}
  }
  async function status(value:string) {
    setBusy(true);setError("");try {
      const response=await fetch("/api/admin/events",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:selected,status:value})}),data=await response.json();
      if(!response.ok)throw new Error(data.error);await loadEvents();
    }catch(e){setError(e instanceof Error?e.message:"Koneksi gagal.");}finally{setBusy(false);}
  }
  const current=events.find(e=>e.id===selected),capacity=teams.reduce((n,t)=>n+t.max_players,0),names=new Map(players.map(p=>[p.id,p.name]));
  return <main className="mx-auto max-w-3xl px-4 py-6">
    <header className="mb-6 flex items-center justify-between"><div><p className="text-xs font-bold text-orange-600">KOTAKPINALTI ADMIN</p><h1 className="text-3xl font-black">Event Control</h1></div><button className="underline" onClick={async()=>{const {error}=await db.auth.signOut();if(error){setError("Gagal keluar. Coba lagi.");return;}router.replace("/login");router.refresh();}}>Keluar</button></header>
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
    <section className="mb-6 rounded-3xl bg-white p-5">
      <label htmlFor="event-select" className="font-bold">Event Anda</label><select id="event-select" className="mt-2 w-full rounded-xl border p-3" value={selected} onChange={e=>{setSelected(e.target.value);setTeams([]);setPlayers([]);setAssignments([]);}}><option value="">Pilih event</option>{events.map(e=><option value={e.id} key={e.id}>{e.name} ({e.status})</option>)}</select>
      {current && <><p className="mt-3 text-sm">Mode: {current.randomization_mode} · Status: {current.status}</p><a className="mt-2 block break-all font-bold text-teal-700 underline" href={`/join/${current.code}`} target="_blank" rel="noreferrer">Link pemain: /join/{current.code}</a><div className="mt-4 flex gap-3"><button disabled={busy || !teams.length || current.status==="open"} onClick={()=>status("open")} className="rounded-xl bg-teal-700 px-4 py-2 text-white disabled:opacity-40">Buka Event</button><button disabled={busy || current.status!=="open"} onClick={()=>status("closed")} className="rounded-xl bg-slate-700 px-4 py-2 text-white disabled:opacity-40">Tutup Event</button></div></>}
    </section>
    {current && <><div className="mb-4 grid grid-cols-3 gap-2">{[`${capacity} Kapasitas`,`${assignments.length} Terisi`,`${capacity-assignments.length} Tersedia`].map(x=><div key={x} className="rounded-xl bg-white p-3 text-center text-sm font-bold">{x}</div>)}</div><p className="mb-3 text-xs text-slate-500">{live?"Roster realtime aktif":"Roster diperbarui setiap 10 detik"} · {players.length} pemain terdaftar</p><div className="mb-6 grid gap-3 sm:grid-cols-2">{teams.map(t=>{const roster=assignments.filter(a=>a.team_id===t.id);return <section key={t.id} className="rounded-3xl border-t-4 bg-white p-5" style={{borderColor:t.color}}><h2 className="font-black">{t.name} · {roster.length}/{t.max_players}</h2><ol className="mt-3 list-inside list-decimal space-y-1">{roster.map(a=><li key={a.id}>{names.get(a.player_id) || "Memuat pemain…"}</li>)}</ol>{!roster.length && <p className="mt-3 text-sm text-slate-400">Belum ada pemain</p>}</section>;})}</div></>}
    <form onSubmit={create} className="space-y-4 rounded-3xl bg-white p-5"><h2 className="text-xl font-black">Buat Event</h2><label className="block">Nama event<input required maxLength={120} name="name" className="mt-1 w-full rounded-xl border p-3" /></label><label className="block">Kode undangan<input required name="code" pattern="[a-z0-9-]{3,40}" placeholder="fun-football-01" className="mt-1 w-full rounded-xl border p-3" /></label><label className="block">Mode undian<select name="mode" className="mt-1 w-full rounded-xl border p-3"><option value="balanced">Balanced — tim paling sedikit diutamakan</option><option value="pure">Pure — acak di antara tim yang tersedia</option></select></label>
      <fieldset><legend className="mb-2 font-bold">Tim dan kapasitas</legend>{draftTeams.map((team,i)=><div key={i} className="mb-2 flex items-center gap-2"><input aria-label={`Nama tim ${i+1}`} required maxLength={80} value={team.name} onChange={e=>setDraftTeams(ts=>ts.map((t,j)=>j===i?{...t,name:e.target.value}:t))} className="min-w-0 flex-1 rounded-xl border p-2" /><input aria-label={`Warna tim ${i+1}`} type="color" value={team.color} onChange={e=>setDraftTeams(ts=>ts.map((t,j)=>j===i?{...t,color:e.target.value}:t))} /><input aria-label={`Kapasitas tim ${i+1}`} required type="number" min={1} max={500} value={team.max_players} onChange={e=>setDraftTeams(ts=>ts.map((t,j)=>j===i?{...t,max_players:Number(e.target.value)}:t))} className="w-16 rounded-xl border p-2" /><button type="button" aria-label={`Hapus tim ${i+1}`} disabled={draftTeams.length<=2} onClick={()=>setDraftTeams(ts=>ts.filter((_,j)=>j!==i))}>×</button></div>)}<button type="button" disabled={draftTeams.length>=12} onClick={()=>setDraftTeams(ts=>[...ts,{name:`TEAM ${ts.length+1}`,color:"#14b8a6",max_players:6}])} className="text-sm underline">Tambah tim</button></fieldset>
      <button disabled={busy} className="w-full rounded-xl bg-orange-500 p-3 font-black text-white disabled:opacity-40">{busy?"Menyimpan…":"Simpan Draft Event"}</button>
    </form>
  </main>;
}
