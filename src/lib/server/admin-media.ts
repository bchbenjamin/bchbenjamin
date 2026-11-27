import {db} from "./public-portfolio";
import {ApiError,audit,type Owner,secureHeaders} from "./owner-auth";
import {body,uuid} from "./admin-content";
const types=new Set(["image/jpeg","image/png","image/webp","image/gif","application/pdf","video/mp4","video/webm"]);
const tables:Record<string,string>={project:"projects",achievement:"achievements",experience:"experience",education:"education",profile:"profile"};
const cols="id,original_filename,content_type,byte_size,alt_text,caption,visibility,storage_path,follow_record,uploaded_by,uploaded_at,updated_at";
const limit=12*1024*1024,partSize=2*1024*1024;
const trim=(v:unknown,n:number)=>typeof v==="string"?v.slice(0,n):"";
export function validSignature(type:string,b:Buffer){
 if(b.length<5)return false;
 switch(type){
 case "image/jpeg":return b.subarray(0,3).equals(Buffer.from([255,216,255]));
 case "image/png":return b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 case "image/webp":return b.toString("ascii",0,4)==="RIFF"&&b.toString("ascii",8,12)==="WEBP";
 case "image/gif":return ["GIF87a","GIF89a"].includes(b.toString("ascii",0,6));
 case "application/pdf":return b.toString("ascii",0,5)==="%PDF-";
 case "video/mp4":return b.toString("ascii",4,8)==="ftyp";
 case "video/webm":return b.subarray(0,4).equals(Buffer.from([26,69,223,163]));
 default:return false;
 }
}
export function normalizePath(v:unknown){
 if(v==null||v==="")return "";
 if(typeof v!=="string")throw new ApiError(400,"Invalid folder");
 const p=v.trim().replace(/\\/g,"/");if(!p)return "";
 const parts=p.split("/");
 if(p.length>500||parts.length>12||parts.some(x=>!x.trim()||x==="."||x===".."||x.length>100||/[\x00-\x1f\x7f:<>|?*]/.test(x)))throw new ApiError(400,"Invalid folder path");return p;
}
async function metadata(b:Record<string,unknown>){
 const filename=trim(b.filename,255).replace(/[^A-Za-z0-9._ -]/g,"_")||"upload",type=String(b.type||"").toLowerCase(),size=Number(b.size);
 const rt=String(b.resourceType||""),rid=b.resourceId??null,follow=b.followRecord===true;
 if(!types.has(type)||!Number.isInteger(size)||size<5||size>limit)throw new ApiError(400,"Invalid file type or size");
 if(rt||rid||follow){
  if(!Object.hasOwn(tables,rt)||!uuid(rid))throw new ApiError(400,"Invalid media relationship");
  if(!(await db().query("SELECT id FROM "+tables[rt]+" WHERE id=$1::uuid",[rid])).length)throw new ApiError(404,"Target record not found");
 }
 return {filename,type,size,altText:trim(b.altText,300),caption:trim(b.caption,16000),visibility:follow||b.visibility==="PUBLIC"?"PUBLIC":"PRIVATE",storagePath:normalizePath(b.storagePath),followRecord:follow,resourceType:rt,resourceId:rid as string|null};
}
async function get(id:string){const [r]=await db().query("SELECT "+cols+" FROM media_assets WHERE id=$1::uuid",[id]);if(!r)throw new ApiError(404,"Media not found");return r}
function camel(r:Record<string,unknown>){return Object.fromEntries(Object.entries(r).map(([k,v])=>[k.replace(/_([a-z])/g,(_,x:string)=>x.toUpperCase()),v]))}
export async function media(request:Request,path:string[],a:Owner){
 const sql=db(),[id,action,part]=path;
 if(id==="uploads"){
  if(path.length===1&&request.method==="POST"){
   const m=await metadata(await body(request));
   const [r]=await sql`INSERT INTO native_media_uploads(issuer,subject,metadata,byte_size) SELECT ${a.issuer},${a.subject},${JSON.stringify(m)}::jsonb,${m.size} WHERE (SELECT count(*) FROM native_media_uploads WHERE issuer=${a.issuer} AND subject=${a.subject} AND expires_at>now() AND NOT completed)<20 RETURNING id`;
   if(!r)throw new ApiError(429,"Too many pending uploads");return r;
  }
  if(!uuid(action))throw new ApiError(404,"Upload not found");
  const [u]=await sql`SELECT metadata,byte_size,completed FROM native_media_uploads WHERE id=${action}::uuid AND issuer=${a.issuer} AND subject=${a.subject} AND expires_at>now()`;
  if(!u)throw new ApiError(404,"Upload not found");
  if(part==="complete"&&request.method==="POST"){
   if(u.completed)return camel(await get(action));
   const [first]=await sql`SELECT encode(substring(bytes FROM 1 FOR 16),'hex') AS prefix FROM native_media_parts WHERE upload_id=${action}::uuid AND part=0`;
   const m=u.metadata as Awaited<ReturnType<typeof metadata>>;
   if(!first||!validSignature(m.type,Buffer.from(first.prefix,"hex")))throw new ApiError(415,"File signature does not match declared type");
   const [r]=await sql`WITH assembled AS (SELECT string_agg(bytes,''::bytea ORDER BY part) AS data,count(*) AS parts,sum(octet_length(bytes)) AS size FROM native_media_parts WHERE upload_id=${action}::uuid), claim AS (UPDATE native_media_uploads SET completed=true WHERE id=${action}::uuid AND NOT completed AND expires_at>now() AND (SELECT parts FROM assembled)=ceil(byte_size/2097152.0) AND (SELECT size FROM assembled)=byte_size RETURNING id), inserted AS (INSERT INTO media_assets(id,original_filename,content_type,byte_size,alt_text,caption,visibility,file_bytes,uploaded_by,storage_path,follow_record) SELECT claim.id,${m.filename},${m.type},${m.size},${m.altText},${m.caption},${m.visibility},assembled.data,${a.subject},${m.storagePath},${m.followRecord} FROM claim,assembled RETURNING id), linked AS (INSERT INTO media_relationships(media_id,resource_type,resource_id,purpose,sort_order) SELECT id,${m.resourceType},${m.resourceId}::uuid,'gallery',0 FROM inserted WHERE ${m.resourceId}::uuid IS NOT NULL RETURNING id) SELECT id FROM inserted`;
   if(!r)throw new ApiError(409,"Upload incomplete");
   await sql`DELETE FROM native_media_parts WHERE upload_id=${action}::uuid`;await audit(a,"UPLOAD","media",action);return camel(await get(action));
  }
  if(path.length===3&&request.method==="PUT"&&/^[0-5]$/.test(part||"")&&!u.completed){
   const n=Number(part),expected=Math.min(partSize,Number(u.byte_size)-n*partSize);
   if(expected<=0||Number(request.headers.get("content-length")||0)>partSize)throw new ApiError(400,"Invalid part");
   const bytes=Buffer.from(await request.arrayBuffer());if(bytes.length!==expected)throw new ApiError(400,"Incorrect part size");
   const [r]=await sql`INSERT INTO native_media_parts(upload_id,part,bytes) SELECT id,${n},decode(${bytes.toString("hex")},'hex') FROM native_media_uploads WHERE id=${action}::uuid AND NOT completed AND expires_at>now() ON CONFLICT(upload_id,part) DO NOTHING RETURNING part`;
   // Identical retries are harmless; a different payload cannot overwrite a staged part.
   if(!r){const [prior]=await sql`SELECT encode(bytes,'hex')=${bytes.toString("hex")} AS identical FROM native_media_parts WHERE upload_id=${action}::uuid AND part=${n}`;if(!prior?.identical)throw new ApiError(409,"Part already exists")}
   return {part:n};
  }
  throw new ApiError(405,"Invalid upload operation");
 }
 if(!id&&request.method==="GET")return sql.query("SELECT "+cols+" FROM media_assets ORDER BY uploaded_at DESC LIMIT 250");
 if(!id&&request.method==="POST")throw new ApiError(400,"Use the chunked media upload endpoint");
 if(!uuid(id))throw new ApiError(404,"Media not found");
 if(!action&&request.method==="GET")return camel(await get(id));
 if(action==="file"&&request.method==="GET"){
  const [r]=await sql`SELECT content_type,original_filename,encode(file_bytes,'base64') AS data FROM media_assets WHERE id=${id}::uuid`;if(!r)throw new ApiError(404,"Media not found");
  const bytes=Buffer.from(r.data,"base64");let offset=0;
  return new Response(new ReadableStream<Uint8Array>({pull(c){if(offset>=bytes.length){c.close();return}const end=Math.min(offset+65536,bytes.length);c.enqueue(new Uint8Array(bytes.subarray(offset,end)));offset=end}}),{headers:{...secureHeaders,"Content-Type":r.content_type,"Content-Disposition":"inline; filename=\""+String(r.original_filename).replace(/[^a-zA-Z0-9._ -]/g,"_")+"\""}});
 }
 if(action==="link"&&request.method==="POST"){
  const b=await body(request),rt=String(b.resourceType||""),rid=b.resourceId,purpose=trim(b.purpose??"gallery",40),sort=Number(b.sortOrder??0);
  if(!Object.hasOwn(tables,rt)||!uuid(rid)||!purpose||!Number.isInteger(sort))throw new ApiError(400,"Invalid media relationship");
  if(!(await sql.query("SELECT id FROM "+tables[rt]+" WHERE id=$1::uuid",[rid])).length)throw new ApiError(404,"Record not found");
  await sql`INSERT INTO media_relationships(media_id,resource_type,resource_id,purpose,sort_order) VALUES (${id}::uuid,${rt},${rid}::uuid,${purpose},${sort}) ON CONFLICT(media_id,resource_type,resource_id,purpose) DO UPDATE SET sort_order=EXCLUDED.sort_order`;
  await audit(a,"LINK","media",id);return {linked:true,mediaId:id,resourceType:rt,resourceId:rid};
 }
 if(action==="link"&&request.method==="DELETE"){
  const p=new URL(request.url).searchParams,rt=p.get("resourceType")||"",rid=p.get("resourceId");
  if(!Object.hasOwn(tables,rt)||!uuid(rid))throw new ApiError(400,"Invalid media relationship");
  await sql`DELETE FROM media_relationships WHERE media_id=${id}::uuid AND resource_type=${rt} AND resource_id=${rid}::uuid AND purpose=${p.get("purpose")||"gallery"}`;await audit(a,"UNLINK","media",id);return null;
 }
 if(!action&&request.method==="PUT"){
  const b=await body(request),p=Object.hasOwn(b,"storagePath")?normalizePath(b.storagePath):null,follow=typeof b.followRecord==="boolean"?b.followRecord:null;
  const [r]=await sql`UPDATE media_assets SET alt_text=${trim(b.altText,300)},caption=${trim(b.caption,16000)},visibility=${b.visibility==="PUBLIC"?"PUBLIC":"PRIVATE"},storage_path=COALESCE(${p},storage_path),follow_record=COALESCE(${follow}::boolean,follow_record),updated_at=now() WHERE id=${id}::uuid RETURNING id`;if(!r)throw new ApiError(404,"Media not found");await audit(a,"UPDATE","media",id);return camel(await get(id));
 }
 if(!action&&request.method==="DELETE"){const [r]=await sql`DELETE FROM media_assets WHERE id=${id}::uuid RETURNING id`;if(!r)throw new ApiError(404,"Media not found");await audit(a,"DELETE","media",id);return null}
 throw new ApiError(405,"Unsupported media operation");
}
