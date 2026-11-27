export type PortfolioNotification={id:string;title:string;body:string;target:string;published_at:string;expires_at:string;revoked?:boolean};
export const NOTIFICATION_APPS=["about","projects","experience","education","certifications","achievements","gallery","files","googleplus","skills","journey","chess"] as const;
export function activeNotifications(rows:PortfolioNotification[],dismissed:string[],now=Date.now()){
 return rows.filter(n=>!n.revoked&&!dismissed.includes(n.id)&&Date.parse(n.published_at)<=now&&Date.parse(n.expires_at)>now);
}
export function validNotificationTarget(value:string){
 if(value.startsWith("app:"))return (NOTIFICATION_APPS as readonly string[]).includes(value.slice(4));
 try{const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&["www.linkedin.com","linkedin.com"].includes(u.hostname)&&["/posts/","/feed/update/","/pulse/"].some(p=>u.pathname.startsWith(p));}catch{return false}
}
