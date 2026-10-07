import { NextRequest, NextResponse } from "next/server";
import { publicClient,sessionToken,validCode,failure } from "@/lib/player-api";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest,context:{params:Promise<{code:string}>}) {
  const params=await context.params;
  if (!validCode(params.code)) return NextResponse.json({error:"Kode event tidak valid."},{status:400});
  const db=publicClient(); const token=sessionToken(request,params.code);
  const [event,player] = await Promise.all([
    db.rpc("event_snapshot",{p_code:params.code}),
    token ? db.rpc("player_session",{p_code:params.code,p_token:token}) : Promise.resolve({data:null,error:null}),
  ]);
  if(event.error || player.error) return failure((event.error || player.error)!.message);
  if(!event.data) return NextResponse.json({error:"Event tidak ditemukan atau belum dibuka."},{status:404});
  return NextResponse.json({event:event.data,player:player.data},{headers:{"Cache-Control":"no-store"}});
}
