import type {ReactNode} from "react";
import Image from "next/image";
import Link from "next/link";
export default function HoloAuth({children,title="Developer options"}:{children:ReactNode;title?:string}){
 return <main className="jb-world jb-auth-world"><div className="jb-device jb-auth-device"><div className="jb-status-bar"><span>Android</span></div><header className="jb-app-actionbar"><Link href="/" aria-label="Return to launcher">‹</Link><Image src="/jellybean/icons/aosp-4.1.2/settings.png" alt="" width={32} height={32}/><b>{title}</b></header><section className="jb-auth-body">{children}</section><div className="jb-auth-nav"><Link href="/" aria-label="Home">⌂</Link></div></div></main>;
}
