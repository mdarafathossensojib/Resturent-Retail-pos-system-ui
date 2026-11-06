"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CreditCard,
  DollarSign,
  Package,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://resturent-retail-pos-system.vercel.app/api/v1"
).replace(/\/$/, "");

const PERIODS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const number = (value) => Number(value || 0).toLocaleString("en-BD");

const dateLabel = (value, period) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  if (period === "yearly") return date.toLocaleDateString("en", { year: "numeric" });
  if (period === "monthly") return date.toLocaleDateString("en", { month: "short", year: "2-digit" });
  if (period === "weekly") return date.toLocaleDateString("en", { day: "numeric", month: "short" });
  return date.toLocaleDateString("en", { day: "numeric", month: "short" });
};

const getToken = () => {
  try {
    return JSON.parse(localStorage.getItem("authTokens") || "{}").access;
  } catch {
    return null;
  }
};

const getErrorMessage = (data, fallback) => {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  return Object.entries(data)
    .map(([key, value]) => {
      const message = Array.isArray(value)
        ? value.map((item) => typeof item === "string" ? item : JSON.stringify(item)).join(", ")
        : typeof value === "object" && value !== null
          ? JSON.stringify(value)
          : String(value);
      return `${key}: ${message}`;
    })
    .join(" | ") || fallback;
};

