import {completeOAuth,fail} from "@/lib/server/owner-auth";
export async function GET(request:Request){try{return await completeOAuth(request)}catch(e){return fail(e)}}
