import {maintenance} from "@/lib/server/contact";
import {timingSafeEqual} from "node:crypto";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 const expected=process.env.CRON_SECRET?"Bearer "+process.env.CRON_SECRET:"";
 const supplied=request.headers.get("authorization")||"";
 if(!expected||Buffer.byteLength(expected)!==Buffer.byteLength(supplied)||!timingSafeEqual(Buffer.from(expected),Buffer.from(supplied)))return Response.json({error:"unauthorized"},{status:401});
 try{return Response.json(await maintenance())}catch{return Response.json({error:"maintenance_unavailable"},{status:503})}
}
