"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { loginUser, user, loading: authLoading, errorMsg } = useAuth();
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!authLoading && user) router.replace("/dashboard");
  }, [user, authLoading, router]);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    const form = new FormData(e.currentTarget);
    const result = await loginUser({
      email: form.get("email"),
      password: form.get("password"),
    });
    setSubmitting(false);
    if (result.success) router.replace("/dashboard");
    else setFormError(result.message || "Login failed. Please try again.");
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-[#171b3d] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="absolute -right-24 -top-20 size-96 rounded-full border-60 border-indigo-400/10" />
        <Link href="/" className="relative flex w-fit items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-500">
            <ShoppingBag />
          </span>
          <b className="text-lg">RetailFlow</b>
        </Link>
        <div className="relative max-w-lg">
          <span className="rounded-full border border-white/15 px-3 py-2 text-xs font-bold tracking-widest text-indigo-200">
            YOUR STORE, IN SYNC
          </span>
          <h1 className="mt-7 text-5xl font-black leading-tight xl:text-6xl">
            Good to see you <span className="text-indigo-300">again.</span>
          </h1>
          <p className="mt-5 leading-7 text-slate-300">
            Sign in to keep track of your sales, products and customers from one
            organized workspace.
          </p>
          <div className="mt-8 space-y-4 text-sm text-slate-200">
            {[
              "A clear view of daily sales",
              "Inventory and product management",
              "Insights to help you decide",
            ].map((x) => (
              <p key={x}>
                ✓ <span className="ml-2">{x}</span>
              </p>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-slate-400">
          Simple operations. Smarter decisions.
        </p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600"
          >
            <ArrowLeft className="size-4" /> Back to home
          </Link>
          <div className="mt-8 flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 lg:hidden">
            <ShoppingBag />
          </div>
          <p className="mt-8 text-xs font-black uppercase tracking-[.2em] text-indigo-600">
            Welcome back
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Enter your details below to access your workspace.
          </p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">
                Email address
              </span>
              <span className="relative block">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="email"
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-xl border bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 text-black"
                />
              </span>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Password</span>
              <span className="relative block">
                <LockKeyhole className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="password"
                  required
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-xl border bg-slate-50 pl-11 pr-12 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 text-black"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-label="Toggle password visibility"
                >
                  {show ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </span>
            </label>
            <div className="flex justify-end text-sm">
              <Link
                href="/forgot-password"
                className="font-bold text-indigo-600"
              >
                Forgot password?
              </Link>
            </div>
            {(formError || errorMsg) && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {formError || errorMsg}
              </p>
            )}
            <button
              disabled={submitting || authLoading}
              className="h-12 w-full rounded-xl bg-indigo-600 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="mt-7 text-center text-sm text-slate-500">
            Don’t have an account?{" "}
            <Link href="/register" className="font-extrabold text-indigo-600">
              Create account
            </Link>
          </p>
          <div className="mt-8 flex justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="size-4" /> Your workspace, your control
          </div>
        </div>
      </section>
    </main>
  );
}
