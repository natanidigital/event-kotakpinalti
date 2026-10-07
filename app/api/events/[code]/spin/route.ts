import { NextRequest,NextResponse } from "next/server";
import { publicClient,sessionToken,validCode,failure,sameOrigin } from "@/lib/player-api";
export async function POST(request:NextRequest,context:{params:Promise<{code:string}>}) {
  const params=await context.params;
  if(!sameOrigin(request)) return NextResponse.json({error:"Origin tidak valid."},{status:403});
  if(!validCode(params.code)) return NextResponse.json({error:"Kode tidak valid."},{status:400});
  const token=sessionToken(request,params.code);
  if(!token) return NextResponse.json({error:"Daftarkan nama Anda terlebih dahulu."},{status:401});
  const {data,error}=await publicClient().rpc("spin_event_player",{p_code:params.code,p_token:token});
  if(error) return failure(error.message);
  return NextResponse.json({result:data[0]});
}
