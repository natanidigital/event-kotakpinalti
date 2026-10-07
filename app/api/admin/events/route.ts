import {NextRequest,NextResponse} from "next/server";
import {serverClient} from "@/lib/supabase/server";
import {sameOrigin,failure} from "@/lib/player-api";
export async function POST(request:NextRequest) {
  if(!sameOrigin(request))return NextResponse.json({error:"Origin tidak valid."},{status:403});
  const db=await serverClient(),{data:{user}}=await db.auth.getUser();
  if(!user)return NextResponse.json({error:"Login diperlukan."},{status:401});
  const body=await request.json().catch(()=>null);
  if(typeof body?.name!=="string" || !body.name.trim() || body.name.length>120 ||
     typeof body.code!=="string" || !/^[a-z0-9-]{3,40}$/.test(body.code) ||
     !["balanced","pure"].includes(body.mode) || !Array.isArray(body.teams) || body.teams.length<2 || body.teams.length>12 ||
     body.teams.some((t:{name?:unknown;color?:unknown;max_players?:unknown})=>typeof t.name!=="string" || !t.name.trim() || t.name.length>80 || typeof t.color!=="string" || !/^#[0-9a-f]{6}$/i.test(t.color) || !Number.isInteger(t.max_players) || Number(t.max_players)<1 || Number(t.max_players)>500))
    return NextResponse.json({error:"Periksa nama, kode, dan konfigurasi tim."},{status:400});
  const {data,error}=await db.rpc("create_event_with_teams",{p_name:body.name,p_code:body.code,p_mode:body.mode,p_teams:body.teams});
  if(error) return error.code==="23505"?NextResponse.json({error:"Kode event atau nama tim sudah dipakai."},{status:409}):failure(error.message);
  return NextResponse.json({id:data},{status:201});
}
export async function PATCH(request:NextRequest) {
  if(!sameOrigin(request))return NextResponse.json({error:"Origin tidak valid."},{status:403});
  const db=await serverClient(),{data:{user}}=await db.auth.getUser();
  if(!user)return NextResponse.json({error:"Login diperlukan."},{status:401});
  const body=await request.json().catch(()=>null);
  if(typeof body?.id!=="string" || !["open","closed"].includes(body.status))return NextResponse.json({error:"Status tidak valid."},{status:400});
  const {data,error}=await db.from("events").update({status:body.status}).eq("id",body.id).eq("created_by",user.id).select("id").maybeSingle();
  if(error)return failure(error.message);
  if(!data)return NextResponse.json({error:"Event tidak ditemukan."},{status:404});
  return NextResponse.json({ok:true});
}
