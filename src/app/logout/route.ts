import {logout,fail} from "@/lib/server/owner-auth";
export async function POST(request:Request){try{return await logout(request)}catch(e){return fail(e)}}
