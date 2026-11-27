import {createHash,createHmac,randomBytes,timingSafeEqual,createCipheriv,createDecipheriv} from "node:crypto";
import {createRemoteJWKSet,jwtVerify} from "jose";
import {NextResponse} from "next/server";
import {db} from "./public-portfolio";

export class ApiError extends Error {constructor(public status:number,message:string){super(message)}}
export const secureHeaders={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","X-Portfolio-Backend":"nextjs","X-Frame-Options":"DENY"};
export const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:secureHeaders});
export const fail=(e:unknown)=>e instanceof ApiError?json({message:e.message},e.status):json({message:"Service unavailable"},503);
export const randomToken=()=>randomBytes(32).toString("hex");
export const sha256=(s:string)=>createHash("sha256").update(s).digest("hex");
const SESSION="__Host-PORTFOLIO_NATIVE",OAUTH="__Host-PORTFOLIO_OAUTH";
const origin=()=>process.env.FRONTEND_URL?.replace(/\/$/,"")||"https://www.bchbenjamin.in";
const issuer="https://accounts.google.com";
const jwks=createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const cookies=(r:Request,key:string)=>r.headers.get("cookie")?.split(/;\s*/).find(x=>x.startsWith(key+"="))?.slice(key.length+1)||"";
function encryptionKey(){const key=Buffer.from(process.env.TOKEN_ENCRYPTION_KEY||"","base64");if(key.length!==32)throw new ApiError(503,"Security configuration unavailable");return key;}
function same(a:string,b:string){return Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b))}
function sign(value:string){return createHmac("sha256",encryptionKey()).update("portfolio-oauth-v1:"+value).digest("hex")}
export function isAllowed(iss:string,sub:string,email:string,verified:boolean,configured=process.env.ADMIN_ALLOWED_SUBJECTS||""){
 const entries=configured.split(",").map(x=>x.trim());
 return entries.includes(iss.replace(/\/$/,"")+"|"+sub)||(verified&&entries.includes(iss.replace(/\/$/,"")+"|"+email.trim().toLowerCase()));
}
export type Owner={token_hash:string;issuer:string;subject:string;name:string;email:string;csrf_token:string;elevated:boolean;configured:boolean};
export async function owner(request:Request,elevated=true):Promise<Owner>{
 const token=cookies(request,SESSION);
 if(!/^[a-f0-9]{64}$/.test(token))throw new ApiError(401,"Sign in required");
 const [row]=await db()`SELECT s.token_hash,s.issuer,s.subject,s.name,s.email,s.csrf_token,COALESCE(s.elevated_until>now(),false) AS elevated, EXISTS(SELECT 1 FROM admin_totp_credentials t WHERE t.issuer=s.issuer AND t.subject=s.subject AND t.enabled) AS configured FROM native_owner_sessions s WHERE token_hash=${sha256(token)} AND expires_at>now()`;
 if(!row||!isAllowed(row.issuer,row.subject,row.email,true))throw new ApiError(401,"Sign in required");
 if(elevated&&(!row.elevated||!row.configured))throw new ApiError(403,"Authenticator verification required");
 if(!["GET","HEAD","OPTIONS"].includes(request.method)){
  if(request.headers.get("origin")!==origin()||request.headers.get("sec-fetch-site")==="cross-site")throw new ApiError(403,"Invalid origin");
  const token=request.headers.get("x-xsrf-token")||"";
  if(!same(row.csrf_token,token))throw new ApiError(403,"Invalid CSRF token");
 }
 return row as Owner;
}
function setCookie(r:NextResponse,key:string,value:string,maxAge:number){r.cookies.set(key,value,{secure:true,httpOnly:true,sameSite:"lax",path:"/",maxAge});}
export async function beginOAuth(){
 if(!process.env.GOOGLE_CLIENT_ID||!process.env.GOOGLE_CLIENT_SECRET)throw new ApiError(503,"Google login unavailable");
 const state=randomToken(),nonce=randomToken(),verifier=randomBytes(48).toString("base64url");
 const payload=Buffer.from(JSON.stringify({state,nonce,verifier,expires:Date.now()+600000})).toString("base64url");
 const u=new URL("https://accounts.google.com/o/oauth2/v2/auth");
 u.search=new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,redirect_uri:origin()+"/login/oauth2/code/google",response_type:"code",scope:"openid email profile",state,nonce,code_challenge:createHash("sha256").update(verifier).digest("base64url"),code_challenge_method:"S256",prompt:"select_account"}).toString();
 const r=NextResponse.redirect(u,{status:303,headers:secureHeaders});setCookie(r,OAUTH,payload+"."+sign(payload),600);return r;
}
export async function completeOAuth(request:Request){
 const [payload,signature]=cookies(request,OAUTH).split(".");
 if(!payload||!signature||!same(sign(payload),signature))throw new ApiError(401,"Invalid login state");
 const tx=JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));
 const query=new URL(request.url).searchParams;
 if(tx.expires<Date.now()||!same(query.get("state")||"",tx.state)||!query.get("code"))throw new ApiError(401,"Expired login attempt");
 const client=process.env.GOOGLE_CLIENT_ID,secret=process.env.GOOGLE_CLIENT_SECRET;
 if(!client||!secret)throw new ApiError(503,"Google login unavailable");
 const response=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code:query.get("code")!,client_id:client,client_secret:secret,redirect_uri:origin()+"/login/oauth2/code/google",grant_type:"authorization_code",code_verifier:tx.verifier}),signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw new ApiError(401,"Google login rejected");
 const result=await response.json();
 const {payload:claims}=await jwtVerify(result.id_token,jwks,{issuer:[issuer,"accounts.google.com"],audience:client,algorithms:["RS256"]});
 if(claims.nonce!==tx.nonce||!claims.sub||(claims.azp&&claims.azp!==client)||!isAllowed(issuer,claims.sub,String(claims.email||""),claims.email_verified===true))throw new ApiError(403,"Account not authorized");
 const token=randomToken(),csrf=randomToken();
 const sql=db();
 await sql.transaction([sql`DELETE FROM native_owner_sessions WHERE expires_at<=now() OR token_hash=${sha256(cookies(request,SESSION))}`,sql`INSERT INTO native_owner_sessions(token_hash,issuer,subject,name,email,csrf_token) VALUES (${sha256(token)},${issuer},${claims.sub},${String(claims.name||"")},${claims.email_verified===true?String(claims.email||""):""},${csrf})`]);
 const r=NextResponse.redirect(origin()+"/admin",{status:303,headers:secureHeaders});setCookie(r,SESSION,token,28800);setCookie(r,OAUTH,"",0);return r;
}
export async function logout(request:Request){
 const form=await request.formData();
 const headers=new Headers(request.headers);headers.set("x-xsrf-token",String(form.get("_csrf")||""));
 const a=await owner(new Request(request.url,{method:"POST",headers}),false);
 await db()`DELETE FROM native_owner_sessions WHERE token_hash=${a.token_hash}`;
 const r=NextResponse.redirect(origin()+"/",{status:303,headers:secureHeaders});
 setCookie(r,SESSION,"",0);return r;
}
const ALPHABET="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function base32(bytes:Buffer){let out="",bits=0,n=0;for(const b of bytes){n=(n<<8)|b;bits+=8;while(bits>=5){out+=ALPHABET[(n>>>(bits-5))&31];bits-=5;}}if(bits)out+=ALPHABET[(n<<(5-bits))&31];return out}
export function totp(secret:Buffer,counter:number){const input=Buffer.alloc(8);input.writeBigUInt64BE(BigInt(counter));const h=createHmac("sha1",secret).update(input).digest();return String((h.readUInt32BE(h[19]&15)&0x7fffffff)%1000000).padStart(6,"0")}
export async function enroll(a:Owner){
 if(a.configured)throw new ApiError(409,"An authenticator is already configured");
 const secret=randomBytes(20),iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",encryptionKey(),iv);
 const encrypted=Buffer.concat([cipher.update(secret),cipher.final(),cipher.getAuthTag()]);
 const [r]=await db()`INSERT INTO admin_totp_credentials(issuer,subject,secret_ciphertext,secret_iv) VALUES (${a.issuer},${a.subject},decode(${encrypted.toString("hex")},'hex'),decode(${iv.toString("hex")},'hex')) ON CONFLICT(issuer,subject) DO UPDATE SET secret_ciphertext=EXCLUDED.secret_ciphertext,secret_iv=EXCLUDED.secret_iv,last_counter=-1,failed_attempts=0,locked_until=NULL,updated_at=now() WHERE NOT admin_totp_credentials.enabled RETURNING subject`;
 if(!r)throw new ApiError(409,"An authenticator is already configured");
 const encoded=base32(secret);return {secret:encoded,otpauthUri:"otpauth://totp/"+encodeURIComponent("Benjamin Portfolio:"+(a.email||a.subject))+"?secret="+encoded+"&issuer=Benjamin%20Portfolio&algorithm=SHA1&digits=6&period=30"};
}
export async function verify(a:Owner,code:unknown,confirm:boolean){
 const sql=db();
 const [row]=await sql`SELECT encode(secret_ciphertext,'hex') AS encrypted,encode(secret_iv,'hex') AS iv,enabled,last_counter,failed_attempts,locked_until FROM admin_totp_credentials WHERE issuer=${a.issuer} AND subject=${a.subject}`;
 if(!row||Boolean(row.enabled)===confirm||row.locked_until&&Date.parse(row.locked_until)>Date.now())throw new ApiError(401,"Code invalid or temporarily locked");
 const encrypted=Buffer.from(row.encrypted,"hex"),decipher=createDecipheriv("aes-256-gcm",encryptionKey(),Buffer.from(row.iv,"hex"));decipher.setAuthTag(encrypted.subarray(-16));const secret=Buffer.concat([decipher.update(encrypted.subarray(0,-16)),decipher.final()]);
 const current=Math.floor(Date.now()/30000);
 let match=-1;
 if(typeof code==="string"&&/^\d{6}$/.test(code))for(let i=current-1;i<=current+1;i++)if(i>Number(row.last_counter)&&same(totp(secret,i),code))match=i;
 if(match<0){
  await sql`UPDATE admin_totp_credentials SET failed_attempts=CASE WHEN locked_until<=now() THEN 1 ELSE failed_attempts+1 END,locked_until=CASE WHEN (CASE WHEN locked_until<=now() THEN 1 ELSE failed_attempts+1 END)>=5 THEN now()+interval '5 minutes' ELSE NULL END,updated_at=now() WHERE issuer=${a.issuer} AND subject=${a.subject} AND (locked_until IS NULL OR locked_until<=now())`;
  throw new ApiError(401,"Code invalid or expired");
 }
 // Consume the counter and elevate the same session atomically. Compare the encrypted
 // secret too so that a concurrent enrollment cannot verify an obsolete credential.
 const rotated=randomToken();
 const [r]=await sql`WITH consumed AS (UPDATE admin_totp_credentials SET enabled=true,last_counter=${match},failed_attempts=0,locked_until=NULL,updated_at=now() WHERE issuer=${a.issuer} AND subject=${a.subject} AND enabled=${!confirm} AND last_counter<${match} AND (locked_until IS NULL OR locked_until<=now()) AND secret_ciphertext=decode(${row.encrypted},'hex') RETURNING subject) UPDATE native_owner_sessions SET token_hash=${sha256(rotated)},elevated_until=now()+interval '10 minutes' WHERE token_hash=${a.token_hash} AND expires_at>now() AND EXISTS(SELECT 1 FROM consumed) RETURNING token_hash`;
 if(!r)throw new ApiError(401,"Code invalid or already used");
 const response=json({verified:true,expiresInSeconds:600});setCookie(response,SESSION,rotated,28800);return response;
}
export async function audit(a:Owner,action:string,resource:string,id:string|null=null){await db()`INSERT INTO admin_audit_log(actor_issuer,actor_subject,action,resource,resource_id) VALUES (${a.issuer},${a.subject},${action},${resource},${id}::uuid)`}

