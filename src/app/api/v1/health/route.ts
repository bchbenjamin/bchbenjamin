import {db} from "@/lib/server/public-portfolio";
export const dynamic="force-dynamic";
export async function GET(){try{await db()`SELECT 1`;return Response.json({status:"UP",backend:"nextjs"},{headers:{"Cache-Control":"no-store"}})}catch{return Response.json({status:"DOWN"},{status:503})}}
