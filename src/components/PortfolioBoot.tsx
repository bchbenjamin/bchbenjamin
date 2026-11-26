import Image from "next/image";
export default function PortfolioBoot() {
  return <div className="jb-boot" role="status" aria-label="Loading portfolio">
    <Image src="/logo.svg" alt="" width={104} height={134} loading="eager" unoptimized />
    <p>Starting portfolio</p>
    <span className="jb-boot-progress" aria-hidden="true"><i /></span>
  </div>;
}
