import {randomBytes} from "node:crypto";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store, no-transform","X-Content-Type-Options":"nosniff"};
const MAX_DOWNLOAD=2*1024*1024;
const MAX_UPLOAD=1024*1024;

export function GET(request:Request){
 const mode=new URL(request.url).searchParams.get("mode");
 if(mode==="ping")return new Response(null,{status:204,headers});
 if(mode!=="download")return new Response(null,{status:400,headers});
 // Incompressible bytes make this a real transfer measurement, not a cache/compression benchmark.
 const data=randomBytes(MAX_DOWNLOAD);
 return new Response(new Uint8Array(data),{headers:{...headers,"Content-Type":"application/octet-stream","Content-Length":String(data.length)}});
}

export async function POST(request:Request){
 const origin=request.headers.get("origin");
 if(origin && origin!==new URL(request.url).origin)return new Response(null,{status:403,headers});
 if(request.headers.get("content-type")!=="application/octet-stream")return new Response(null,{status:415,headers});
 const length=request.headers.get("content-length");
 if(length!==null&&Number(length)>MAX_UPLOAD)return new Response(null,{status:413,headers});
 if(!request.body)return new Response(null,{status:400,headers});
 const reader=request.body.getReader();
 let bytes=0;
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   bytes+=value.byteLength;
   if(bytes>MAX_UPLOAD){await reader.cancel();return new Response(null,{status:413,headers});}
  }
 }finally{reader.releaseLock();}
 return Response.json({bytes},{headers});
}
