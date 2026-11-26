export type PublicFile = {id:string; original_filename:string; content_type:string; byte_size:number; caption:string; category:string; storage_path?:string; url:string};
export const ANDROID_FOLDERS = ["Alarms","Android","DCIM","Download","Movies","Music","Notifications","Pictures","Podcasts","Ringtones","Portfolio"] as const;
export const PORTFOLIO_FOLDERS = ["Certificates","Projects","Experience","Education","Images","Videos","Documents"] as const;
export type PortfolioFolder = typeof PORTFOLIO_FOLDERS[number];
export function categoryOf(file: Pick<PublicFile,"category"|"content_type">):PortfolioFolder {
 return PORTFOLIO_FOLDERS.find(folder=>folder===file.category) ?? (file.content_type.startsWith("image/")?"Images":file.content_type.startsWith("video/")?"Videos":"Documents");
}
export function filesInFolder(files: PublicFile[],folder:string) {
 return files.filter(f=>categoryOf(f)===folder).sort((a,b)=>a.original_filename.localeCompare(b.original_filename,undefined,{numeric:true,sensitivity:"base"}));
}
export function fileSize(bytes:number) {
 return bytes>=1048576?(bytes/1048576).toFixed(1)+" MB":bytes>=1024?(bytes/1024).toFixed(1)+" KB":bytes+" B";
}

export function filePath(file: PublicFile): string[] {
 const parts=(file.storage_path||"").split("/").filter(Boolean);
 return parts.length&&parts.every(p=>p!=="."&&p!==".."&&!p.includes("\\"))?parts:[categoryOf(file)];
}
export function folderEntries(files: PublicFile[],path:string[]) {
 const prefix=path.join("/");
 const match=(file:PublicFile)=>filePath(file).slice(0,path.length).join("/")===prefix;
 const descendants=files.filter(match);
 const folders=[...new Set(descendants.map(f=>filePath(f)[path.length]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:"base"}));
 const entries=descendants.filter(f=>filePath(f).length===path.length).sort((a,b)=>a.original_filename.localeCompare(b.original_filename,undefined,{numeric:true,sensitivity:"base"}));
 return {folders,entries};
}
