import HoloAuth from "@/components/HoloAuth";
import Link from "next/link";
export default function NotFound(){return <HoloAuth title="Page not found"><h2>Page not found</h2><p>This page is unavailable.</p><Link className="button" href="/">Return home</Link></HoloAuth>;}
