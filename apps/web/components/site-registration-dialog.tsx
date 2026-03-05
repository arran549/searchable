"use client";

import { useEffect, useRef, useState } from "react";

import { createSiteAction } from "@/app/dashboard/actions";
import { AuthSubmitButton } from "@/components/auth-submit-button";

export function SiteRegistrationDialog() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

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
        className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[#0a1014] transition hover:bg-[var(--accent-strong)]"
      >
        Create site
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="site-registration-dialog-title"
        className="m-auto w-[min(640px,calc(100vw-2rem))] border-0 bg-transparent p-0 backdrop:bg-[#12212f]/35 backdrop:backdrop-blur-[2px]"
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            setOpen(false);
          }
        }}
      >
        <article className="panel rounded-[1.75rem] p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Onboarding
              </p>
              <h3 id="site-registration-dialog-title" className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
                Register a site
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                Create a domain first, then use the generated tracking token for script or pixel install.
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

          <form action={createSiteAction} className="mt-5 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Domain</span>
              <input
                required
                name="domain"
                placeholder="example.com"
                className="w-full rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Label</span>
              <input
                name="name"
                placeholder="Marketing site, docs, blog..."
                className="w-full rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
              />
            </label>

            <AuthSubmitButton idleLabel="Create site" pendingLabel="Creating..." />
          </form>
        </article>
      </dialog>
    </>
  );
}
