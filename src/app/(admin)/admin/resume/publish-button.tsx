"use client";

import { useState, useTransition } from "react";

import { publishResumeAction, type PublishState } from "./actions";

export function PublishButton() {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<PublishState | null>(null);

  return (
    <div className="mt-8">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setState(await publishResumeAction());
          })
        }
        className="border border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-fg transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
      >
        {pending ? "Publishing…" : "Publish snapshot"}
      </button>

      {state ? (
        <p
          role="status"
          className={`mt-4 border-l pl-3 text-sm ${
            state.ok ? "border-line text-fg-muted" : "border-accent text-fg-muted"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
