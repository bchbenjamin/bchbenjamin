import {db,readPublicResource} from "@/lib/server/public-portfolio";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","X-Portfolio-Backend":"nextjs"};
export async function GET(_request:Request,{params}:{params:Promise<{path?:string[]}>}){
 try{
  const {path=[]}=await params;
  const value=await readPublicResource(path);
  return value===null?Response.json({error:"not_found"},{status:404,headers}):Response.json(value,{headers});
 }catch{return Response.json({error:"public_data_unavailable"},{status:503,headers});}
}
export async function POST(request:Request,{params}:{params:Promise<{path?:string[]}>}){
 const {path=[]}=await params;
 if(path.join("/")!=="analytics")return Response.json({error:"not_found"},{status:404,headers});
 if(request.headers.get("DNT")==="1"||request.headers.get("Sec-GPC")==="1")return new Response(null,{status:204,headers});
 const origin=request.headers.get("origin");
 if(request.headers.get("sec-fetch-site")==="cross-site"||!origin||!["https://www.bchbenjamin.in","https://bchbenjamin.in","https://bchbenjamin.vercel.app"].includes(origin))return new Response(null,{status:403,headers});
 // Bound incoming data and do not persist visitor IDs or IP addresses.
 if(Number(request.headers.get("content-length")||0)>4096)return new Response(null,{status:413,headers});
 try{
  if(!request.headers.get("content-type")?.startsWith("application/json"))return new Response(null,{status:415,headers});
  const reader=request.body?.getReader();if(!reader)return new Response(null,{status:400,headers});
  let size=0;const chunks:Uint8Array[]=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();return new Response(null,{status:413,headers});}chunks.push(value);}}
  finally{reader.releaseLock();}
  const data=JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if(!data||typeof data!=="object"||Array.isArray(data))return new Response(null,{status:400,headers});
  if(data.event!=="visit")return new Response(null,{status:204,headers});
  const clean=(k:string,max:number)=>typeof data[k]==="string"&&new RegExp("^[\\p{L}\\p{N} ._+\\-]{1,"+max+"}$","u").test(data[k])?data[k]:"Unknown";
  const country=/^[A-Z]{2}$/.test(request.headers.get("x-vercel-ip-country")||"")?request.headers.get("x-vercel-ip-country"):"ZZ";
  await db()`INSERT INTO portfolio_analytics(day,country,model,os,browser,source,medium,campaign,visits) VALUES ((now() AT TIME ZONE 'UTC')::date,${country},${clean("model",80)},${clean("os",30)},${clean("browser",30)},${clean("source",80)},${clean("medium",80)},${clean("campaign",80)},1) ON CONFLICT(day,country,model,os,browser,source,medium,campaign) DO UPDATE SET visits=portfolio_analytics.visits+1`;
  return new Response(null,{status:204,headers});
 }catch{return Response.json({error:"analytics_unavailable"},{status:503,headers});}
}
