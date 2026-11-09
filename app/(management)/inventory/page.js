"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Search,
  Package,
  AlertTriangle,
  CircleCheck,
  TrendingDown,
  SlidersHorizontal,
  ArrowDownToLine,
  RefreshCw,
  History,
  Plus,
  Minus,
  X,
} from "lucide-react";

const API = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://resturent-retail-pos-system.vercel.app/api/v1"
).replace(/\/$/, "");
const money = (n) =>
  `৳ ${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const labels = {
  purchase: "Purchase",
  sale: "Sale",
  adjustment_in: "Adjustment In",
  adjustment_out: "Adjustment Out",
  return: "Return",
  supplier_return: "Supplier Return",
};
function token() {
  try {
    return JSON.parse(localStorage.getItem("authTokens") || "{}").access || "";
  } catch {
    return "";
  }
}
async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token() ? { Authorization: `JWT ${token()}` } : {}),
      ...options.headers,
    },
  });
  const data = (res.headers.get("content-type") || "").includes(
    "application/json",
  )
    ? await res.json()
    : await res.text();
  if (!res.ok)
    throw new Error(
      typeof data === "string"
        ? data
        : data.detail ||
            Object.entries(data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ") ||
            `HTTP ${res.status}`,
    );
  return data;
}
const list = (d) =>
  Array.isArray(d) ? d : Array.isArray(d?.results) ? d.results : [];
function Status({ p }) {
  const cls =
    p.stock === 0
      ? "bg-rose-500/10 text-rose-600"
      : p.stock <= p.threshold
        ? "bg-amber-500/10 text-amber-600"
        : "bg-emerald-500/10 text-emerald-600";
  const label =
    p.stock === 0
      ? "Out of stock"
      : p.stock <= p.threshold
        ? "Low stock"
        : "In stock";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}
export default function InventoryPage() {
  const [products, setProducts] = useState([]),
    [moves, setMoves] = useState([]),
    [summary, setSummary] = useState({});
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("All"),
    [status, setStatus] = useState("All");
  const [moveType, setMoveType] = useState("All"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [modal, setModal] = useState(null),
    [kind, setKind] = useState("adjustment_in"),
    [qty, setQty] = useState("1"),
    [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ps, ms, sm] = await Promise.all([
        request("/products/"),
        request("/inventory/"),
        request("/inventory/summary/"),
      ]);
      setProducts(
        list(ps).map((p) => ({
          id: p.id,
          name: p.name || "Unnamed",
          sku: p.sku || "—",
          barcode: p.barcode || "",
          category:
            typeof p.category === "object"
              ? p.category?.name
              : p.category_name || p.category || "—",
          stock: Number(p.stock || 0),
          threshold: Number(p.low_stock_threshold ?? p.threshold ?? 0),
          cost: Number(p.cost_price || 0),
          price: Number(p.selling_price || 0),
        })),
      );
      setMoves(list(ms));
      setSummary(sm || {});
    } catch (e) {
      setError(e.message || "Could not load inventory.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(
    () => [
      "All",
      ...new Set(products.map((p) => p.category).filter((x) => x && x !== "—")),
    ],
    [products],
  );
  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const q = `${p.name} ${p.sku} ${p.barcode} ${p.category}`.toLowerCase();
        return (
          q.includes(query.toLowerCase()) &&
          (category === "All" || p.category === category) &&
          (status === "All" ||
            (status === "Low stock" && p.stock > 0 && p.stock <= p.threshold) ||
            (status === "Out of stock" && p.stock === 0) ||
            (status === "In stock" && p.stock > p.threshold))
        );
      }),
    [products, query, category, status],
  );
  const filteredMoves = useMemo(
    () =>
      moves.filter((m) => {
        const d = m.created_at ? new Date(m.created_at) : null,
          day = d && !isNaN(d) ? d.toISOString().slice(0, 10) : "";
        const p = m.product_name || m.product?.name || "",
          sku = m.product_sku || m.product?.sku || "";
        return (
          `${p} ${sku} ${m.note || ""}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (moveType === "All" || m.movement_type === moveType) &&
          (!from || day >= from) &&
          (!to || day <= to)
        );
      }),
    [moves, query, moveType, from, to],
  );
  const totalProducts = Number(summary.total_products ?? products.length),
    units = Number(
      summary.total_stock_units ?? products.reduce((s, p) => s + p.stock, 0),
    );
  const low = Number(
      summary.low_stock_products ??
        products.filter((p) => p.stock > 0 && p.stock <= p.threshold).length,
    ),
    empty = Number(
      summary.out_of_stock_products ??
        products.filter((p) => p.stock === 0).length,
    );
  const value = Number(
    summary.inventory_cost_value ??
      products.reduce((s, p) => s + p.stock * p.cost, 0),
  );

  async function adjust(e) {
    e.preventDefault();
    const n = Number(qty);
    if (!Number.isInteger(n) || n < 1) {
      setError("Quantity must be a positive whole number.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await request("/inventory/adjust-stock/", {
        method: "POST",
        body: JSON.stringify({
          product: modal.id,
          movement_type: kind,
          quantity: n,
          note,
        }),
      });
      setModal(null);
      setQty("1");
      setNote("");
      setNotice("Stock adjustment saved.");
      await load();
    } catch (err) {
      setError(err.message || "Adjustment failed.");
    } finally {
      setSaving(false);
    }
  }
  function csv() {
    const rows = [
      [
        "Product",
        "SKU",
        "Category",
        "Stock",
        "Low Stock Threshold",
        "Cost Price",
        "Selling Price",
      ],
      ...filtered.map((p) => [
        p.name,
        p.sku,
        p.category,
        p.stock,
        p.threshold,
        p.cost,
        p.price,
      ]),
    ];
    const blob = new Blob(
      [
        "\uFEFF" +
          rows
            .map((r) =>
              r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
            )
            .join("\n"),
      ],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "inventory.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  const cards = [
    [
      "Total Products",
      totalProducts,
      "Products in inventory",
      Package,
      "bg-primary/10 text-primary",
    ],
    [
      "Total Stock Units",
      units,
      "Units currently available",
      Boxes,
      "bg-blue-500/10 text-blue-600",
    ],
    [
      "Low Stock Items",
      low,
      "At or below threshold",
      AlertTriangle,
      "bg-amber-500/10 text-amber-600",
    ],
    [
      "Out of Stock",
      empty,
      "Products with zero stock",
      TrendingDown,
      "bg-rose-500/10 text-rose-600",
    ],
  ];
  return (
    <div className="space-y-6 p-5 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-primary">
            <Boxes className="size-4" />
            <span className="font-medium">Stock management</span>
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Inventory
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor stock levels and identify products that need replenishment.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm hover:bg-muted"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={csv}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm hover:bg-muted"
          >
            <ArrowDownToLine className="size-4" />
            Export CSV
          </button>
        </div>
      </div>
      {error && (
        <div
          role="alert"
          className="flex justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700"
        >
          {error}
          <button onClick={() => setError("")}>
            <X className="size-4" />
          </button>
        </div>
      )}
      {notice && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700">
          {notice}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, v, detail, Icon, style]) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-3 text-2xl font-semibold">
                  {loading ? "—" : Number(v).toLocaleString()}
                </p>
              </div>
              <div
                className={`flex size-10 items-center justify-center rounded-xl ${style}`}
              >
                <Icon className="size-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Inventory value</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Estimated value at product cost price
              </p>
            </div>
            <CircleCheck className="size-6 text-emerald-600" />
          </div>
          <p className="mt-4 text-3xl font-semibold">
            {loading ? "—" : money(value)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Based on current stock and cost price.
          </p>
        </section>
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-600" />
            <h3 className="font-semibold">Needs attention</h3>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {low + empty} products need a stock review.
          </p>
          <button
            onClick={() => setStatus("Low stock")}
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            Review low stock items →
          </button>
        </section>
      </div>
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <div className="flex justify-between gap-3">
            <div>
              <h3 className="font-semibold">Stock overview</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Search products, filter categories and review stock status.
              </p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs">
              {filtered.length} products
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, SKU or barcode..."
                className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
            >
              {["All", "In stock", "Low stock", "Out of stock"].map((s) => (
                <option key={s}>
                  {s === "All" ? "All stock statuses" : s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-212.5 text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                {[
                  "Product",
                  "Category",
                  "Stock level",
                  "Cost price",
                  "Selling price",
                  "Status",
                  "Adjust",
                ].map((x) => (
                  <th key={x} className="px-5 py-4 font-medium">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center">
                    Loading inventory...
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-border hover:bg-muted/30"
                  >
                    <td className="px-5 py-4">
                      <b>{p.name}</b>
                      <div className="mt-1 text-xs text-muted-foreground">
                        SKU: {p.sku}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {p.category}
                    </td>
                    <td className="px-5 py-4">
                      <b>{p.stock} units</b>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Threshold: {p.threshold}
                      </div>
                      <div className="mt-2 h-1.5 w-28 rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${p.stock <= p.threshold ? "bg-amber-500" : "bg-primary"}`}
                          style={{
                            width: `${Math.min(100, (p.stock / Math.max(p.threshold * 4, 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4">{money(p.cost)}</td>
                    <td className="px-5 py-4 font-medium">{money(p.price)}</td>
                    <td className="px-5 py-4">
                      <Status p={p} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1">
                        <button
                          title="Decrease stock"
                          disabled={!p.stock}
                          onClick={() => {
                            setModal(p);
                            setKind("adjustment_out");
                            setQty("1");
                          }}
                          className="flex size-8 items-center justify-center rounded-md border border-border disabled:opacity-40"
                        >
                          <Minus className="size-4" />
                        </button>
                        <button
                          title="Increase stock"
                          onClick={() => {
                            setModal(p);
                            setKind("adjustment_in");
                            setQty("1");
                          }}
                          className="flex size-8 items-center justify-center rounded-md border border-border"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && !filtered.length && (
            <div className="p-10 text-center">
              <SlidersHorizontal className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No products found</p>
            </div>
          )}
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <div className="flex items-center gap-2">
            <History className="size-5 text-primary" />
            <h3 className="font-semibold">Stock movement history</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Purchases, sales, returns and manual adjustments.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={moveType}
              onChange={(e) => setMoveType(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="All">All movement types</option>
              {Object.entries(labels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            />
            <button
              onClick={() => {
                setMoveType("All");
                setFrom("");
                setTo("");
              }}
              className="rounded-lg border border-border px-3 text-sm"
            >
              Clear filters
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-162.5 text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                {["Date", "Product", "Type", "Quantity", "Note"].map((x) => (
                  <th key={x} className="px-5 py-4 font-medium">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center">
                    Loading movements...
                  </td>
                </tr>
              ) : (
                filteredMoves.map((m) => (
                  <tr key={m.id} className="border-t border-border">
                    <td className="whitespace-nowrap px-5 py-3">
                      {m.created_at
                        ? new Date(m.created_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      {m.product_name ||
                        m.product?.name ||
                        `Product #${m.product}`}
                    </td>
                    <td className="px-5 py-3">
                      {labels[m.movement_type] || m.movement_type}
                    </td>
                    <td className="px-5 py-3">{m.quantity}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {m.note || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && !filteredMoves.length && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No stock movements found.
            </p>
          )}
        </div>
      </section>
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <form
            onSubmit={adjust}
            className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold">Adjust stock</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {modal.name} · Current: {modal.stock}
                </p>
              </div>
              <button type="button" onClick={() => setModal(null)}>
                <X className="size-5" />
              </button>
            </div>
            <label className="block space-y-1 text-sm font-medium">
              Adjustment type
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background px-3"
              >
                <option value="adjustment_in">Increase stock</option>
                <option value="adjustment_out">Decrease stock</option>
              </select>
            </label>
            <label className="block space-y-1 text-sm font-medium">
              Quantity
              <input
                type="number"
                min="1"
                step="1"
                required
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background px-3"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              Note (optional)
              <textarea
                rows="3"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save adjustment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
