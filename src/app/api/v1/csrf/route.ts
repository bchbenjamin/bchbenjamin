import {owner,json,fail} from "@/lib/server/owner-auth";
export async function GET(request:Request){try{return json({token:(await owner(request,false)).csrf_token,headerName:"X-XSRF-TOKEN",parameterName:"_csrf"})}catch(e){return fail(e)}}
