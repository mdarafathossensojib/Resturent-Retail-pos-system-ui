"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  Search,
  ShoppingCart,
  Banknote,
  CheckCircle,
  RotateCcw,
  Eye,
  Receipt,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://resturent-retail-pos-system.vercel.app/api/v1"
).replace(/\/$/, "");

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function getAccessToken() {
  if (typeof window === "undefined") return null;

  try {
    const tokens = JSON.parse(
      localStorage.getItem("authTokens") || "{}"
    );

    return tokens.access || null;
  } catch {
    return null;
  }
}

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function getRelatedName(value, fallback = "Walk-in Customer") {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value.name || value.full_name || value.email || fallback;
}

function getPaymentLabel(method) {
  const labels = {
    cash: "Cash",
    card: "Card",
    mobile_banking: "Mobile Banking",
    mixed: "Mixed",
  };

  return labels[method] || method || "—";
}

function getErrorMessage(data) {
  if (!data) return "Something went wrong.";

  if (typeof data === "string") return data;
  if (data.detail) return data.detail;

  if (data.non_field_errors) {
    return data.non_field_errors.join(", ");
  }

  return Object.entries(data)
    .map(([key, value]) => {
      const message = Array.isArray(value)
        ? value.join(", ")
        : typeof value === "object"
          ? JSON.stringify(value)
          : value;

      return `${key}: ${message}`;
    })
    .join(" | ");
}

