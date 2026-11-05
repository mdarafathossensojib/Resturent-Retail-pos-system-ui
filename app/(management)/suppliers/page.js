
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Truck, Search, RefreshCw, Plus, Eye, Pencil, Trash2,
  X, Phone, Mail, MapPin, ShoppingBag, Receipt, ChevronLeft,
  ChevronRight, AlertCircle, CheckCircle2, Package,
} from "lucide-react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://resturent-retail-pos-system.vercel.app/api/v1"
).replace(/\/$/, "");

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
};

function getToken() {
  try {
    return JSON.parse(localStorage.getItem("authTokens") || "{}").access;
  } catch {
    return null;
  }
}

function getList(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.results) ? data.results : [];
}

function getErrorMessage(data) {
  if (!data) return "Something went wrong.";
  if (data.detail) return data.detail;

  return Object.entries(data)
    .map(([key, value]) =>
      `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
    )
    .join(" | ");
}

function money(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getSupplierId(value) {
  return value && typeof value === "object" ? value.id : value;
}

function StatCard({ label, value, subtitle, icon: Icon, color }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <span className={`flex size-9 items-center justify-center rounded-xl ${color}`}>
          <Icon className="size-4.5" />
        </span>
      </div>
      <p className="mt-2 truncate text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-[10px] text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export default function SuppliersPage() {
  const router = useRouter();

  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const pageSize = 5;

  const apiRequest = useCallback(async (endpoint, options = {}) => {
    const token = getToken();

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
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `JWT ${token}`,
        ...options.headers,
      },
      cache: "no-store",
    });

    const data = response.status === 204
      ? null
      : await response.json().catch(() => null);

    if (response.status === 401) {
      router.push("/login");
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      throw new Error(getErrorMessage(data) || `Request failed (${response.status})`);
    }

    return data;
  }, [router]);

  const fetchAllPages = useCallback(async (endpoint) => {
    let nextUrl = `${API_BASE}${endpoint}`;
    let result = [];

    while (nextUrl) {
      const data = await apiRequest(nextUrl);
      result = [...result, ...getList(data)];

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

    return result;
  }, [apiRequest]);

  const loadData = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const [supplierData, purchaseData] = await Promise.all([
        fetchAllPages("/suppliers/"),
        fetchAllPages("/purchases/"),
      ]);

      setSuppliers(supplierData);
      setPurchases(purchaseData);

      setSelectedSupplier((current) =>
        current
          ? supplierData.find((item) => item.id === current.id) || null
          : null
      );
    } catch (err) {
      setError(err.message || "Failed to load suppliers.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchAllPages]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const enrichedSuppliers = useMemo(() => {
    return suppliers.map((supplier) => {
      const supplierPurchases = purchases.filter(
        (purchase) =>
          getSupplierId(purchase.supplier) === supplier.id
      );

      const completedPurchases = supplierPurchases.filter(
        (purchase) => purchase.status !== "cancelled"
      );

      const totalPurchased = completedPurchases.reduce(
        (sum, purchase) =>
          sum + Number(
            purchase.final_amount ??
            purchase.total_amount ??
            purchase.total ??
            0
          ),
        0
      );

      const lastPurchase = [...supplierPurchases].sort(
        (a, b) =>
          new Date(b.created_at || 0) - new Date(a.created_at || 0)
      )[0]?.created_at || null;

      return {
        ...supplier,
        purchaseCount: supplierPurchases.length,
        totalPurchased,
        lastPurchase,
      };
    });
  }, [suppliers, purchases]);

  const filteredSuppliers = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = enrichedSuppliers.filter((supplier) =>
      [
        supplier.name,
        supplier.phone,
        supplier.email,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );

    if (sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
    } else if (sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.created_at || 0) - new Date(b.created_at || 0)
      );
    } else if (sortBy === "purchases") {
      result.sort((a, b) => b.purchaseCount - a.purchaseCount);
    } else if (sortBy === "amount") {
      result.sort((a, b) => b.totalPurchased - a.totalPurchased);
    }

    return result;
  }, [enrichedSuppliers, search, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSuppliers.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [search, sortBy]);

  const totalPurchased = enrichedSuppliers.reduce(
    (sum, supplier) => sum + supplier.totalPurchased,
    0
  );

  function openAddModal() {
    setEditingSupplier(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(supplier) {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
    });
    setFormError("");
    setModalOpen(true);
  }

  async function saveSupplier(event) {
    event.preventDefault();
    if (saving) return;

    try {
      setSaving(true);
      setFormError("");

      const isEdit = Boolean(editingSupplier);

      const saved = await apiRequest(
        `/suppliers/${isEdit ? `${editingSupplier.id}/` : ""}`,
        {
          method: isEdit ? "PATCH" : "POST",
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            address: form.address.trim(),
          }),
        }
      );

      setSuppliers((current) =>
        isEdit
          ? current.map((item) =>
              item.id === saved.id ? saved : item
            )
          : [saved, ...current]
      );

      setSelectedSupplier(saved);
      setModalOpen(false);
      setForm(emptyForm);
      setEditingSupplier(null);

      setToast(
        isEdit
          ? "Supplier updated successfully."
          : "Supplier created successfully."
      );
      setTimeout(() => setToast(""), 3000);
    } catch (err) {
      setFormError(err.message || "Could not save supplier.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSupplier(supplier) {
    if (!window.confirm(`Delete supplier "${supplier.name}"?`)) return;

    try {
      setDeletingId(supplier.id);
      setError("");

      await apiRequest(`/suppliers/${supplier.id}/`, {
        method: "DELETE",
      });

      setSuppliers((current) =>
        current.filter((item) => item.id !== supplier.id)
      );

      if (selectedSupplier?.id === supplier.id) {
        setSelectedSupplier(null);
      }

      setToast("Supplier deleted successfully.");
      setTimeout(() => setToast(""), 3000);
    } catch (err) {
      setError(err.message || "Could not delete supplier.");
    } finally {
      setDeletingId(null);
    }
  }

  const selectedDetails = selectedSupplier
    ? enrichedSuppliers.find(
        (supplier) => supplier.id === selectedSupplier.id
      )
    : null;

  const selectedPurchases = selectedDetails
    ? purchases
        .filter(
          (purchase) =>
            getSupplierId(purchase.supplier) === selectedDetails.id
        )
        .sort(
          (a, b) =>
            new Date(b.created_at || 0) - new Date(a.created_at || 0)
        )
    : [];

  return (
    <div className="space-y-5 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            Purchase management
          </p>
          <h1 className="text-xl font-semibold tracking-tight">Suppliers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage suppliers and track your purchase history.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-600">
          <AlertCircle className="size-4 shrink-0" />
          <p className="flex-1">{error}</p>
          <button type="button" onClick={() => setError("")}>
            <X className="size-4" />
          </button>
        </div>
      )}

      {toast && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-600">
          <CheckCircle2 className="size-4" />
          {toast}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Total suppliers"
          value={suppliers.length}
          subtitle="Registered suppliers"
          icon={Truck}
          color="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          label="Total purchases"
          value={money(totalPurchased)}
          subtitle={`${purchases.length} recorded purchases`}
          icon={ShoppingBag}
          color="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          label="Active suppliers"
          value={enrichedSuppliers.filter((s) => s.purchaseCount > 0).length}
          subtitle="Suppliers with purchases"
          icon={Users}
          color="bg-violet-500/10 text-violet-600"
        />
        <StatCard
          label="No purchase yet"
          value={enrichedSuppliers.filter((s) => s.purchaseCount === 0).length}
          subtitle="New registered suppliers"
          icon={Package}
          color="bg-amber-500/10 text-amber-600"
        />
      </div>

      {/* Supplier table */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-3.5 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search supplier name, phone or email..."
              className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-xs outline-none focus:border-primary"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 rounded-lg border bg-background px-3 text-xs outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="purchases">Most purchases</option>
            <option value="amount">Highest purchase amount</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSortBy("newest");
            }}
            className="h-9 rounded-lg border px-3 text-xs font-medium hover:bg-muted"
          >
            Clear filters
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="size-7 animate-spin text-primary" />
            <p className="mt-3 text-xs text-muted-foreground">
              Loading suppliers...
            </p>
          </div>
        ) : paginatedSuppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Truck className="size-10 text-muted-foreground/40" />
            <h3 className="mt-3 text-sm font-semibold">No suppliers found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Add a supplier or change your search.
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-4 text-xs font-medium text-primary hover:underline"
            >
              Add your first supplier
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-212.5 text-left">
                <thead className="bg-muted/40">
                  <tr className="border-b text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3 text-right">Purchases</th>
                    <th className="px-4 py-3 text-right">Total amount</th>
                    <th className="px-4 py-3">Last purchase</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {paginatedSuppliers.map((supplier, index) => (
                    <tr
                      key={supplier.id}
                      className={`text-xs transition hover:bg-muted/30 ${
                        selectedSupplier?.id === supplier.id ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => setSelectedSupplier(supplier)}
                          className="flex items-center gap-2.5 text-left"
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {(supplier.name || "S").slice(0, 2).toUpperCase()}
                          </span>
                          <span className="font-semibold hover:text-primary">
                            {supplier.name}
                          </span>
                        </button>
                      </td>

                      <td className="px-4 py-3.5 text-muted-foreground">
                        {supplier.phone || "—"}
                      </td>

                      <td className="px-4 py-3.5 text-muted-foreground">
                        {supplier.email || "—"}
                      </td>

                      <td className="px-4 py-3.5 text-right tabular-nums">
                        {supplier.purchaseCount}
                      </td>

                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums">
                        {money(supplier.totalPurchased)}
                      </td>

                      <td className="px-4 py-3.5 text-muted-foreground">
                        {formatDate(supplier.lastPurchase)}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedSupplier(supplier)}
                            title="View supplier"
                            className="flex size-8 items-center justify-center rounded-lg border hover:bg-muted"
                          >
                            <Eye className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(supplier)}
                            title="Edit supplier"
                            className="flex size-8 items-center justify-center rounded-lg border text-primary hover:bg-primary/10"
                          >
                            <Pencil className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteSupplier(supplier)}
                            disabled={deletingId === supplier.id}
                            title="Delete supplier"
                            className="flex size-8 items-center justify-center rounded-lg border text-rose-600 hover:bg-rose-500/10 disabled:opacity-50"
                          >
                            {deletingId === supplier.id
                              ? <RefreshCw className="size-3.5 animate-spin" />
                              : <Trash2 className="size-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col justify-between gap-3 border-t px-4 py-3 sm:flex-row sm:items-center">
              <p className="text-[11px] text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredSuppliers.length)}
                {" "}of {filteredSuppliers.length} suppliers
              </p>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex size-8 items-center justify-center rounded-lg border hover:bg-muted disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <span className="px-3 text-xs tabular-nums">
                  Page {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex size-8 items-center justify-center rounded-lg border hover:bg-muted disabled:opacity-40"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Supplier details and purchase history */}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Supplier details</h3>

            {selectedDetails && (
              <button
                type="button"
                onClick={() => openEditModal(selectedDetails)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Pencil className="size-3.5" />
                Edit
              </button>
            )}
          </div>

          {selectedDetails ? (
            <>
              <div className="flex gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                  {(selectedDetails.name || "S").slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <h4 className="text-base font-semibold">
                    {selectedDetails.name}
                  </h4>
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="size-3.5" />
                    {selectedDetails.phone || "No phone"}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="size-3.5" />
                    {selectedDetails.email || "No email"}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {selectedDetails.address || "No address"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 border-t pt-4">
                <div>
                  <p className="text-[10px] text-muted-foreground">Purchases</p>
                  <p className="mt-1 text-sm font-semibold">
                    {selectedDetails.purchaseCount}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Total amount</p>
                  <p className="mt-1 text-sm font-semibold">
                    {money(selectedDetails.totalPurchased)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Last purchase</p>
                  <p className="mt-1 text-xs font-semibold">
                    {formatDate(selectedDetails.lastPurchase)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center text-center">
              <Truck className="size-9 text-muted-foreground/40" />
              <p className="mt-3 text-xs text-muted-foreground">
                Select a supplier to view details.
              </p>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h3 className="text-sm font-semibold">Purchase history</h3>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {selectedDetails?.name || "Select a supplier first"}
              </p>
            </div>
            <Receipt className="size-4 text-muted-foreground" />
          </div>

          {selectedDetails ? (
            selectedPurchases.length ? (
              <div className="divide-y">
                {selectedPurchases.slice(0, 5).map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">
                        {purchase.invoice_number || `Purchase #${purchase.id}`}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {formatDate(purchase.created_at)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold">
                        {money(
                          purchase.final_amount ??
                          purchase.total_amount ??
                          purchase.total
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {purchase.status || "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center text-center">
                <ShoppingBag className="size-8 text-muted-foreground/40" />
                <p className="mt-2 text-xs text-muted-foreground">
                  No purchases recorded for this supplier.
                </p>
              </div>
            )
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center text-center">
              <Receipt className="size-8 text-muted-foreground/40" />
              <p className="mt-2 text-xs text-muted-foreground">
                Supplier purchase history will appear here.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Add/Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <form
            onSubmit={saveSupplier}
            className="my-6 w-full max-w-md rounded-xl border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h3 className="text-sm font-semibold">
                  {editingSupplier ? "Edit supplier" : "Add supplier"}
                </h3>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Enter supplier information below.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 p-4">
              {formError && (
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-600">
                  {formError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium">
                  Supplier name <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Enter supplier name"
                  className="h-10 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium">
                  Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  placeholder="01XXXXXXXXX"
                  className="h-10 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="supplier@email.com"
                  className="h-10 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium">
                  Address
                </label>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Enter supplier address..."
                  className="w-full resize-none rounded-lg border bg-background p-3 text-xs outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t p-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="h-9 rounded-lg border px-4 text-xs font-medium hover:bg-muted"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {saving && <RefreshCw className="size-3.5 animate-spin" />}
                {editingSupplier ? "Update supplier" : "Save supplier"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