function StatCard({ label, value, icon: Icon, helper, tone = "primary" }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    green: "bg-emerald-500/10 text-emerald-600",
    blue: "bg-sky-500/10 text-sky-600",
    amber: "bg-amber-500/10 text-amber-600",
    rose: "bg-rose-500/10 text-rose-600",
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={`flex size-10 items-center justify-center rounded-xl ${tones[tone] || tones.primary}`}>
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-3 wrap-break-word text-2xl font-semibold tracking-tight">{value}</p>
      {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

function Section({ title, description, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-5 ${className}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ message = "No report data available for this period." }) {
  return (
    <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function BarChart({ rows, period }) {
  const max = Math.max(...rows.map((row) => Number(row.sales_amount || 0)), 0);
  if (!rows.length) return <EmptyState />;

  return (
    <div>
      <div className="flex h-60 items-end gap-2 overflow-x-auto border-b border-l border-border px-3 pb-0 pt-4 sm:gap-3">
        {rows.map((row, index) => {
          const amount = Number(row.sales_amount || 0);
          const height = max > 0 ? Math.max((amount / max) * 100, 3) : 3;
          return (
            <div key={`${row.period_start}-${index}`} className="group flex h-full min-w-5 flex-1 flex-col justify-end">
              <div className="relative mb-1 hidden text-center text-[10px] text-muted-foreground group-hover:block">
                {money(amount)}
              </div>
              <div
                title={`${dateLabel(row.period_start, period)}: ${money(amount)}`}
                className="w-full rounded-t-md bg-primary/25 transition-colors group-hover:bg-primary"
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between gap-2 overflow-hidden text-[10px] text-muted-foreground">
        {rows.map((row, index) => (
          <span key={`${row.period_start}-label-${index}`} className="min-w-0 flex-1 truncate text-center">
            {dateLabel(row.period_start, period)}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    in_stock: "bg-emerald-500/10 text-emerald-600",
    low_stock: "bg-amber-500/10 text-amber-600",
    out_of_stock: "bg-rose-500/10 text-rose-600",
  };
  const labels = {
    in_stock: "In stock",
    low_stock: "Low stock",
    out_of_stock: "Out of stock",
  };
  return (
    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] || "bg-muted text-muted-foreground"}`}>
      {labels[status] || status || "—"}
    </span>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("monthly");
  const [overview, setOverview] = useState(null);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [payments, setPayments] = useState([]);
  const [purchases, setPurchases] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const apiRequest = useCallback(async (endpoint) => {
    const token = getToken();
    if (!token) throw new Error("Authentication token not found. Please sign in again.");

    const response = await fetch(`${API_BASE}/${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `JWT ${token}`,
      },
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(data, `Request failed (${response.status})`));
    }
    return data;
  }, []);

  const loadReports = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    const query = `period=${period}`;
    const requests = await Promise.allSettled([
      apiRequest("reports/overview/"),
      apiRequest(`reports/sales/?${query}`),
      apiRequest(`reports/products/?${query}`),
      apiRequest(`reports/products/top-selling/?${query}`),
      apiRequest("reports/inventory/"),
      apiRequest(`reports/payments/?${query}`),
      apiRequest(`reports/purchases/?${query}`),
      apiRequest(`reports/stock-movements/?${query}`),
    ]);

    const setters = [
      setOverview,
      (data) => setSales(data.results || []),
      (data) => setProducts(data.results || []),
      (data) => setTopProducts(data.results || []),
      setInventory,
      (data) => setPayments(data.results || []),
      setPurchases,
      (data) => setMovements(data.results || []),
    ];

    const failures = [];
    requests.forEach((result, index) => {
      if (result.status === "fulfilled") setters[index](result.value);
      else failures.push(result.reason?.message || "A report could not be loaded.");
    });

    if (failures.length) {
      setError(failures.length === requests.length
        ? failures[0]
        : `${failures.length} report section(s) could not be loaded. Check API permissions and try refreshing.`);
    }

    setLoading(false);
    setRefreshing(false);
  }, [apiRequest, period]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const selectedOverview = overview?.this_month || overview?.this_week || {};
  const lowStockProducts = useMemo(
    () => (inventory?.results || []).filter((item) => item.stock_status !== "in_stock"),
    [inventory]
  );
  const totalPaymentAmount = useMemo(
    () => payments.reduce((sum, item) => sum + Number(item.total_amount || 0), 0),
    [payments]
  );
  const totalUnitsSold = useMemo(
    () => products.reduce((sum, item) => sum + Number(item.quantity_sold || 0), 0),
    [products]
  );

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor sales, purchases, payments and inventory performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            {PERIODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <button
            type="button"
            onClick={() => loadReports(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl border border-border bg-muted/50" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Sales Revenue (This Month)" value={money(overview?.this_month?.sales_amount)} icon={DollarSign} tone="green" helper={`${number(overview?.this_month?.invoice_count)} completed invoices`} />
            <StatCard label="Today's Revenue" value={money(overview?.today?.sales_amount)} icon={TrendingUp} tone="blue" helper={`${number(overview?.today?.invoice_count)} invoices today`} />
            <StatCard label="Purchase Amount" value={money(purchases?.purchase_amount)} icon={ShoppingCart} tone="amber" helper={`${number(purchases?.purchase_count)} purchases in selected period`} />
            <StatCard label="Remaining Due" value={money(selectedOverview.remaining_due)} icon={Wallet} tone="rose" helper="Current month outstanding balance" />
            <StatCard label="Paid Amount" value={money(selectedOverview.paid_total)} icon={CreditCard} tone="green" helper="Payments received this month" />
            <StatCard label="Net Purchases" value={money(purchases?.net_purchase_amount)} icon={ShoppingBag} tone="blue" helper={`${number(purchases?.supplier_return_count)} supplier returns`} />
            <StatCard label="Total Products" value={number(inventory?.total_products)} icon={Package} tone="primary" helper={`${number(inventory?.out_of_stock)} out of stock`} />
            <StatCard label="Low Stock Items" value={number(inventory?.low_stock)} icon={Boxes} tone="amber" helper="Products at or below threshold" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <Section
              title="Sales overview"
              description={`Sales revenue grouped by ${period} period.`}
              action={<span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{number(sales.length)} data points</span>}
            >
              <BarChart rows={sales} period={period} />
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-3">
                <div><p className="text-xs text-muted-foreground">Selected period sales</p><p className="mt-1 font-semibold">{money(sales.reduce((sum, item) => sum + Number(item.sales_amount || 0), 0))}</p></div>
                <div><p className="text-xs text-muted-foreground">Invoices</p><p className="mt-1 font-semibold">{number(sales.reduce((sum, item) => sum + Number(item.invoice_count || 0), 0))}</p></div>
                <div><p className="text-xs text-muted-foreground">Units sold</p><p className="mt-1 font-semibold">{number(totalUnitsSold)}</p></div>
              </div>
            </Section>

            <Section title="Purchase summary" description="Purchases and supplier returns for the selected period.">
              {purchases ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground">Net purchase amount</p>
                    <p className="mt-1 text-2xl font-semibold">{money(purchases.net_purchase_amount)}</p>
                  </div>
                  {[
                    ["Purchase amount", purchases.purchase_amount],
                    ["Supplier return amount", purchases.supplier_return_amount],
                    ["Purchase count", number(purchases.purchase_count)],
                    ["Supplier return count", number(purchases.supplier_return_count)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{typeof value === "number" && label.toLowerCase().includes("count") ? value : label.toLowerCase().includes("count") ? value : money(value)}</span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState />}
            </Section>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Section title="Top selling products" description="Top 10 products by quantity sold.">
              {topProducts.length ? (
                <div className="space-y-4">
                  {topProducts.slice(0, 10).map((product, index) => {
                    const max = Math.max(...topProducts.map((item) => Number(item.quantity_sold || 0)), 1);
                    const width = (Number(product.quantity_sold || 0) / max) * 100;
                    return (
                      <div key={product.product_id}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                          <div className="min-w-0">
                            <span className="mr-2 text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                            <span className="font-medium">{product.product_name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{product.sku}</span>
                          </div>
                          <span className="shrink-0 font-semibold">{number(product.quantity_sold)} units</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
                        </div>
                        <p className="mt-1 text-right text-xs text-muted-foreground">{money(product.sales_amount)}</p>
                      </div>
                    );
                  })}
                </div>
              ) : <EmptyState />}
            </Section>

            <Section title="Payment methods" description="Payment collection by method for the selected period.">
              {payments.length ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground">Total payments received</p>
                    <p className="mt-1 text-2xl font-semibold">{money(totalPaymentAmount)}</p>
                  </div>
                  {payments.map((item) => {
                    const percent = totalPaymentAmount > 0 ? (Number(item.total_amount || 0) / totalPaymentAmount) * 100 : 0;
                    return (
                      <div key={item.method}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium capitalize">{String(item.method).replaceAll("_", " ")}</span>
                          <span className="font-semibold">{money(item.total_amount)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{number(item.payment_count)} payments · {percent.toFixed(1)}%</p>
                      </div>
                    );
                  })}
                </div>
              ) : <EmptyState />}
            </Section>
          </div>

          <Section title="Inventory status" description="Products that need stock attention.">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-emerald-500/10 p-3"><p className="text-xs text-emerald-700 dark:text-emerald-400">In stock</p><p className="mt-1 text-xl font-semibold">{number(Math.max(0, (inventory?.total_products || 0) - (inventory?.low_stock || 0) - (inventory?.out_of_stock || 0)))}</p></div>
              <div className="rounded-xl bg-amber-500/10 p-3"><p className="text-xs text-amber-700 dark:text-amber-400">Low stock</p><p className="mt-1 text-xl font-semibold">{number(inventory?.low_stock)}</p></div>
              <div className="rounded-xl bg-rose-500/10 p-3"><p className="text-xs text-rose-700 dark:text-rose-400">Out of stock</p><p className="mt-1 text-xl font-semibold">{number(inventory?.out_of_stock)}</p></div>
            </div>
            {lowStockProducts.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-162.5 text-left text-sm">
                  <thead><tr className="border-b border-border text-xs text-muted-foreground"><th className="pb-3 pr-4 font-medium">Product</th><th className="pb-3 pr-4 font-medium">SKU</th><th className="pb-3 pr-4 font-medium">Category</th><th className="pb-3 pr-4 font-medium">Stock</th><th className="pb-3 font-medium">Status</th></tr></thead>
                  <tbody>
                    {lowStockProducts.slice(0, 10).map((item) => (
                      <tr key={item.product_id} className="border-b border-border last:border-0">
                        <td className="py-3 pr-4 font-medium">{item.product_name}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{item.sku}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{item.category_name || "—"}</td>
                        <td className="py-3 pr-4 font-semibold">{number(item.stock)} / {number(item.low_stock_threshold)}</td>
                        <td className="py-3"><StatusBadge status={item.stock_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState message="No low-stock or out-of-stock products. Great!" />}
          </Section>

          <div className="grid gap-6 xl:grid-cols-2">
            <Section title="Product performance" description="Sales quantity and revenue by product.">
              {products.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-140 text-left text-sm">
                    <thead><tr className="border-b border-border text-xs text-muted-foreground"><th className="pb-3 pr-3 font-medium">Product</th><th className="pb-3 pr-3 font-medium">Qty sold</th><th className="pb-3 pr-3 font-medium">Invoices</th><th className="pb-3 font-medium text-right">Sales</th></tr></thead>
                    <tbody>
                      {products.slice(0, 8).map((item) => (
                        <tr key={item.product_id} className="border-b border-border last:border-0">
                          <td className="py-3 pr-3"><p className="font-medium">{item.product_name}</p><p className="text-xs text-muted-foreground">{item.sku}</p></td>
                          <td className="py-3 pr-3">{number(item.quantity_sold)}</td>
                          <td className="py-3 pr-3">{number(item.invoice_count)}</td>
                          <td className="py-3 text-right font-medium">{money(item.sales_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyState />}
            </Section>

            <Section title="Stock movements" description="Inventory movement totals for the selected period.">
              {movements.length ? (
                <div className="space-y-3">
                  {movements.map((item) => (
                    <div key={item.movement_type} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Activity className="size-4" /></span>
                        <div className="min-w-0"><p className="truncate text-sm font-medium capitalize">{String(item.movement_type).replaceAll("_", " ")}</p><p className="text-xs text-muted-foreground">{number(item.movement_count)} movements</p></div>
                      </div>
                      <p className="shrink-0 text-sm font-semibold">{number(item.total_quantity)} units</p>
                    </div>
                  ))}
                </div>
              ) : <EmptyState />}
            </Section>
          </div>
        </>
      )}
    </div>
  );
}
