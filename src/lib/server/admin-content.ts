import {db} from "./public-portfolio";
import {resources} from "./admin-resources";
import {ApiError,type Owner,audit} from "./owner-auth";
export const uuid=(s:unknown):s is string=>typeof s==="string"&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(s);
export async function body(request:Request):Promise<Record<string,unknown>>{
 if(Number(request.headers.get("content-length")||0)>262144)throw new ApiError(413,"Request too large");
 const s=await request.text();if(s.length>262144)throw new ApiError(413,"Request too large");
 let v;try{v=JSON.parse(s)}catch{throw new ApiError(400,"Invalid JSON")}
 if(!v||typeof v!=="object"||Array.isArray(v))throw new ApiError(400,"JSON object required");return v;
}
export function sanitize(resource:string,input:Record<string,unknown>,creating:boolean){
 const spec=Object.hasOwn(resources,resource)?resources[resource]:null;if(!spec)throw new ApiError(404,"Unknown resource");
 if(creating&&spec.required.some(k=>input[k]==null||String(input[k]).trim()===""))throw new ApiError(400,"Required fields missing");
 if(creating&&resource==="projects"){input={...input,shortDescription:input.shortDescription??input.summary,resumeDescription:input.resumeDescription??input.summary};}
 const values=Object.entries(input).filter(([k])=>Object.hasOwn(spec.fields,k)).map(([k,v])=>{
  const c=spec.fields[k];let val=v;
  if(c.endsWith("_fields")){if(!v||typeof v!=="object"||Array.isArray(v))throw new ApiError(400,"Invalid field metadata");if(c==="public_fields"&&Object.values(v).some(x=>typeof x!=="boolean"))throw new ApiError(400,"Invalid visibility flags");val=JSON.stringify(v)}
  else if(c.endsWith("_id")){if(v!==null&&!uuid(v))throw new ApiError(400,"Invalid identifier")}
  else if(c.endsWith("_on")){if(v==="")val=null;else if(v!==null&&(typeof v!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(v)))throw new ApiError(400,"Invalid date")}
  else if(["published","featured","is_current","resume_included"].includes(c)){if(typeof v!=="boolean")throw new ApiError(400,"Invalid boolean")}
  else if(c==="sort_order"){if(!Number.isInteger(v)||Math.abs(Number(v))>1000000)throw new ApiError(400,"Invalid order")}
  else if(v!==null&&typeof v!=="string"&&typeof v!=="number")throw new ApiError(400,"Invalid field");
  return {column:c,value:val,cast:c.endsWith("_fields")?"::jsonb":""};
 });
 if(!values.length)throw new ApiError(400,"No supported fields");return {spec,values};
}
export async function content(request:Request,path:string[],a:Owner){
 const [resource,id]=path;const spec=Object.hasOwn(resources,resource)?resources[resource]:null;
 if(!spec||path.length>2||id&&!uuid(id))throw new ApiError(404,"Unknown resource");
 const sql=db();
 if(request.method==="GET"){const r=await sql.query("SELECT * FROM "+spec.table+(id?" WHERE id=$1::uuid":" ORDER BY "+spec.order+" LIMIT 500"),id?[id]:[]);if(id&&!r.length)throw new ApiError(404,"Content not found");return id?r[0]:r}
 if(request.method==="DELETE"&&id){const [r]=await sql.query("DELETE FROM "+spec.table+" WHERE id=$1::uuid RETURNING id",[id]);if(!r)throw new ApiError(404,"Content not found");await audit(a,"DELETE",resource,id);return null}
 if((request.method==="POST"&&!id)||(request.method==="PUT"&&id)){
  const {values}=sanitize(resource,await body(request),!id);
  const args=values.map(v=>v.value);
  const params=values.map((v,i)=>"$"+(i+1)+v.cast);
  const q=id?"UPDATE "+spec.table+" SET "+values.map((v,i)=>v.column+"="+params[i]).join(",")+",updated_at=now() WHERE id=$"+(args.length+1)+"::uuid RETURNING *":"INSERT INTO "+spec.table+"("+values.map(v=>v.column).join(",")+") VALUES ("+params.join(",")+") RETURNING *";
  const [r]=await sql.query(q,id?[...args,id]:args);if(!r)throw new ApiError(404,"Content not found");await audit(a,id?"UPDATE":"CREATE",resource,r.id);return r;
 }
 throw new ApiError(405,"Method not allowed");
}
