import {beginLinkedIn,fail} from "@/lib/server/owner-auth";
export async function GET(request:Request){try{return await beginLinkedIn(request)}catch(e){return fail(e)}}
