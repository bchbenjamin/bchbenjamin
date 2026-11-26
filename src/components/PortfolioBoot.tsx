"use client";
import Image from "next/image";
import {usePathname} from "next/navigation";
export default function PortfolioBoot() {
 const pathname=usePathname();
 // Root startup only; never inside another app, iframe or client-side navigation.
 if(pathname!=="/")return null;
 return <div className="jb-boot" role="status" aria-label="Loading portfolio">
    <Image src="/logo.svg" alt="" width={104} height={134} loading="eager" unoptimized />
    <p>Starting portfolio</p>
    <span className="jb-boot-progress" aria-hidden="true"><i /></span>
  </div>;
}
