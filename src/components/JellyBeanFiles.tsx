"use client";
import {useEffect,useState} from "react";
import {ANDROID_FOLDERS,PORTFOLIO_FOLDERS,folderEntries,fileSize,type PublicFile} from "@/lib/public-files";
const base=(process.env.NEXT_PUBLIC_API_BASE_URL??"").replace(/\/$/,"");
function FolderIcon(){return <svg viewBox="0 0 48 40" width="38" height="32" aria-hidden="true"><path d="M2 8h18l5 5h21v25H2Z" fill="#b28b45" stroke="#8d6931"/><path d="M2 15h44l-3 22H5Z" fill="#e7bc68" stroke="#b49150"/><path d="M4 17h40" stroke="#ffe1a1"/></svg>}
export default function JellyBeanFiles({path,onPath}:{path:string[];onPath:(path:string[])=>void}){
 const [files,setFiles]=useState<PublicFile[]>([]);const [state,setState]=useState<"loading"|"ready"|"error">("loading");const [attempt,setAttempt]=useState(0);
 useEffect(()=>{const controller=new AbortController();fetch(base+"/api/v1/public/files",{signal:controller.signal,cache:"no-store",credentials:"omit"}).then(async r=>{if(!r.ok)throw Error("files unavailable");const value=await r.json();if(!Array.isArray(value))throw Error();setFiles(value);setState("ready");}).catch(()=>{if(!controller.signal.aborted)setState("error");});return()=>controller.abort();},[attempt]);
 const portfolio=path[0]==="Portfolio";
 const view=folderEntries(files,portfolio?path.slice(1):[]);
 const folders=path.length===0?[...ANDROID_FOLDERS]:portfolio?(path.length===1?[...new Set([...PORTFOLIO_FOLDERS,...view.folders])].sort((a,b)=>a.localeCompare(b)):view.folders):[];
 const contents=portfolio?view.entries:[];
 return <section className="jb-files" aria-label="File explorer"><div className="jb-files-toolbar"><button disabled={!path.length} onClick={()=>onPath(path.slice(0,-1))} aria-label="Up one folder">↑</button><span>/sdcard{path.map(x=>"/"+x).join("")}</span></div>
 {folders.map(folder=><button className="jb-file-row" key={folder} onClick={()=>onPath([...path,folder])}><FolderIcon/><span><b>{folder}</b><small>{"Folder"}</small></span><span aria-hidden="true">›</span></button>)}
 {contents.map(file=><a className="jb-file-row" key={file.id} href={base+"/api/v1/public/media/"+encodeURIComponent(file.id)} target="_blank" rel="noopener noreferrer"><span className="jb-file-document">{file.content_type==="application/pdf"?"PDF":file.content_type.startsWith("image/")?"IMG":"VID"}</span><span><b>{file.original_filename}</b><small>{fileSize(file.byte_size)}{file.caption?" · "+file.caption:""}</small></span><span aria-hidden="true">›</span></a>)}
 {path[0]==="Portfolio"&&state==="loading"&&<p role="status">Loading public files…</p>}
 {path[0]==="Portfolio"&&state==="error"&&<p role="alert">Files unavailable. <button onClick={()=>{setState("loading");setAttempt(x=>x+1);}}>Retry</button></p>}
 {!folders.length&&!contents.length&&(path[0]!=="Portfolio"||state==="ready")&&<p className="jb-file-empty">This folder is empty.</p>}
 </section>
}
