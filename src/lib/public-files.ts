export type PublicFile = {id:string; original_filename:string; content_type:string; byte_size:number; caption:string; category:string; url:string};
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
