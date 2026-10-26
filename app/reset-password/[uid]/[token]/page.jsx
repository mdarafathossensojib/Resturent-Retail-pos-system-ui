
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShoppingBag } from "lucide-react";
import apiClient from "@/services/apiClient";

export default function ResetPasswordPage() {
  const { uid, token } = useParams();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      await apiClient.post("/auth/users/reset_password_confirm/", {
        uid,
        token,
        new_password: password,
        re_new_password: confirmPassword,
      });

      setSuccessMsg("Password updated successfully. Redirecting to login...");

      setTimeout(() => {
        router.replace("/login");
      }, 1800);
    } catch (error) {
      const data = error.response?.data;
      const message =
        data?.detail ||
        data?.token?.[0] ||
        data?.uid?.[0] ||
        data?.new_password?.[0] ||
        data?.re_new_password?.[0] ||
        "Password reset failed. The link may have expired or already been used.";

      setErrorMsg(
        typeof message === "string" ? message : "Please check your password and try again."
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

        <h1 className="mt-6 text-3xl font-black text-slate-900">
          Set New Password
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Enter your new password and confirm it below.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-800">
              New password
            </span>
            <span className="relative block">
              <LockKeyhole className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-black outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle new password visibility"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-800">
              Confirm password
            </span>
            <span className="relative block">
              <LockKeyhole className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm text-black outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label="Toggle confirmation password visibility"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </span>
          </label>

          {errorMsg && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMsg}
            </p>
          )}

          {successMsg && (
            <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {successMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-indigo-600 text-sm font-extrabold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </main>
  );
}