function StatusBadge({ status }) {
  const refunded = status === "refunded";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${
        refunded
          ? "bg-rose-500/10 text-rose-600"
          : "bg-emerald-500/10 text-emerald-600"
      }`}
    >
      {refunded ? (
        <RotateCcw className="size-3" />
      ) : (
        <CheckCircle className="size-3" />
      )}
      {refunded ? "Refunded" : status || "Unknown"}
    </span>
  );
}

function PaymentBadge({ method }) {
  return (
    <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
      {getPaymentLabel(method)}
    </span>
  );
}

export default function SalesPage() {
  const router = useRouter();

  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const [selectedSale, setSelectedSale] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundMethod, setRefundMethod] = useState("cash");

  const [showRefundConfirm, setShowRefundConfirm] = useState(false);

  // Common authenticated API request.
  const apiRequest = useCallback(
    async (endpoint, options = {}) => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        throw new Error("Please login first.");
      }

      const url = endpoint.startsWith("http")
        ? endpoint
        : `${API_BASE}${endpoint}`;

      const response = await fetch(url, {
        ...options,
        headers: {
          ...(options.body
            ? { "Content-Type": "application/json" }
            : {}),
          Authorization: `JWT ${token}`,
          ...options.headers,
        },
        cache: "no-store",
      });

      const data =
        response.status === 204
          ? null
          : await response.json().catch(() => null);

      if (response.status === 401) {
        router.push("/login");
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data) ||
            `Request failed (${response.status})`
        );
      }

      return data;
    },
    [router]
  );

  // Load all pages from a paginated DRF endpoint.
  const fetchAllPages = useCallback(
    async (endpoint) => {
      let nextUrl = `${API_BASE}${endpoint}`;
      let allItems = [];

      while (nextUrl) {
        const data = await apiRequest(nextUrl);

        allItems = [...allItems, ...getList(data)];

        if (!data?.next) {
          nextUrl = null;
        } else if (data.next.startsWith("http")) {
          nextUrl = data.next;
        } else {
          nextUrl = new URL(
            data.next,
            new URL(API_BASE).origin
          ).toString();
        }
      }

      return allItems;
    },
    [apiRequest]
  );

  // Normalize backend sale response.
  function normalizeSale(sale, paymentList) {
    const payment = paymentList.find(
      (item) =>
        Number(
          typeof item.sale === "object"
            ? item.sale?.id
            : item.sale
        ) === Number(sale.id)
    );

    const items = Array.isArray(sale.items) ? sale.items : [];

    return {
      id: sale.id,
      invoice: sale.invoice_number || `SALE-${sale.id}`,
      customer: getRelatedName(sale.customer),
      cashier: getRelatedName(sale.cashier, "Unknown"),
      date: sale.created_at,

      total: Number(sale.total_amount || 0),
      discount: Number(sale.discount_amount || 0),
      tax: Number(sale.tax_amount || 0),
      final: Number(sale.final_amount || 0),

      status: sale.status,
      items: items.length,
      itemDetails: items,

      payment: payment?.method || "",
      paymentDetails: payment || null,
    };
  }

  // Fetch sales and payments.
  const loadSales = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [salesData, paymentData] = await Promise.all([
          fetchAllPages("/sales/"),
          fetchAllPages("/payments/"),
        ]);

        setPayments(paymentData);

        const normalized = salesData.map((sale) =>
          normalizeSale(sale, paymentData)
        );

        setSales(normalized);

        // Keep selected modal data synchronized after refresh.
        setSelectedSale((current) => {
          if (!current) return null;

          return (
            normalized.find(
              (sale) => sale.id === current.id
            ) || null
          );
        });
      } catch (err) {
        setError(err.message || "Failed to load sales.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchAllPages]
  );

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Search and filters.
  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sales.filter((sale) => {
      const matchesSearch = [
        sale.invoice,
        sale.customer,
        sale.cashier,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );

      const matchesStatus =
        statusFilter === "all" ||
        sale.status === statusFilter;

      const saleDate = new Date(sale.date);
      const today = new Date();

      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      let matchesDate = true;

      if (dateFilter === "today") {
        matchesDate = saleDate >= todayStart;
      } else if (dateFilter === "week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        matchesDate = saleDate >= weekAgo;
      } else if (dateFilter === "month") {
        matchesDate =
          saleDate.getMonth() === today.getMonth() &&
          saleDate.getFullYear() === today.getFullYear();
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [sales, search, statusFilter, dateFilter]);

  const completedSales = sales.filter(
    (sale) => sale.status === "completed"
  );

  const refundedSales = sales.filter(
    (sale) => sale.status === "refunded"
  );

  const totalRevenue = completedSales.reduce(
    (sum, sale) => sum + sale.final,
    0
  );

  // CSV export.
  function exportCsv() {
    const columns = [
      "Invoice",
      "Customer",
      "Cashier",
      "Date",
      "Total",
      "Discount",
      "Tax",
      "Final Amount",
      "Payment",
      "Status",
    ];

    const rows = filteredSales.map((sale) => [
      sale.invoice,
      sale.customer,
      sale.cashier,
      formatDate(sale.date),
      sale.total,
      sale.discount,
      sale.tax,
      sale.final,
      getPaymentLabel(sale.payment),
      sale.status,
    ]);

    const csv = [columns, ...rows]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value ?? "").replaceAll('"', '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "sales.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  // Refund a completed sale.
  async function refundSale() {
    if (!selectedSale || refundLoading) return;

    try {
      setRefundLoading(true);
      setError("");

      await apiRequest(`/sales/${selectedSale.id}/refund/`, {
        method: "POST",
        body: JSON.stringify({
                method: refundMethod,
            }),
      });

      setShowRefundConfirm(false);
      setSelectedSale(null);

      await loadSales(true);
    } catch (err) {
      setError(err.message || "Refund failed.");
    } finally {
      setRefundLoading(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setDateFilter("all");
  }

  return (
    <div className="space-y-5 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            Sales management
          </p>

          <h2 className="text-xl font-semibold tracking-tight">
            Sales
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            View and manage transactions, invoices and refunds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadSales(true)}
            disabled={refreshing}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-card px-3 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw
              className={`size-3.5 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={exportCsv}
            disabled={!filteredSales.length}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-card px-3 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            <ArrowDownToLine className="size-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-600">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p className="flex-1">{error}</p>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: "Total transactions",
            value: sales.length,
            icon: Receipt,
          },
          {
            label: "Total revenue",
            value: money(totalRevenue),
            icon: Banknote,
          },
          {
            label: "Completed sales",
            value: completedSales.length,
            icon: CheckCircle,
          },
          {
            label: "Refunded sales",
            value: refundedSales.length,
            icon: RotateCcw,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border bg-card p-3.5 sm:p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {label}
              </p>

              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
            </div>

            <p className="mt-2 text-xl font-semibold tracking-tight tabular-nums">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Sales table */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold">
              Transaction history
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              {filteredSales.length} transactions shown
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:flex">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search invoice, customer..."
                className="h-9 w-full rounded-lg border bg-background pl-8 pr-3 text-xs outline-none focus:border-primary lg:w-60"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="h-9 rounded-lg border bg-background px-2.5 text-xs outline-none focus:border-primary"
            >
              <option value="all">All statuses</option>
              <option value="completed">Completed</option>
              <option value="refunded">Refunded</option>
            </select>

            <select
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(event.target.value)
              }
              className="h-9 rounded-lg border bg-background px-2.5 text-xs outline-none focus:border-primary"
            >
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">This month</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <RefreshCw className="size-7 animate-spin text-primary" />
            <p className="mt-3 text-xs text-muted-foreground">
              Loading sales...
            </p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <ShoppingCart className="size-10 text-muted-foreground/40" />

            <h3 className="mt-3 text-sm font-semibold">
              No sales found
            </h3>

            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {sales.length === 0
                ? "No transactions have been recorded yet."
                : "Try changing your search or filters to find transactions."}
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-xs font-medium text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-262.5 text-left">
                <thead className="bg-muted/40">
                  <tr className="border-b text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Invoice / Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Cashier</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Discount</th>
                    <th className="px-4 py-3 text-right">Final amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="text-xs transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-primary">
                          {sale.invoice}
                        </p>

                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {formatDate(sale.date)}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="font-medium">{sale.customer}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {sale.items} items
                        </p>
                      </td>

                      <td className="px-4 py-3.5 text-muted-foreground">
                        {sale.cashier}
                      </td>

                      <td className="px-4 py-3.5">
                        <PaymentBadge method={sale.payment} />
                      </td>

                      <td className="px-4 py-3.5 text-right tabular-nums">
                        {money(sale.total)}
                      </td>

                      <td className="px-4 py-3.5 text-right tabular-nums text-muted-foreground">
                        {money(sale.discount)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums">
                        {money(sale.final)}
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusBadge status={sale.status} />
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => setSelectedSale(sale)}
                            title="View sale details"
                            aria-label={`View ${sale.invoice}`}
                            className="flex size-8 items-center justify-center rounded-lg border transition hover:bg-muted"
                          >
                            <Eye className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t px-4 py-3">
              <p className="text-[11px] text-muted-foreground">
                Showing {filteredSales.length} of {sales.length} transactions
              </p>
            </div>
          </>
        )}
      </section>

      {/* Sale details modal */}
      {selectedSale && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedSale(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sale-modal-title"
            className="my-6 w-full max-w-lg rounded-xl border bg-card shadow-2xl"
          >
            <div className="flex items-start justify-between border-b p-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Transaction details
                </p>

                <h3
                  id="sale-modal-title"
                  className="mt-1 text-base font-semibold"
                >
                  {selectedSale.invoice}
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(selectedSale.date)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                aria-label="Close details"
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[65vh] space-y-4 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] text-muted-foreground">
                    Customer
                  </p>
                  <p className="mt-1 text-xs font-semibold">
                    {selectedSale.customer}
                  </p>
                </div>

                <div className="rounded-lg border p-3">
                  <p className="text-[10px] text-muted-foreground">
                    Cashier
                  </p>
                  <p className="mt-1 text-xs font-semibold">
                    {selectedSale.cashier}
                  </p>
                </div>

                <div className="rounded-lg border p-3">
                  <p className="text-[10px] text-muted-foreground">
                    Items
                  </p>
                  <p className="mt-1 text-xs font-semibold">
                    {selectedSale.items}
                  </p>
                </div>

                <div className="rounded-lg border p-3">
                  <p className="text-[10px] text-muted-foreground">
                    Payment
                  </p>
                  <div className="mt-1">
                    <PaymentBadge method={selectedSale.payment} />
                  </div>
                </div>
              </div>

              {/* Sale items */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold">Sale items</h4>

                {selectedSale.itemDetails.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">
                        {getRelatedName(item.product, "Product")}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Qty: {item.quantity} × {money(item.unit_price)}
                      </p>
                    </div>

                    <p className="shrink-0 text-xs font-semibold">
                      {money(item.subtotal)}
                    </p>
                  </div>
                ))}

                {selectedSale.itemDetails.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No item details available.
                  </p>
                )}
              </div>

              <div className="space-y-2 rounded-lg border p-3.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{money(selectedSale.total)}</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Discount</span>
                  <span>- {money(selectedSale.discount)}</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{money(selectedSale.tax)}</span>
                </div>

                <div className="flex justify-between border-t pt-3 text-sm font-bold">
                  <span>Final amount</span>
                  <span>{money(selectedSale.final)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Status
                </span>
                <StatusBadge status={selectedSale.status} />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t p-4">
              {selectedSale.status === "completed" && (
                <button
                  type="button"
                  onClick={() => setShowRefundConfirm(true)}
                  disabled={refundLoading}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-rose-500/10 px-3 text-xs font-medium text-rose-600 hover:bg-rose-500/20 disabled:opacity-50"
                >
                  <RotateCcw className="size-3.5" />
                  Refund sale
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="h-9 rounded-lg border px-4 text-xs font-medium hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund confirmation */}
      {showRefundConfirm && selectedSale && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border bg-card p-5 shadow-2xl">
            <div className="flex size-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
              <RotateCcw className="size-5" />
            </div>

            <h3 className="mt-3 text-sm font-semibold">
              Refund this sale?
            </h3>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Are you sure you want to refund invoice{" "}
              <strong className="text-foreground">
                {selectedSale.invoice}
              </strong>
              ? This action will restore the sold stock.
            </p>

            <div className="mt-4">
                <label className="mb-2 block text-xs font-medium">
                    Refund method
                </label>

                <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    className="h-10 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary"
                >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="mobile_banking">Mobile Banking</option>
                </select>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRefundConfirm(false)}
                disabled={refundLoading}
                className="h-9 rounded-lg border px-3 text-xs font-medium hover:bg-muted"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={refundSale}
                disabled={refundLoading}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-rose-600 px-3 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {refundLoading && (
                  <RefreshCw className="size-3 animate-spin" />
                )}
                Confirm refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}