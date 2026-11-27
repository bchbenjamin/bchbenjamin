import {db} from "./public-portfolio";
import {ApiError,audit,type Owner} from "./owner-auth";
import {body,uuid} from "./admin-content";
import {normalizeLauncherHomeLayout} from "../launcher-layout";
import {validNotificationTarget} from "../notifications";

type Row=Record<string,unknown>;
const text=(v:unknown,max:number)=>{if(typeof v!=="string"||!v.trim()||v.length>max)throw new ApiError(400,"Invalid text field");return v.trim()};
const int=(v:unknown,min:number,max:number)=>{if(typeof v!=="number"||!Number.isInteger(v)||v<min||v>max)throw new ApiError(400,"Invalid number");return v};
async function config(){const [r]=await db()`SELECT draft_config AS "draftConfig",published_config AS "publishedConfig",updated_at AS "updatedAt",published_at AS "publishedAt" FROM site_configuration WHERE id=1`;return r??{}}
export async function siteConfig(request:Request,path:string[],a:Owner){
 const sql=db();
 if(!path.length&&request.method==="GET")return config();
 if(!path.length&&request.method==="PUT"){
  const b=await body(request),j=JSON.stringify(b);
  await sql`UPDATE site_configuration SET draft_config=jsonb_set(${j}::jsonb,'{launcher}',(CASE WHEN jsonb_typeof(${j}::jsonb->'launcher')='object' THEN ${j}::jsonb->'launcher' ELSE '{}'::jsonb END)||jsonb_build_object('homeLayout',COALESCE(draft_config#>'{launcher,homeLayout}',published_config#>'{launcher,homeLayout}','{"icons":{},"widgets":{}}'::jsonb)),true),updated_at=now() WHERE id=1`;
  await audit(a,"UPDATE","site-configuration");return config();
 }
 if(path.join("/")==="launcher-layout"&&request.method==="PUT"){
  const b=await body(request);
  if(!b.icons||!b.widgets||typeof b.icons!=="object"||typeof b.widgets!=="object"||Array.isArray(b.icons)||Array.isArray(b.widgets))throw new ApiError(400,"Invalid launcher layout");
  const layout=normalizeLauncherHomeLayout(b);
  if(Object.keys(layout.icons).length!==Object.keys(b.icons).length||Object.keys(layout.widgets).length!==Object.keys(b.widgets).length)throw new ApiError(400,"Invalid launcher positions");
  const j=JSON.stringify(layout);
  await sql`UPDATE site_configuration SET draft_config=jsonb_set(draft_config,'{launcher}',COALESCE(draft_config->'launcher','{}'::jsonb)||jsonb_build_object('homeLayout',${j}::jsonb),true),published_config=jsonb_set(published_config,'{launcher}',COALESCE(published_config->'launcher','{}'::jsonb)||jsonb_build_object('homeLayout',${j}::jsonb),true),updated_at=now() WHERE id=1`;
  await audit(a,"SYNC","launcher-layout");return layout;
 }
 if(path.join("/")==="publish"&&request.method==="POST"){
  await sql`UPDATE site_configuration SET published_config=draft_config,published_at=now(),updated_at=now() WHERE id=1`;await audit(a,"PUBLISH","site-configuration");return config();
 }
 throw new ApiError(404,"Unknown configuration operation");
}
export async function notifications(request:Request,path:string[],a:Owner){
 const sql=db();
 if(!path.length&&request.method==="GET")return sql`SELECT * FROM portfolio_notifications ORDER BY published_at DESC LIMIT 200`;
 if(!path.length&&request.method==="POST"){
  const b=await body(request),title=text(b.title,160),message=text(b.body,1000),target=text(b.target,1000),days=int(b.days??7,1,7);
  if(!validNotificationTarget(target))throw new ApiError(400,"Invalid notification target");
  const [r]=await sql`INSERT INTO portfolio_notifications(title,body,target,expires_at) VALUES (${title},${message},${target},now()+(${days}*interval '1 day')) RETURNING id`;
  await audit(a,"PUBLISH","notification",r.id);return r;
 }
 if(path.length===1&&uuid(path[0])&&request.method==="DELETE"){const [r]=await sql`UPDATE portfolio_notifications SET revoked=true WHERE id=${path[0]}::uuid RETURNING id`;if(!r)throw new ApiError(404,"Notification not found");await audit(a,"REVOKE","notification",r.id);return null}
 throw new ApiError(404,"Unknown notification operation");
}
const types=new Set(["text","long-text","url","date","number","boolean","select","multi-select","rich-text","media"]);
const resources=new Set(["profile","project","experience","education","skill-group","skill","achievement"]);
export async function customFields(request:Request,path:string[],a:Owner){
 const sql=db();
 if(!path.length&&request.method==="GET"){const resource=new URL(request.url).searchParams.get("resourceType")||"";if(!resources.has(resource))throw new ApiError(400,"Unknown resource");return sql`SELECT id,resource_type,field_key,label,field_type,options::text AS options,public_by_default,sort_order,created_at FROM custom_field_definitions WHERE resource_type=${resource} ORDER BY sort_order,label`}
 if(!path.length&&request.method==="POST"){
  const b=await body(request),resource=text(b.resourceType,40),key=text(b.fieldKey,80),label=text(b.label,120),type=text(b.fieldType,24),options=b.options??[],sort=int(b.sortOrder??0,-1000000,1000000);
  if(!resources.has(resource)||!types.has(type)||!/^[a-zA-Z][a-zA-Z0-9_]{1,79}$/.test(key)||!Array.isArray(options)||options.some(x=>typeof x!=="string"))throw new ApiError(400,"Invalid custom field");
  const [r]=await sql`INSERT INTO custom_field_definitions(resource_type,field_key,label,field_type,options,public_by_default,sort_order) VALUES (${resource},${key},${label},${type},${JSON.stringify(options)}::jsonb,${b.publicByDefault===true},${sort}) RETURNING id,resource_type,field_key,label,field_type,options::text AS options,public_by_default,sort_order,created_at`;
  await audit(a,"CREATE","custom-field",r.id);return r;
 }
 if(path.length===1&&uuid(path[0])&&request.method==="DELETE"){const [r]=await sql`DELETE FROM custom_field_definitions WHERE id=${path[0]}::uuid RETURNING id`;if(!r)throw new ApiError(404,"Field not found");await audit(a,"DELETE","custom-field",r.id);return null}
 throw new ApiError(404,"Unknown field operation");
}
export async function analytics(){
 const sql=db();const [visits,daily,countries,devices,sources]=await sql.transaction([
 sql`SELECT coalesce(sum(visits),0)::int AS visits FROM portfolio_analytics WHERE day>=current_date-6`,
 sql`SELECT day,sum(visits)::int AS visits FROM portfolio_analytics WHERE day>=current_date-6 GROUP BY day ORDER BY day`,
 sql`SELECT country,sum(visits)::int AS visits FROM portfolio_analytics WHERE day>=current_date-6 GROUP BY country ORDER BY visits DESC LIMIT 30`,
 sql`SELECT model,os,browser,sum(visits)::int AS visits FROM portfolio_analytics WHERE day>=current_date-6 GROUP BY model,os,browser ORDER BY visits DESC LIMIT 50`,
 sql`SELECT source,medium,campaign,sum(visits)::int AS visits FROM portfolio_analytics WHERE day>=current_date-6 GROUP BY source,medium,campaign ORDER BY visits DESC LIMIT 50`]);
 return {visits:(visits[0] as Row)?.visits??0,minutes:0,daily,countries,devices,sources};
}
