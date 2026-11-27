import {revalidatePath} from "next/cache";
import {owner,json,fail,ApiError,enroll,verify,audit,secureHeaders} from "@/lib/server/owner-auth";
import {body,content} from "@/lib/server/admin-content";
import {siteConfig,notifications,customFields,analytics} from "@/lib/server/admin-config";
import {media} from "@/lib/server/admin-media";
import {resume} from "@/lib/server/admin-resume";
import {adminContact} from "@/lib/server/contact";
import {integrations} from "@/lib/server/admin-integrations";
import {db} from "@/lib/server/public-portfolio";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
async function handle(request:Request,{params}:{params:Promise<{path?:string[]}>}){
 try{
  const {path=[]}=await params,[resource,...rest]=path;
  if(resource==="session"&&!rest.length&&request.method==="GET"){
   const a=await owner(request,false);return json({authenticated:true,name:a.name,email:a.email,issuer:a.issuer,totpConfigured:a.configured,stepUp:a.elevated&&a.configured});
  }
  if(resource==="totp"&&rest.length===1){
   const a=await owner(request,false);
   if(rest[0]==="status"&&request.method==="GET")return json({configured:a.configured,stepUp:a.elevated&&a.configured});
   if(rest[0]==="enroll"&&request.method==="POST"){const v=await enroll(a);await audit(a,"TOTP_ENROLLMENT_STARTED","admin-totp");return json(v)}
   if(["confirm","verify"].includes(rest[0])&&request.method==="POST"){const r=await verify(a,(await body(request)).code,rest[0]==="confirm");await audit(a,rest[0]==="confirm"?"TOTP_ENROLLED":"TOTP_STEP_UP","admin-session");return r}
   throw new ApiError(404,"Unknown authenticator operation");
  }
  const a=await owner(request);let result:unknown;
  switch(resource){
   case "content":result=await content(request,rest,a);break;
   case "site-configuration":result=await siteConfig(request,rest,a);break;
   case "notifications":result=await notifications(request,rest,a);break;
   case "custom-fields":result=await customFields(request,rest,a);break;
   case "media":result=await media(request,rest,a);break;
   case "resumes":result=await resume(request,rest,a);break;
   case "contact":result=await adminContact(request,rest,a);break;
   case "linkedin":case "agent-tokens":case "agent-proposals":result=await integrations(request,resource,rest,a);break;
   case "analytics":if(rest.length||request.method!=="GET")throw new ApiError(404,"Not found");result=await analytics();break;
   case "audit":if(rest.length||request.method!=="GET")throw new ApiError(404,"Not found");result=await db()`SELECT actor_issuer,actor_subject,action,resource,resource_id,occurred_at FROM admin_audit_log ORDER BY occurred_at DESC LIMIT 100`;break;
   default:throw new ApiError(404,"Unknown operation");
  }
  if(!["GET","HEAD"].includes(request.method)&&["content","site-configuration","notifications","media"].includes(resource)&&!(resource==="media"&&rest[0]==="uploads"&&rest[2]!=="complete"))revalidatePath("/","layout");
  if(result instanceof Response)return result;
  return result===null?new Response(null,{status:204,headers:secureHeaders}):json(result);
 }catch(e){return fail(e)}
}
export const GET=handle,POST=handle,PUT=handle,DELETE=handle;
