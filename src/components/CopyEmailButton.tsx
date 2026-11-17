"use client";

import { useEffect, useRef, useState } from "react";

export default function CopyEmailButton({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current); }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setState("copied");
    } catch {
      setState("error");
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setState("idle"), 1800);
  }

  return (
    <button type="button" className={`copy-email-button${state === "copied" ? " is-copied" : ""}${state === "error" ? " has-error" : ""}`} onClick={() => void copy()} aria-label={state === "copied" ? "Email copied" : state === "error" ? "Could not copy email" : "Copy email address"}>
      <span className="copy-email-icon" aria-hidden="true"><i /><i /></span>
      <span>{state === "copied" ? "Copied" : state === "error" ? "Copy failed" : "Copy email"}</span>
    </button>
  );
}
