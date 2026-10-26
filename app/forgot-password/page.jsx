
"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail, ShoppingBag, CheckCircle2 } from "lucide-react";
import apiClient from "@/services/apiClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      await apiClient.post("/auth/users/reset_password/", { email });
      setSubmitted(true);
    } catch (error) {
      const data = error.response?.data;
      const message =
        data?.detail ||
        data?.email?.[0] ||
        "Unable to request a password reset. Please try again.";

      setErrorMsg(
        typeof message === "string" ? message : "Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft className="size-4" />
          Back to Sign In
        </Link>

        <div className="mt-8 flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <ShoppingBag />
        </div>

        {!submitted ? (
          <>
            <h1 className="mt-6 text-3xl font-black text-slate-900">
              Forgot Password?
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Enter your registered email address and we will send you a
              link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-800">
                  Email address
                </span>
                <span className="relative block">
                  <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-black outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </span>
              </label>

              {errorMsg && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-indigo-600 text-sm font-extrabold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6">
            <CheckCircle2 className="size-10 text-green-600" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Check Your Email
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              If an account is registered with this address, a password
              reset email should arrive shortly. Check your spam folder too.
            </p>
            <p className="mt-3 break-all text-sm font-semibold text-slate-800">
              {email}
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mt-5 text-sm font-bold text-indigo-600 hover:text-indigo-700"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
