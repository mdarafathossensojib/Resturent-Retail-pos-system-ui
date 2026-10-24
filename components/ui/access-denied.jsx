
"use client";

import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ArrowLeft,
  Home,
  LockKeyhole,
} from "lucide-react";

export default function AccessDenied({
  title = "Access Denied",
  message = "You don't have permission to access this page.",
  showBackButton = true,
  showHomeButton = true,
  onBack,
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-7 text-center shadow-sm sm:p-10">
        {/* Icon */}
        <div className="mx-auto flex size-20 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
          <ShieldAlert className="size-10 text-red-500" />
        </div>

        {/* Status */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500">
          <LockKeyhole className="size-3.5" />
          403 — FORBIDDEN
        </div>

        {/* Message */}
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          {message}
        </p>

        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          If you believe this is a mistake, please contact your administrator.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {showBackButton && (
            <button
              type="button"
              onClick={() => {
                if (onBack) {
                  onBack();
                } else {
                  router.back();
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <ArrowLeft className="size-4" />
              Go Back
            </button>
          )}

          {showHomeButton && (
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Home className="size-4" />
              Go to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
