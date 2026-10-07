import { NextRequest,NextResponse } from "next/server";
import { publicClient,sessionToken,validCode,failure,sameOrigin,newToken,saveToken } from "@/lib/player-api";
export async function POST(request:NextRequest,context:{params:Promise<{code:string}>}) {
  const params=await context.params;
  if(!sameOrigin(request)) return NextResponse.json({error:"Origin tidak valid."},{status:403});
  if(!validCode(params.code)) return NextResponse.json({error:"Kode tidak valid."},{status:400});
  const body=await request.json().catch(()=>null);
  if(typeof body?.name !== "string" || !body.name.trim() || body.name.trim().length>80)
    return NextResponse.json({error:"Nama wajib diisi, maksimal 80 karakter."},{status:400});
  const token=sessionToken(request,params.code) || newToken();
  const {data,error}=await publicClient().rpc("register_event_player",{p_code:params.code,p_name:body.name.trim(),p_token:token});
  if(error) return failure(error.message);
  const response=NextResponse.json({id:data}); saveToken(response,params.code,token); return response;
}
