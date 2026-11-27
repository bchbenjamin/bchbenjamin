// Vercel functions accept bounded request bodies. Upload 12 MiB files in 2 MiB parts.
export async function uploadMedia(base:string,form:FormData,csrf:string,progress?:(n:number)=>void):Promise<Response>{
 const file=form.get("file");if(!(file instanceof File))throw new Error("Choose a file");
 const headers={"X-XSRF-TOKEN":csrf,"Content-Type":"application/json"};
 const url=base+"/api/v1/admin/media/uploads";
 const metadata={filename:file.name,type:file.type,size:file.size,altText:form.get("altText")||"",caption:form.get("caption")||"",visibility:form.get("visibility")||"PRIVATE",storagePath:form.get("storagePath")||"",followRecord:form.get("followRecord")==="true",resourceType:form.get("resourceType")||"",resourceId:form.get("resourceId")||null};
 const start=await fetch(url,{method:"POST",credentials:"include",headers,body:JSON.stringify(metadata)});
 if(!start.ok)return start;
 const {id}=await start.json();const size=2*1024*1024;
 for(let i=0;i<Math.ceil(file.size/size);i++){
  const chunk=await fetch(url+"/"+id+"/"+i,{method:"PUT",credentials:"include",headers:{"X-XSRF-TOKEN":csrf,"Content-Type":"application/octet-stream"},body:file.slice(i*size,(i+1)*size)});
  if(!chunk.ok)return chunk;progress?.(Math.min(99,Math.round(((i+1)*size/file.size)*100)));
 }
 return fetch(url+"/"+id+"/complete",{method:"POST",credentials:"include",headers});
}
