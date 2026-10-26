
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Mail, RefreshCw, ArrowLeft } from "lucide-react";
import apiClient from "@/services/apiClient";

export default function ActivationNoticePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function resendEmail() {
    if (!email) {
      setError("Email address is missing. Please register again or contact support.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      await apiClient.post("/auth/users/resend_activation/", { email });
      setMessage("If your account needs activation, a new email will be sent.");
    } catch {
      setError("Could not resend the activation email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Mail size={28} />
        </div>

        <h1 className="mt-5 text-2xl font-black text-slate-900">
          Verify your email
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your registration request was received. Please check your inbox
          and spam folder for an activation link.
        </p>

        {email && (
          <p className="mt-3 break-all font-semibold text-indigo-600">
            {email}
          </p>
        )}

        {message && (
          <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
            {message}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={resendEmail}
          disabled={loading}
          className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "Sending..." : "Resend activation email"}
        </button>

        <Link
          href="/login"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>
      </section>
    </main>
  );
}
