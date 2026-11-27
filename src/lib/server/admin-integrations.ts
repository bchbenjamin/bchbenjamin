import {db} from "./public-portfolio";
import {ApiError,audit,sha256,type Owner} from "./owner-auth";
import {body,uuid} from "./admin-content";
import {randomBytes,createDecipheriv} from "node:crypto";
export async function integrations(request:Request,resource:string,path:string[],a:Owner){
 const sql=db(),[id,action,verb]=path;
 if(resource==="agent-tokens"){
  if(!id&&request.method==="GET")return sql`SELECT id,token_prefix,name,scopes,created_at,expires_at,last_used_at,revoked_at FROM agent_api_tokens ORDER BY created_at DESC`;
  if(!id&&request.method==="POST"){const b=await body(request),name=String(b.name??"").trim(),scopes=b.scopes,days=b.expiresInDays??90;
   if(!name||name.length>120||!Array.isArray(scopes)||!scopes.length||scopes.some(x=>!["portfolio:read","portfolio:propose"].includes(x))||typeof days!=="number"||!Number.isInteger(days)||days<1||days>365)throw new ApiError(400,"Invalid token specification");
   const token="bch_pat_"+randomBytes(32).toString("base64url"),prefix=token.slice(0,20);
   const [r]=await sql`INSERT INTO agent_api_tokens(token_hash,token_prefix,name,scopes,created_by,expires_at) VALUES (${sha256(token)},${prefix},${name},${[...new Set(scopes)].join(",")},${a.subject},now()+(${days}*interval '1 day')) RETURNING id,expires_at`;await audit(a,"CREATE","agent-token",r.id);return {id:r.id,token,prefix,name,scopes,expiresAt:r.expires_at};
  }
  if(uuid(id)&&request.method==="DELETE"){const [r]=await sql`UPDATE agent_api_tokens SET revoked_at=now() WHERE id=${id}::uuid AND revoked_at IS NULL RETURNING id`;if(!r)throw new ApiError(404,"Token not found");await audit(a,"REVOKE","agent-token",id);return null}
 }
 if(resource==="agent-proposals"){
  if(!id&&request.method==="GET")return sql`SELECT id,resource,operation,target_id,payload::text AS payload,status,created_by,reviewed_by,review_note,created_at,reviewed_at FROM agent_change_proposals ORDER BY created_at DESC LIMIT 200`;
  if(uuid(id)&&["approve","reject"].includes(action)&&request.method==="POST"){const b=await request.text(),note=b?JSON.parse(b).note:"";const [r]=await sql`UPDATE agent_change_proposals SET status=${action==="approve"?"APPROVED":"REJECTED"},reviewed_by=${a.subject},review_note=${String(note??"").slice(0,500)},reviewed_at=now() WHERE id=${id}::uuid AND status='PENDING_REVIEW' RETURNING id,resource,operation,target_id,payload::text AS payload,status,created_by,reviewed_by,review_note,created_at,reviewed_at`;if(!r)throw new ApiError(409,"Proposal is not pending");await audit(a,action.toUpperCase(),"agent-proposal",id);return r}
 }
 if(resource==="linkedin"){
  if(id==="connection"&&request.method==="GET"){const [r]=await sql`SELECT 1 FROM linkedin_authorized_clients WHERE principal_name=${a.subject} AND registration_id='linkedin-publisher' AND (expires_at IS NULL OR expires_at>now())`;return {connected:!!r,provider:"LinkedIn",publishingPermission:"w_member_social",configured:!!process.env.LINKEDIN_CLIENT_ID&&!!process.env.LINKEDIN_CLIENT_SECRET}}
  if(id==="drafts"&&!action&&request.method==="GET")return sql`SELECT * FROM linkedin_publish_drafts ORDER BY created_at DESC LIMIT 100`;
  if(id==="drafts"&&!action&&request.method==="POST"){const b=await body(request),content=String(b.content??"").trim();if(!content||content.length>3000)throw new ApiError(400,"Invalid draft length");const [r]=await sql`INSERT INTO linkedin_publish_drafts(content,status,created_by) VALUES (${content},'PENDING_REVIEW',${a.subject}) RETURNING *`;await audit(a,"CREATE","linkedin-draft",r.id);return r}
  if(id==="drafts"&&uuid(action)&&request.method==="POST"&&["approve","reject"].includes(verb)){const [r]=await sql`UPDATE linkedin_publish_drafts SET status=${verb==="approve"?"APPROVED":"REJECTED"},reviewed_by=${a.subject},reviewed_at=now(),updated_at=now() WHERE id=${action}::uuid AND status='PENDING_REVIEW' RETURNING *`;if(!r)throw new ApiError(409,"Draft is not pending");await audit(a,verb.toUpperCase(),"linkedin-draft",action);return r}
  if(id==="drafts"&&uuid(action)&&request.method==="POST"&&verb==="publish"){
   // The previous provider integration must already be connected. Never infer a LinkedIn author from a Google subject.
   const [client]=await sql`SELECT encode(access_token_ciphertext,'hex') AS data,encode(access_token_iv,'hex') AS iv FROM linkedin_authorized_clients WHERE principal_name=${a.subject} AND registration_id='linkedin-publisher' AND (expires_at IS NULL OR expires_at>now())`;
   const version=process.env.LINKEDIN_API_VERSION,key=Buffer.from(process.env.TOKEN_ENCRYPTION_KEY||"","base64");
   if(!client||!version||!/^\d{6}$/.test(version)||key.length!==32)throw new ApiError(409,"Connect LinkedIn publishing and configure its API version first");
   const data=Buffer.from(client.data,"hex"),dec=createDecipheriv("aes-256-gcm",key,Buffer.from(client.iv,"hex"));dec.setAuthTag(data.subarray(-16));const token=Buffer.concat([dec.update(data.subarray(0,-16)),dec.final()]).toString("utf8");
   const info=await fetch("https://api.linkedin.com/v2/userinfo",{headers:{Authorization:"Bearer "+token},signal:AbortSignal.timeout(8000)});if(!info.ok)throw new ApiError(409,"LinkedIn identity unavailable");const user=await info.json();if(typeof user.sub!=="string"||!user.sub)throw new ApiError(409,"LinkedIn identity unavailable");
   const [draft]=await sql`UPDATE linkedin_publish_drafts SET status='PUBLISHING',updated_at=now() WHERE id=${action}::uuid AND status='APPROVED' RETURNING content`;if(!draft)throw new ApiError(409,"Draft must be approved");
   try{const r=await fetch("https://api.linkedin.com/rest/posts",{method:"POST",headers:{Authorization:"Bearer "+token,"LinkedIn-Version":version,"X-Restli-Protocol-Version":"2.0.0","Content-Type":"application/json"},body:JSON.stringify({author:"urn:li:person:"+user.sub,commentary:draft.content,visibility:"PUBLIC",distribution:{feedDistribution:"MAIN_FEED",targetEntities:[],thirdPartyDistributionChannels:[]},lifecycleState:"PUBLISHED",isReshareDisabledByAuthor:false}),signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error();await sql`UPDATE linkedin_publish_drafts SET status='PUBLISHED',linkedin_post_id=${r.headers.get("x-restli-id")},published_at=now(),updated_at=now() WHERE id=${action}::uuid AND status='PUBLISHING'`}
   catch{await sql`UPDATE linkedin_publish_drafts SET status='PUBLISH_FAILED',failure_code='LINKEDIN_API_ERROR',updated_at=now() WHERE id=${action}::uuid AND status='PUBLISHING'`}
   await audit(a,"PUBLISH","linkedin-draft",action);const [r]=await sql`SELECT * FROM linkedin_publish_drafts WHERE id=${action}::uuid`;return r;
  }
 }
 throw new ApiError(404,"Unknown operation");
}
