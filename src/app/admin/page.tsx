import type { Metadata } from "next";
import DeveloperEntry from "@/components/DeveloperEntry";
import "./admin.css";
import AdminGate from "@/components/AdminGate";

export const metadata: Metadata = {
  title: "Portfolio administration",
  robots: { index: false, follow: false }
};

export default function AdminPage() {
  return (
    <DeveloperEntry><AdminGate /></DeveloperEntry>
  );
}
