
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShoppingBag,
  Store,
  UserRound,
  CheckCircle2,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function RegisterPage() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const { registerUser } = useAuth();
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();

    setError("");
    setNotice("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const fullName = formData.get("full_name").trim();
    const nameParts = fullName.split(/\s+/);

    const firstName = nameParts.shift();
    const lastName = nameParts.join(" ");

    const email = formData.get("email").trim();
    const password = formData.get("password");

    try {
      const response = await registerUser({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      });

      if (response?.success === false) {
        setError(response.message || "Registration failed.");
        return;
      }

      router.replace(
          `/activation-notice?email=${encodeURIComponent(email)}`
        );
    } catch (err) {
      const data = err?.response?.data;

      if (data && typeof data === "object") {
        const messages = Object.entries(data).map(([field, value]) => {
          const message = Array.isArray(value)
            ? value.join(" ")
            : typeof value === "string"
              ? value
              : JSON.stringify(value);

          return `${field}: ${message}`;
        });

        setError(messages.join(" "));
      } else {
        setError(
          err?.message || "Registration failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      {/* Left panel */}
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
            START WITH CLARITY
          </span>

          <h1 className="mt-7 text-5xl font-black leading-tight xl:text-6xl">
            Make room for <span className="text-indigo-300">growth.</span>
          </h1>

          <p className="mt-5 leading-7 text-slate-300">
            Bring your store operations together with a workspace designed
            to keep things clear, organized and moving forward.
          </p>

          <div className="mt-8 space-y-4 text-sm text-slate-200">
            {[
              "Products and stock in one place",
              "Sales and customer records",
              "Helpful business summaries",
            ].map((item) => (
              <p key={item}>
                <CheckCircle2 className="mr-2 inline size-5 text-emerald-300" />
                {item}
              </p>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-400">
          Your next chapter starts here.
        </p>
      </section>

      {/* Registration form */}
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>

          <div className="mt-7 flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 lg:hidden">
            <ShoppingBag />
          </div>

          <p className="mt-7 text-xs font-black uppercase tracking-[.2em] text-indigo-600">
            Get started
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight">
            Create your account
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Set up your details to prepare your retail workspace.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {/* Full name */}
            <label className="block">
              <span className="mb-2 block text-sm font-bold">
                Full name
              </span>

              <span className="relative block">
                <UserRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                <input
                  name="full_name"
                  required
                  minLength={2}
                  autoComplete="name"
                  placeholder="Your full name"
                  className="h-11 w-full rounded-xl border bg-slate-50 pl-11 pr-4 text-sm text-black outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </span>
            </label>

            {/* Store name */}
            <label className="block">
              <span className="mb-2 block text-sm font-bold">
                Store name{" "}
                <span className="font-normal text-slate-400">
                  (optional)
                </span>
              </span>

              <span className="relative block">
                <Store className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                <input
                  name="store_name"
                  autoComplete="organization"
                  placeholder="Your store name"
                  className="h-11 w-full rounded-xl border bg-slate-50 pl-11 pr-4 text-sm text-black outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </span>
            </label>

            {/* Email */}
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
                  className="h-11 w-full rounded-xl border bg-slate-50 pl-11 pr-4 text-sm text-black outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </span>
            </label>

            {/* Password */}
            <label className="block">
              <span className="mb-2 block text-sm font-bold">
                Password
              </span>

              <span className="relative block">
                <LockKeyhole className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                <input
                  name="password"
                  required
                  minLength={8}
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="h-11 w-full rounded-xl border bg-slate-50 pl-11 pr-12 text-sm text-black outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />

                <button
                  type="button"
                  onClick={() => setShow((value) => !value)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </span>
            </label>

            {/* API error */}
            {error && (
              <div
                role="alert"
                className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p className="wrap-break-word">{error}</p>
              </div>
            )}

            {/* Success message */}
            {notice && (
              <p
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
              >
                {notice}
              </p>
            )}

            <button
              disabled={loading}
              type="submit"
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <LoaderCircle className="size-4 animate-spin" />}
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-extrabold text-indigo-600">
              Sign in
            </Link>
          </p>

          <p className="mt-5 text-center text-[11px] text-slate-400">
            Your account details will be sent securely to the registration API.
          </p>
        </div>
      </section>
    </main>
  );
}
