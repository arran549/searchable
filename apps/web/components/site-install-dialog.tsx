"use client";

import { useEffect, useRef, useState } from "react";

import { CopyButton } from "@/components/copy-button";
import type { DashboardSite } from "@/lib/dashboard";
import { getPixelInstallSnippet, getScriptInstallSnippet } from "@/lib/tracking-snippets";

type SiteInstallDialogProps = {
  site: DashboardSite;
  supabaseUrl: string;
};

export function SiteInstallDialog({ site, supabaseUrl }: SiteInstallDialogProps) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"script" | "pixel">("script");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scriptSnippet = getScriptInstallSnippet(supabaseUrl, site.tracking_token);
  const pixelSnippet = getPixelInstallSnippet(supabaseUrl, site.tracking_token);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    function handleClose() {
      setOpen(false);
    }

    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("close", handleClose);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-[var(--border)] bg-[#fbf7f0] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-white"
      >
        Install
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`install-${site.id}`}
        className="m-auto w-[min(960px,calc(100vw-2rem))] border-0 bg-transparent p-0 backdrop:bg-[#12212f]/35 backdrop:backdrop-blur-[2px]"
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            setOpen(false);
          }
        }}
      >
        <div className="panel max-h-[90vh] overflow-x-hidden overflow-y-auto rounded-[1.75rem] p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Install tracking
              </p>
              <h3 id={`install-${site.id}`} className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                {site.name || site.domain}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
                Deploy the script for the default path. Use the pixel only when the target
                environment cannot accept JavaScript.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-[var(--border)] bg-white/80 px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-white"
            >
              Close
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {["Add to site template", "Publish changes", "Confirm in Activity"].map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-[var(--border)] bg-white/65 px-4 py-3 text-sm font-medium text-[var(--foreground)]"
              >
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#132230] text-xs font-semibold text-white">
                  {index + 1}
                </span>
                {step}
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMethod("script")}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    method === "script"
                      ? "border-[#132230] bg-[#132230] text-white"
                      : "border-[var(--border)] bg-white/70 text-[var(--foreground)] hover:bg-white",
                  ].join(" ")}
                >
                  Script (Recommended)
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("pixel")}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    method === "pixel"
                      ? "border-[#132230] bg-[#132230] text-white"
                      : "border-[var(--border)] bg-white/70 text-[var(--foreground)] hover:bg-white",
                  ].join(" ")}
                >
                  HTML Pixel
                </button>
              </div>

              <InstallSnippetBlock
                title={method === "script" ? "Recommended script" : "HTML pixel fallback"}
                description={
                  method === "script"
                    ? "Best for modern sites, apps, and templates where you want the full client-side tracking flow."
                    : "Use this for static HTML blocks, CMS embeds, or environments where scripts are constrained."
                }
                code={method === "script" ? scriptSnippet : pixelSnippet}
                copyLabel={method === "script" ? "Copy script" : "Copy pixel"}
              />
            </div>

            <div className="min-w-0 space-y-4">
              <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Tracking token
                </p>
                <p className="mt-3 break-all font-[family-name:var(--font-mono)] text-sm leading-6">
                  {site.tracking_token}
                </p>
                <div className="mt-4">
                  <CopyButton value={site.tracking_token} label="Copy token" />
                </div>
              </article>

              <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Install notes
                </p>
                <div className="mt-4 grid gap-3">
                  {[
                    "Place the script in the shared layout or global template for site-wide coverage.",
                    "Use the pixel only when script injection is not practical.",
                    "After deploy, confirm the first event in Activity to validate the pipeline.",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3 text-sm leading-6 text-[var(--muted-foreground)]"
                    >
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#132230] text-xs font-semibold text-white">
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}

function InstallSnippetBlock({
  title,
  description,
  code,
  copyLabel,
}: {
  title: string;
  description: string;
  code: string;
  copyLabel: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-[var(--border)] bg-white/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold">{title}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
            {description}
          </p>
        </div>
        <CopyButton value={code} label={copyLabel} />
      </div>

      <pre className="mt-4 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[#fffdf8] p-3 text-xs leading-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
        <code>{code}</code>
      </pre>
    </article>
  );
}
