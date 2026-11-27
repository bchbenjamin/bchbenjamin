import {neon} from "@neondatabase/serverless";
import * as Q from "./public-queries";
import {cache} from "react";

type Row=Record<string,unknown>;
export function databaseConfigured(){return !!process.env.DATABASE_URL;}
export function db(){
 const url=process.env.DATABASE_URL;
 if(!url)throw new Error("Database unavailable");
 return neon(url.replace(/^jdbc:/,""));
}
function object(v:unknown):Row{
 if(typeof v==="string"){try{return object(JSON.parse(v));}catch{return {};}}
 return v&&typeof v==="object"&&!Array.isArray(v)?v as Row:{};
}
const rows=(v:unknown):Row[]=>Array.isArray(v)?v.map(object):[];
const privateColumns=new Set(["id","public_fields","custom_fields","created_at","updated_at","published","sort_order","gallery_image_url","resume_included","public_media","profile_photo_id","profile_photo_url"]);
export function visible(fields:Row,key:string){return typeof fields[key]==="boolean"?fields[key]===true:fields["*"]===true;}
export function publicRecord(row:Row){
 const fields=object(row.public_fields),custom=object(row.custom_fields),result:Row={};
 for(const [k,v] of Object.entries(row)){
  if(privateColumns.has(k)||v==null)continue;
  const name=k.replace(/_([a-z])/g,(_,l:string)=>l.toUpperCase());
  if(visible(fields,name))result[name]=v;
 }
 for(const [k,v] of Object.entries(custom))if(fields["customFields."+k]===true&&!["__proto__","constructor","prototype","profilePhotoUrl","profilePhotoId"].includes(k))result[k]=v;
 return result;
}
function profileRecord(row:Row){
 const result=publicRecord(row);
 if(visible(object(row.public_fields),"profilePhotoId")&&typeof row.profile_photo_url==="string")result.profilePhotoUrl=row.profile_photo_url;
 return result;
}
function skillsRecord(row:Row){
 const group=object(row.group_public_fields),skill=object(row.skill_public_fields);
 if(!visible(group,"name"))return [];
 const result:Row={group_name:row.group_name};
 if(visible(group,"description"))result.group_description=row.group_description;
 if(row.skill_id!=null&&visible(skill,"name")){
  result.skill_name=row.skill_name;
  if(visible(skill,"proficiency"))result.proficiency=row.proficiency;
 }
 return [result];
}
const listQueries={projects:Q.PROJECTS_SQL,experience:Q.EXPERIENCE_SQL,education:Q.EDUCATION_SQL,achievements:Q.ACHIEVEMENTS_SQL,skills:Q.SKILLS_SQL,gallery:Q.GALLERY_SQL,files:Q.FILES_SQL,notifications:Q.NOTIFICATIONS_SQL};
export function mapCollection(key:string,data:Row[]){
 switch(key){
 case "projects":return data.flatMap(row=>{const p=publicRecord(row);return p.name&&p.slug?[{...p,media:rows(row.public_media)}]:[]});
 case "experience":return data.map(publicRecord).filter(r=>r.roleTitle&&r.organization);
 case "education":return data.map(publicRecord).filter(r=>r.institution&&r.qualification);
 case "achievements":return data.map(row=>({...publicRecord(row),...(row.gallery_image_url?{imageUrl:row.gallery_image_url}:{})} as Row)).filter(r=>r.title);
 case "skills":return data.flatMap(skillsRecord);
 default:return data;
 }
}
const bundleSQL="SELECT jsonb_build_object('profile',COALESCE((SELECT to_jsonb(p) FROM ("+Q.PROFILE_SQL+") p),'{}'::jsonb),"+Object.entries(listQueries).map(([k,q])=>"'"+k+"',COALESCE((SELECT jsonb_agg(t) FROM ("+q+") t),'[]'::jsonb)").join(",")+",'siteConfiguration',(SELECT published_config FROM site_configuration WHERE id=1)) AS payload";
export const readPublicBundle=cache(async()=>{
 const sql=db(),[r]=await sql.query(bundleSQL);
 if(!r)throw Error("Public portfolio unavailable");
 const raw=object(r.payload);
 const output:Row={profile:profileRecord(object(raw.profile)),siteConfiguration:object(raw.siteConfiguration)};
 for(const key of Object.keys(listQueries))output[key]=mapCollection(key,rows(raw[key]));
 return output;
});
export async function readPublicResource(path:string[]){
 if(path[0]==="portfolio"&&path.length===1)return readPublicBundle();
 const sql=db();
 if(path[0]==="profile"&&path.length===1){const [p]=await sql.query(Q.PROFILE_SQL);return p?profileRecord(p):null;}
 if(path[0]==="site-configuration"&&path.length===1){const [r]=await sql`SELECT published_config FROM site_configuration WHERE id=1`;return r?object(r.published_config):null;}
 if(path[0]==="projects"&&path.length===2){const result=mapCollection("projects",await sql.query(Q.PROJECTS_SQL));return result.find(r=>r.slug===path[1])??null;}
 if(path.length===1&&Object.hasOwn(listQueries,path[0]))return mapCollection(path[0],await sql.query(listQueries[path[0] as keyof typeof listQueries]));
 return null;
}
