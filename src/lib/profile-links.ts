import type { SiteContent } from "./content";

export type ProfileLink = {label:string;href:string;detail:string;icon:string;internal?:boolean};
const ICONS="/jellybean/icons/";
const WEB=ICONS+"aosp-4.1.2/browser.png";
export function profileLinks(site:Pick<SiteContent,"owner"|"launcher">):ProfileLink[]{
 const {owner,launcher}=site;
 const result:ProfileLink[]=[{label:"Portfolio",href:"/",detail:"Home screen",icon:"/logo.svg",internal:true}];
 const seen=new Set(["https://www.bchbenjamin.in/","https://bchbenjamin.in/"]);
 function add(label:string,value:string,icon:string,detail?:string){
  try{
   const url=new URL(value);
   if(url.protocol!=="https:"&&url.protocol!=="http:"&&url.protocol!=="mailto:")return;
   if(seen.has(url.href))return;seen.add(url.href);
   result.push({label,href:url.href,detail:detail|| (url.protocol==="mailto:"?url.pathname:url.host+url.pathname.replace(/\/$/,"")),icon});
  }catch{/* empty or invalid unpublished field */}
 }
 add("Website",owner.website,WEB);
 add("GitHub",owner.github,ICONS+"brands/github.svg");
 add("LinkedIn",owner.linkedin,ICONS+"brands/linkedin.png");
 if(owner.email)add("Email","mailto:"+owner.email,ICONS+"aosp-4.1.2/email.png");
 if(launcher.chessComProfileUrl!== "https://www.chess.com")add("Chess.com",launcher.chessComProfileUrl,ICONS+"brands/chessdotcom.svg");
 if(launcher.lichessProfileUrl!=="https://lichess.org")add("Lichess",launcher.lichessProfileUrl,ICONS+"brands/lichess.svg");
 return result;
}
