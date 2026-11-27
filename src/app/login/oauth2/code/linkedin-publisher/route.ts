import {completeLinkedIn,fail} from "@/lib/server/owner-auth";
export async function GET(request:Request){try{return await completeLinkedIn(request)}catch(e){return fail(e)}}
