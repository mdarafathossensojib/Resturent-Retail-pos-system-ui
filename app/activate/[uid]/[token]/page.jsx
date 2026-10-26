
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, LoaderCircle } from "lucide-react";
import apiClient from "@/services/apiClient";

export default function ActivateAccountPage() {
  const { uid, token } = useParams();
  const router = useRouter();

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your activation link...");

  useEffect(() => {
    let active = true;

    async function activate() {
      try {
        await apiClient.post("/auth/users/activation/", {
          uid,
          token,
        });

        if (!active) return;

        setStatus("success");
        setMessage("Your account has been activated successfully.");
      } catch (err) {
        if (!active) return;

        setStatus("error");
        setMessage(
          err?.response?.data?.detail ||
          "This activation link is invalid or expired. Request a new activation email."
        );
      }
    }

    if (uid && token) activate();

    return () => {
      active = false;
    };
  }, [uid, token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <section className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        {status === "loading" && (
          <LoaderCircle className="mx-auto size-12 animate-spin text-indigo-600" />
        )}

        {status === "success" && (
          <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        )}

        {status === "error" && (
          <XCircle className="mx-auto size-12 text-red-600" />
        )}

        <h1 className="mt-5 text-2xl font-black text-slate-900">
          {status === "loading"
            ? "Activating account"
            : status === "success"
              ? "Account activated"
              : "Activation failed"}
        </h1>

        <p role={status === "error" ? "alert" : "status"} className="mt-3 text-sm leading-6 text-slate-600">
          {message}
        </p>

        {status === "success" && (
          <button
            onClick={() => router.replace("/login")}
            className="mt-6 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700"
          >
            Continue to login
          </button>
        )}

        {status === "error" && (
          <Link
            href="/activation-notice"
            className="mt-6 inline-block text-sm font-bold text-indigo-600"
          >
            Go to activation help
          </Link>
        )}
      </section>
    </main>
  );
}
