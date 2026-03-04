"use client";

import { useState, useTransition } from "react";

type CopyButtonProps = {
  value: string;
  label: string;
};

export function CopyButton({ value, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      startTransition(() => {
        window.setTimeout(() => setCopied(false), 1600);
      });
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={[
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition",
        copied
          ? "border-[#b7d6cc] bg-[#eef8f4] text-[#0e6b56]"
          : "border-[var(--border)] bg-[#fbf7f0] text-[var(--foreground)] hover:bg-white",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs",
          copied ? "bg-[#d9efe7] text-[#0e6b56]" : "bg-white text-[var(--muted-foreground)]",
        ].join(" ")}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </span>
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M5.5 5.5V4.75C5.5 3.7835 6.2835 3 7.25 3H11.25C12.2165 3 13 3.7835 13 4.75V8.75C13 9.7165 12.2165 10.5 11.25 10.5H10.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.75 5.5H8.75C9.7165 5.5 10.5 6.2835 10.5 7.25V11.25C10.5 12.2165 9.7165 13 8.75 13H4.75C3.7835 13 3 12.2165 3 11.25V7.25C3 6.2835 3.7835 5.5 4.75 5.5Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M3.5 8.25L6.5 11.25L12.5 5.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
