import {beginOAuth,fail} from "@/lib/server/owner-auth";
export async function GET(){try{return await beginOAuth()}catch(e){return fail(e)}}
