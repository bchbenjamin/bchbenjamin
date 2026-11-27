/* eslint-disable @next/next/no-img-element -- ImageResponse requires plain image elements. */
import { ImageResponse } from "next/og";
import { getSiteContent } from "@/lib/content";
import { summary, SITE_ORIGIN } from "@/lib/seo";
import sharp from "sharp";
import {db,databaseConfigured} from "@/lib/server/public-portfolio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function portrait(url?: string) {
  if (!url) return null;
  // Only fetch the public media endpoint, never an arbitrary user-provided URL.
  try {
    const media = new URL(url, SITE_ORIGIN);
    if (!/^\/api\/v1\/public\/media\/[0-9a-f-]{36}$/i.test(media.pathname)) return null;
    if(databaseConfigured()){
      const id=media.pathname.split("/").at(-1);
      const [row]=await db()`SELECT encode(file_bytes,'base64') AS data FROM public_media_assets WHERE id=${id}::uuid AND content_type LIKE 'image/%' AND byte_size<=12582912`;
      if(!row)return null;
      const bytes=await sharp(Buffer.from(row.data,"base64")).resize(420,420,{fit:"cover"}).jpeg({quality:87}).toBuffer();
      return "data:image/jpeg;base64,"+bytes.toString("base64");
    }
    const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || SITE_ORIGIN;
    const response = await fetch(new URL(media.pathname, base), { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const bytes = await sharp(Buffer.from(await response.arrayBuffer())).resize(420, 420, { fit: "cover" }).jpeg({ quality: 87 }).toBuffer();
    return "data:image/jpeg;base64," + bytes.toString("base64");
  } catch { return null; }
}

export async function GET() {
  const { owner } = await getSiteContent();
  const photo = await portrait(owner.photoUrl);
  const name = summary(owner.name || "Personal portfolio", 85);
  const about = summary(owner.intro || owner.headline || "Explore my portfolio.", 225);
  const headline = owner.intro ? summary(owner.headline, 110) : "";
  return new ImageResponse(
    <div style={{display:"flex",flexDirection:"column",width:"100%",height:"100%",background:"#10161d",color:"#f4f7fa",padding:"52px 56px",fontFamily:"sans-serif"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:22,color:"#8bd9f2"}}>
        <span>PERSONAL PORTFOLIO</span><span style={{color:"#b6c5d0"}}>bchbenjamin.in</span>
      </div>
      <div style={{display:"flex",height:4,background:"#33b5e5",marginTop:23,marginBottom:36}}/>
      <div style={{display:"flex",flex:1,alignItems:"center",gap:42}}>
        {photo ? <img src={photo} alt="" width={286} height={286} style={{borderRadius:12,objectFit:"cover"}}/> :
          <div style={{width:286,height:286,display:"flex",alignItems:"center",justifyContent:"center",background:"#243442",border:"2px solid #33b5e5",borderRadius:12,color:"#33b5e5",fontSize:88}}>{owner.monogram || "B"}</div>}
        <div style={{display:"flex",flexDirection:"column",width:754,justifyContent:"center"}}>
          <div style={{fontSize:name.length>45?41:54,fontWeight:700,lineHeight:1.12}}>{name}</div>
          {headline && <div style={{fontSize:23,color:"#82d7f5",marginTop:15,lineHeight:1.3}}>{headline}</div>}
          <div style={{fontSize:25,lineHeight:1.4,marginTop:20,color:"#dce6ed"}}>{about}</div>
        </div>
      </div>
      <div style={{display:"flex",borderTop:"1px solid #41505e",paddingTop:18,fontSize:20,color:"#b6c5d0",justifyContent:"space-between"}}><span>Projects · Experience · Achievements</span><span>Android 4.1 inspired</span></div>
    </div>,
    {width:1200,height:630,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}}
  );
}
