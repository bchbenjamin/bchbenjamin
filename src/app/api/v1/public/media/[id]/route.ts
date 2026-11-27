import {db} from "@/lib/server/public-portfolio";
import {mediaRange} from "@/lib/server/media-range";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const basic={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","X-Portfolio-Backend":"nextjs"};
async function serve(request:Request,id:string,head:boolean){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return new Response(null,{status:404,headers:basic});
 try{
  const sql=db();
  const [m]=await sql`SELECT content_type,byte_size,updated_at::text AS revision FROM public_media_assets WHERE id=${id}::uuid AND (content_type LIKE 'image/%' OR content_type LIKE 'video/%' OR content_type='application/pdf')`;
  if(!m)return new Response(null,{status:404,headers:basic});
  const size=Number(m.byte_size);
  if(size>12*1024*1024||!Number.isSafeInteger(size)||size<=0)return new Response(null,{status:503,headers:basic});
  const etag='"'+id+'-'+encodeURIComponent(m.revision)+'"';
  const headers={...basic,"Cache-Control":"public, no-cache, must-revalidate","Content-Type":String(m.content_type),"Content-Disposition":"inline","Accept-Ranges":"bytes",ETag:etag};
  if(request.headers.get("if-none-match")===etag&&!request.headers.has("range"))return new Response(null,{status:304,headers});
  const range=mediaRange(request.headers.get("range"),size);
  if(!range)return new Response(null,{status:416,headers:{...headers,"Content-Range":"bytes */"+size}});
  const length=range.end-range.start+1;
  const responseHeaders:Record<string,string>={...headers};
  if(range.partial)responseHeaders["Content-Range"]="bytes "+range.start+"-"+range.end+"/"+size;
  if(head)return new Response(null,{status:range.partial?206:200,headers:{...responseHeaders,"Content-Length":String(length)}});
  const [file]=await sql`SELECT encode(substring(file_bytes FROM ${range.start+1}::int FOR ${length}::int),'base64') AS data FROM public_media_assets WHERE id=${id}::uuid AND updated_at=${m.revision}::timestamptz AND content_type=${m.content_type}`;
  if(!file)return new Response(null,{status:404,headers:basic});
  const data=Buffer.from(file.data,"base64");
  if(data.length!==length)return new Response(null,{status:503,headers:basic});
  let offset=0;
  const stream=new ReadableStream<Uint8Array>({pull(controller){if(offset>=data.length){controller.close();return;}const end=Math.min(data.length,offset+65536);controller.enqueue(new Uint8Array(data.subarray(offset,end)));offset=end;}});
  if(length<=3*1024*1024)responseHeaders["Content-Length"]=String(length);
  return new Response(stream,{status:range.partial?206:200,headers:responseHeaders});
 }catch{return new Response(null,{status:503,headers:basic});}
}
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){return serve(request,(await params).id,false);}
export async function HEAD(request:Request,{params}:{params:Promise<{id:string}>}){return serve(request,(await params).id,true);}
