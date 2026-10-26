"use client";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowRight,
  ShoppingCart,
  Boxes,
  Users,
  ChartNoAxesCombined,
  Package,
  CreditCard,
  Zap,
  Check,
} from "lucide-react";
const stats = [
  ["Total sales", "৳48,590", "+12.8%", CreditCard],
  ["Orders today", "128", "+8.2%", ShoppingCart],
  ["Products", "256", "+4 new", Package],
  ["Customers", "1,204", "+18 this week", Users],
];
export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-600 text-white">
            <ShoppingBag />
          </span>
          <span className="text-lg font-black">
            RetailFlow
            <span className="block text-[10px] tracking-[.18em] text-slate-500">
              SMART RETAIL MANAGEMENT
            </span>
          </span>
        </Link>
        <nav className="hidden gap-7 text-sm font-semibold text-slate-600 md:flex">
          <a href="#features">Features</a>
          <a href="#preview">Preview</a>
        </nav>
        <div className="flex gap-2">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-white"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white"
          >
            Get started <ArrowRight className="ml-1 inline size-4" />
          </Link>
        </div>
      </header>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div>
          <span className="rounded-full border border-indigo-100 bg-white px-3 py-2 text-xs font-bold text-indigo-700">
            <Zap className="mr-1 inline size-3.5" /> SIMPLE. SMART. IN CONTROL.
          </span>
          <h1 className="mt-7 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            Run your retail business{" "}
            <span className="text-indigo-600">with confidence.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            One clear workspace for sales, products, inventory, customers and
            business insights. Spend less time managing and more time growing.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-indigo-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-indigo-200"
            >
              Create your workspace{" "}
              <ArrowRight className="ml-2 inline size-4" />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border bg-white px-6 py-3.5 font-bold"
            >
              Sign in to dashboard
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-4 text-sm text-slate-500">
            {["Easy to use", "Inventory visibility", "Actionable reports"].map(
              (x) => (
                <span key={x}>
                  <Check className="mr-1 inline size-4 text-emerald-500" />
                  {x}
                </span>
              ),
            )}
          </div>
        </div>
        <div
          id="preview"
          className="relative rounded-3xl border border-white bg-white p-5 shadow-2xl shadow-indigo-100"
        >
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Workspace preview
              </p>
              <h2 className="mt-1 text-xl font-black">Business overview</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              ● Sample data
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {stats.map(([label, value, change, Icon]) => (
              <div key={label} className="rounded-2xl border bg-slate-50 p-4">
                <div className="flex justify-between text-slate-500">
                  <span className="text-xs">{label}</span>
                  <Icon className="size-4 text-indigo-600" />
                </div>
                <p className="mt-3 text-2xl font-black">{value}</p>
                <p className="mt-1 text-xs font-bold text-emerald-600">
                  {change}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border p-4">
            <p className="font-bold">Sales performance</p>
            <p className="mt-1 text-xs text-slate-400">
              Weekly overview · Illustrative
            </p>
            <div className="mt-5 flex h-32 items-end gap-3">
              {[42, 65, 49, 82, 59, 95, 72].map((h, i) => (
                <div
                  key={i}
                  className="flex h-full flex-1 flex-col justify-end gap-2"
                >
                  <div
                    style={{ height: h + "%" }}
                    className={
                      "rounded-t-lg " +
                      (i === 5 ? "bg-indigo-600" : "bg-indigo-100")
                    }
                  />
                  <span className="text-center text-[10px] text-slate-400">
                    {"MTWTFSS"[i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section id="features" className="border-y bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[.2em] text-indigo-600">
              Everything in one place
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              A better way to run your store
            </h2>
            <p className="mt-3 text-slate-500">
              Tools that keep daily operations organized and decisions informed.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                ShoppingCart,
                "Point of sale",
                "A streamlined checkout flow for everyday sales.",
              ],
              [
                Boxes,
                "Inventory control",
                "Keep stock levels visible and spot low-stock items.",
              ],
              [
                Users,
                "Customer records",
                "Keep customer details and purchase history together.",
              ],
              [
                ChartNoAxesCombined,
                "Business reports",
                "Understand sales trends and product performance.",
              ],
            ].map(([Icon, title, desc]) => (
              <div
                key={title}
                className="rounded-2xl border p-5 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon />
                </span>
                <h3 className="mt-4 font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="px-5 py-14">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 rounded-3xl bg-indigo-600 p-8 text-white sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="text-2xl font-black sm:text-3xl">
              Ready to bring it all together?
            </h2>
            <p className="mt-2 text-sm text-indigo-100">
              Build a clearer view of your retail operations.
            </p>
          </div>
          <Link
            href="/register"
            className="rounded-xl bg-white px-5 py-3 font-black text-indigo-700"
          >
            Get started <ArrowRight className="ml-1 inline size-4" />
          </Link>
        </div>
      </section>
      <footer className="border-t bg-white px-5 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} RetailFlow POS · UI preview with sample
        data
      </footer>
    </main>
  );
}
