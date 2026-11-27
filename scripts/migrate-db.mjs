// Apply forward-only SQL migrations to the existing Neon database, retaining the
// Flyway history format so the previous deployment remains a rollback option.
import {neon} from "@neondatabase/serverless";
import {readFileSync,readdirSync} from "node:fs";
import {crc32} from "node:zlib";
import {resolve} from "node:path";
const dir=resolve("db/migrations");
const url=process.env.DATABASE_URL;
if(!url)throw Error("DATABASE_URL is required");
const sql=neon(url.replace(/^jdbc:/,""));
const migrations=readdirSync(dir).map(f=>{const match=/^V(\d+)__(.+)\.sql$/.exec(f);if(!match)return null;const source=readFileSync(resolve(dir,f),"utf8").replace(/^\uFEFF/,"");return {version:Number(match[1]),file:f,description:match[2].replace(/_/g," "),source,checksum:crc32(Buffer.from(source.split(/\r?\n/).join("")))|0}}).filter(Boolean).sort((a,b)=>a.version-b.version);
const history=await sql`SELECT version,checksum,success FROM flyway_schema_history WHERE version IS NOT NULL ORDER BY installed_rank`;
if(!history.length)throw Error("Existing database migration history required; do not bootstrap production implicitly.");
for(const row of history){const m=migrations.find(x=>String(x.version)===row.version);if(!m||!row.success||m.checksum!==row.checksum)throw Error("Migration checksum/history mismatch at V"+row.version)}
function split(source){
 // Recognize quoted strings, dollar-quoted SQL, nested comments and identifiers.
 const result=[];let start=0,i=0,quote="",comment=0,line=false;
 while(i<source.length){
  const c=source[i],n=source[i+1];
  if(line){if(c==="\n")line=false;i++;continue}
  if(comment){if(c==="/"&&n==="*"){comment++;i+=2}else if(c==="*"&&n==="/"){comment--;i+=2}else i++;continue}
  if(quote){if(source.startsWith(quote,i)){if((quote==="'"||quote==='"')&&source.startsWith(quote+quote,i)){i+=2;continue}i+=quote.length;quote="";continue}i++;continue}
  if(c==="-"&&n==="-"){line=true;i+=2;continue}
  if(c==="/"&&n==="*"){comment=1;i+=2;continue}
  if(c==="'"||c==='"'){quote=c;i++;continue}
  if(c==="$"){const m=/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/.exec(source.slice(i));if(m){quote=m[0];i+=quote.length;continue}}
  if(c===";"){const s=source.slice(start,i).trim();if(s)result.push(s);start=i+1}i++;
 }
 if(quote||comment)throw Error("Unterminated SQL quote/comment");
 const tail=source.slice(start).trim();if(tail&&!/^--[^\n]*$/.test(tail))result.push(tail);
 return result;
}
let latest=Number(history.at(-1).version);
console.warn("Verified",history.length,"applied migrations, latest V"+latest);
for(const m of migrations.filter(m=>m.version>latest)){
 if(m.version!==latest+1)throw Error("Non-contiguous migration");
 const statements=split(m.source);
 await sql.transaction([
 sql.query("LOCK TABLE flyway_schema_history IN EXCLUSIVE MODE"),
 sql.query("DO $$ BEGIN IF (SELECT version FROM flyway_schema_history WHERE version IS NOT NULL ORDER BY installed_rank DESC LIMIT 1) <> '"+latest+"' THEN RAISE EXCEPTION 'Unexpected migration version'; END IF; END $$"),
 ...statements.map(s=>sql.query(s)),
 sql`INSERT INTO flyway_schema_history(installed_rank,version,description,type,script,checksum,installed_by,execution_time,success) SELECT COALESCE(max(installed_rank),0)+1,${String(m.version)},${m.description},'SQL',${m.file},${m.checksum},current_user,0,true FROM flyway_schema_history`
 ]);
 latest=m.version;console.warn("Applied V"+latest);
}
