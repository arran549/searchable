"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { verifySiteAction } from "@/app/dashboard/actions";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { CopyButton } from "@/components/copy-button";
import type { DashboardSite } from "@/lib/dashboard";

type SiteVerificationDialogProps = {
  site: DashboardSite;
  returnTo?: string;
};

type VerificationMethod = "dns" | "file" | "meta";

export function SiteVerificationDialog({ site, returnTo }: SiteVerificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<VerificationMethod>("dns");
  const dialogRef = useRef<HTMLDialogElement>(null);

  const dnsHost = `_searchable-verify.${site.domain}`;
  const dnsValue = site.verification_token;
  const dnsType = "TXT";
  const dnsTtl = "300";
  const filePath = `https://${site.domain}/.well-known/searchable-verification.txt`;
  const metaTag = `<meta name="searchable-site-verification" content="${site.verification_token}" />`;
  const isVerified = Boolean(site.verified_at);
  const returnPath = returnTo ?? "/dashboard/sites";

  const methodDescription = useMemo(() => {
    if (method === "dns") {
      return "Create a TXT record and wait for DNS propagation.";
    }

    if (method === "file") {
      return "Host a verification file on your domain root.";
    }

    return "Add the verification meta tag to your homepage HTML.";
  }, [method]);

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
        className={[
          "inline-flex min-w-[170px] cursor-pointer items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition",
          isVerified
            ? "border border-[var(--border)] bg-white/80 text-[var(--foreground)] hover:bg-white"
            : "bg-[var(--accent)] text-[#0a1014] hover:bg-[var(--accent-strong)]",
        ].join(" ")}
      >
        {isVerified ? "Manage verification" : "Verify domain"}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`verify-${site.id}`}
        className="m-auto w-[min(920px,calc(100vw-2rem))] border-0 bg-transparent p-0 backdrop:bg-[#12212f]/35 backdrop:backdrop-blur-[2px]"
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            setOpen(false);
          }
        }}
      >
        <article className="panel max-h-[90vh] overflow-y-auto rounded-[1.75rem] p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Domain ownership
              </p>
              <h3 id={`verify-${site.id}`} className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Verify {site.name || site.domain}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{methodDescription}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-[var(--border)] bg-white/80 px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-white"
            >
              Close
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white/65 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={[
                    "inline-flex h-3 w-3 rounded-full",
                    isVerified ? "bg-[var(--success)]" : "animate-pulse bg-[#c7652b]",
                  ].join(" ")}
                />
                <p className="text-sm font-semibold">
                  {isVerified ? "Verified" : "Awaiting verification"}
                </p>
              </div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                {site.domain}
              </p>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {["Publish ownership token", "Wait for propagation", "Run verification"].map((step, index) => (
                <div
                  key={step}
                  className="rounded-xl border border-[var(--border)] bg-white/80 px-3 py-2 text-xs text-[var(--foreground)]"
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#132230] text-[10px] font-semibold text-white">
                    {index + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { id: "dns" as const, label: "DNS TXT (Recommended)" },
              { id: "file" as const, label: "Verification File" },
              { id: "meta" as const, label: "Meta Tag" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setMethod(option.id)}
                className={[
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  method === option.id
                    ? "border-[#132230] bg-[#132230] text-white"
                    : "border-[var(--border)] bg-white/75 text-[var(--foreground)] hover:bg-white",
                ].join(" ")}
              >
                {option.label}
              </button>
            ))}
          </div>

          {method === "dns" ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <VerificationFieldCard label="Record type" value={dnsType} copyLabel="Copy type" />
              <VerificationFieldCard label="Record name" value={dnsHost} copyLabel="Copy host" />
              <VerificationFieldCard label="Record value" value={dnsValue} copyLabel="Copy value" fullWidth />
              <VerificationFieldCard label="TTL (seconds)" value={dnsTtl} copyLabel="Copy TTL" />
            </div>
          ) : null}

          {method === "file" ? (
            <div className="mt-4 grid gap-3">
              <VerificationFieldCard label="File URL" value={filePath} copyLabel="Copy URL" />
              <VerificationFieldCard
                label="File contents (exact)"
                value={site.verification_token}
                copyLabel="Copy file token"
              />
            </div>
          ) : null}

          {method === "meta" ? (
            <div className="mt-4 grid gap-3">
              <VerificationFieldCard
                label="Meta tag (add to <head>)"
                value={metaTag}
                copyLabel="Copy meta tag"
                fullWidth
              />
            </div>
          ) : null}

          <form action={verifySiteAction} className="mt-5 flex flex-wrap items-center gap-3">
            <input type="hidden" name="siteId" value={site.id} />
            <input type="hidden" name="returnTo" value={returnPath} />
            <AuthSubmitButton idleLabel="Run verification check" pendingLabel="Verifying domain..." />
            <p className="text-xs text-[var(--muted-foreground)]">
              Verification checks DNS TXT, file, and meta tag automatically.
            </p>
          </form>
        </article>
      </dialog>
    </>
  );
}

function VerificationFieldCard({
  label,
  value,
  copyLabel,
  fullWidth,
}: {
  label: string;
  value: string;
  copyLabel: string;
  fullWidth?: boolean;
}) {
  return (
    <article
      className={[
        "rounded-[1.25rem] border border-[var(--border)] bg-white/60 p-4",
        fullWidth ? "md:col-span-2" : "",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          {label}
        </p>
        <CopyButton value={value} label={copyLabel} />
      </div>
      <pre className="mt-3 overflow-x-auto rounded-xl border border-[var(--border)] bg-[#fffdf8] p-3 font-[family-name:var(--font-mono)] text-xs leading-6 text-[var(--foreground)]">
        <code>{value}</code>
      </pre>
    </article>
  );
}