const LINKEDIN_OAUTH="__Host-PORTFOLIO_LINKEDIN";
export async function beginLinkedIn(request:Request){
 const a=await owner(request);
 const client=process.env.LINKEDIN_CLIENT_ID,secret=process.env.LINKEDIN_CLIENT_SECRET;
 if(!client||!secret||client.startsWith("disabled-"))throw new ApiError(503,"LinkedIn publishing credentials have not been configured");
 const state=randomToken();
 const tx=Buffer.from(JSON.stringify({state,session:a.token_hash,expires:Date.now()+600000})).toString("base64url");
 const u=new URL("https://www.linkedin.com/oauth/v2/authorization");
 u.search=new URLSearchParams({response_type:"code",client_id:client,redirect_uri:origin()+"/login/oauth2/code/linkedin-publisher",state,scope:"openid profile email w_member_social"}).toString();
 const r=NextResponse.redirect(u,{status:303,headers:secureHeaders});setCookie(r,LINKEDIN_OAUTH,tx+"."+sign("linkedin:"+tx),600);return r;
}
export async function completeLinkedIn(request:Request){
 const a=await owner(request),[payload,signature]=cookies(request,LINKEDIN_OAUTH).split(".");
 if(!payload||!signature||!same(sign("linkedin:"+payload),signature))throw new ApiError(401,"Invalid connection state");
 const tx=JSON.parse(Buffer.from(payload,"base64url").toString("utf8")),q=new URL(request.url).searchParams;
 if(tx.expires<Date.now()||tx.session!==a.token_hash||!same(q.get("state")||"",tx.state)||!q.get("code"))throw new ApiError(401,"Connection expired");
 const client=process.env.LINKEDIN_CLIENT_ID,secret=process.env.LINKEDIN_CLIENT_SECRET;if(!client||!secret)throw new ApiError(503,"LinkedIn publishing unavailable");
 const response=await fetch("https://www.linkedin.com/oauth/v2/accessToken",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"authorization_code",code:q.get("code")!,redirect_uri:origin()+"/login/oauth2/code/linkedin-publisher",client_id:client,client_secret:secret}),signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw new ApiError(401,"LinkedIn connection rejected");
 const result=await response.json();if(typeof result.access_token!=="string"||!result.access_token||!Number.isFinite(Number(result.expires_in))||Number(result.expires_in)<=0)throw new ApiError(401,"Invalid LinkedIn token");
 const info=await fetch("https://api.linkedin.com/v2/userinfo",{headers:{Authorization:"Bearer "+result.access_token},signal:AbortSignal.timeout(8000)});if(!info.ok||typeof (await info.json()).sub!=="string")throw new ApiError(401,"LinkedIn identity unavailable");
 function encrypt(value:string){const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",encryptionKey(),iv);const data=Buffer.concat([cipher.update(value,"utf8"),cipher.final(),cipher.getAuthTag()]);return {data:data.toString("hex"),iv:iv.toString("hex")}}
 const token=encrypt(result.access_token),refresh=typeof result.refresh_token==="string"?encrypt(result.refresh_token):null;
 await db()`INSERT INTO linkedin_authorized_clients(principal_name,registration_id,access_token_ciphertext,access_token_iv,refresh_token_ciphertext,refresh_token_iv,scopes,issued_at,expires_at) VALUES (${a.subject},'linkedin-publisher',decode(${token.data},'hex'),decode(${token.iv},'hex'),decode(${refresh?.data??null},'hex'),decode(${refresh?.iv??null},'hex'),${String(result.scope??"openid profile email w_member_social")},now(),now()+(${Number(result.expires_in)}*interval '1 second')) ON CONFLICT(principal_name) DO UPDATE SET registration_id=EXCLUDED.registration_id,access_token_ciphertext=EXCLUDED.access_token_ciphertext,access_token_iv=EXCLUDED.access_token_iv,refresh_token_ciphertext=EXCLUDED.refresh_token_ciphertext,refresh_token_iv=EXCLUDED.refresh_token_iv,scopes=EXCLUDED.scopes,issued_at=EXCLUDED.issued_at,expires_at=EXCLUDED.expires_at,updated_at=now()`;
 await audit(a,"CONNECT","linkedin");
 const r=NextResponse.redirect(origin()+"/admin",{status:303,headers:secureHeaders});setCookie(r,LINKEDIN_OAUTH,"",0);return r;
}
