
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, ShoppingBag, Star, UserCheck, Search, RefreshCw,
  Plus, Eye, Pencil, Trash2, X, Phone, Mail, MapPin,
  CalendarDays, Receipt, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, ArrowUpDown,
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

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function getToken() {
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

function getErrorMessage(data) {
  if (!data) return "Something went wrong.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;

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

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getCustomerId(value) {
  if (value && typeof value === "object") return value.id;
  return value;
}

function getCustomerName(value) {
  if (!value) return "Walk-in Customer";
  if (typeof value === "string") return value;

  return value.name || value.full_name || value.email || "Customer";
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${
        active
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-muted-foreground"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
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
      <p className="mt-2 truncate text-xl font-semibold tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}

export default function CustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const [detailsTab, setDetailsTab] = useState("purchases");

  const pageSize = 5;

  const apiRequest = useCallback(
    async (endpoint, options = {}) => {
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
          getErrorMessage(data) || `Request failed (${response.status})`
        );
      }

      return data;
    },
    [router]
  );

  const fetchAllPages = useCallback(
    async (endpoint) => {
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
    },
    [apiRequest]
  );

  const loadCustomers = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) setRefreshing(true);
        else setLoading(true);

        setError("");

        const [customerData, salesData] = await Promise.all([
          fetchAllPages("/customers/"),
          fetchAllPages("/sales/"),
        ]);

        setCustomers(customerData);
        setSales(salesData);

        setSelectedCustomer((current) => {
          if (!current) return null;
          return (
            customerData.find((item) => item.id === current.id) || null
          );
        });
      } catch (err) {
        setError(err.message || "Failed to load customers.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchAllPages]
  );

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Purchase history and totals are derived from real sales.
  const customerStats = useMemo(() => {
    const map = new Map();

    customers.forEach((customer) => {
      map.set(customer.id, {
        count: 0,
        spent: 0,
        purchases: [],
      });
    });

    sales.forEach((sale) => {
      const customerId = getCustomerId(sale.customer);
      if (customerId == null || !map.has(customerId)) return;

      const entry = map.get(customerId);

      entry.count += 1;

      if (sale.status === "completed") {
        entry.spent += Number(sale.final_amount || 0);
      }

      entry.purchases.push(sale);
    });

    return map;
  }, [customers, sales]);

  const enrichedCustomers = useMemo(() => {
    const now = new Date();

    return customers.map((customer) => {
      const stats = customerStats.get(customer.id) || {
        count: 0,
        spent: 0,
        purchases: [],
      };

      const purchases = [...stats.purchases].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      const lastPurchase = purchases[0]?.created_at || null;

      const daysSincePurchase = lastPurchase
        ? (now - new Date(lastPurchase)) / (1000 * 60 * 60 * 24)
        : Infinity;

      return {
        ...customer,
        purchaseCount: stats.count,
        totalSpent: stats.spent,
        purchases,
        lastPurchase,
        active: daysSincePurchase <= 90,
      };
    });
  }, [customers, customerStats]);

  const filteredCustomers = useMemo(() => {
    let result = enrichedCustomers.filter((customer) => {
      const query = search.trim().toLowerCase();

      const matchesSearch = [
        customer.name,
        customer.phone,
        customer.email,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && customer.active) ||
        (statusFilter === "inactive" && !customer.active);

      return matchesSearch && matchesStatus;
    });

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
    } else if (sortBy === "spent") {
      result.sort((a, b) => b.totalSpent - a.totalSpent);
    } else if (sortBy === "purchases") {
      result.sort((a, b) => b.purchaseCount - a.purchaseCount);
    }

    return result;
  }, [enrichedCustomers, search, statusFilter, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortBy]);

  const totalSpent = enrichedCustomers.reduce(
    (sum, customer) => sum + customer.totalSpent,
    0
  );

  const activeCount = enrichedCustomers.filter(
    (customer) => customer.active
  ).length;

  const topCustomer = [...enrichedCustomers].sort(
    (a, b) => b.totalSpent - a.totalSpent
  )[0];

  const selectedDetails = selectedCustomer
    ? enrichedCustomers.find(
        (customer) => customer.id === selectedCustomer.id
      )
    : null;

  function openAddModal() {
    setEditingCustomer(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(customer) {
    setEditingCustomer(customer);

    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
    });

    setFormError("");
    setModalOpen(true);
  }

  async function saveCustomer(event) {
    event.preventDefault();

    if (saving) return;

    try {
      setSaving(true);
      setFormError("");

      const isEdit = Boolean(editingCustomer);

      const saved = await apiRequest(
        `/customers/${isEdit ? `${editingCustomer.id}/` : ""}`,
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

      setCustomers((current) =>
        isEdit
          ? current.map((item) =>
              item.id === saved.id ? saved : item
            )
          : [saved, ...current]
      );

      setSelectedCustomer(saved);
      setModalOpen(false);
      setForm(emptyForm);
      setEditingCustomer(null);

      setToast(
        isEdit
          ? "Customer updated successfully."
          : "Customer created successfully."
      );

      setTimeout(() => setToast(""), 3000);
    } catch (err) {
      setFormError(err.message || "Could not save customer.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomer(customer) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${customer.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(customer.id);
      setError("");

      await apiRequest(`/customers/${customer.id}/`, {
        method: "DELETE",
      });

      setCustomers((current) =>
        current.filter((item) => item.id !== customer.id)
      );

      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer(null);
      }

      setToast("Customer deleted successfully.");
      setTimeout(() => setToast(""), 3000);
    } catch (err) {
      setError(err.message || "Could not delete customer.");
    } finally {
      setDeletingId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setSortBy("newest");
  }

  return (
    <div className="space-y-5 p-4 lg:p-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            Customer management
          </p>
          <h1 className="text-xl font-semibold tracking-tight">
            Customers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your customers and view purchase history.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => loadCustomers(true)}
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
            Add Customer
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-600">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p className="flex-1">{error}</p>
          <button type="button" onClick={() => setError("")}>
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-600">
          <CheckCircle2 className="size-4" />
          {toast}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Total customers"
          value={customers.length}
          subtitle="Registered customers"
          icon={Users}
          color="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          label="Total purchases"
          value={money(totalSpent)}
          subtitle={`${sales.length} recorded sales`}
          icon={ShoppingBag}
          color="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          label="Top customer"
          value={topCustomer?.name || "—"}
          subtitle={`${topCustomer?.purchaseCount || 0} purchases`}
          icon={Star}
          color="bg-violet-500/10 text-violet-600"
        />
        <StatCard
          label="Active customers"
          value={activeCount}
          subtitle="Purchased within 90 days"
          icon={UserCheck}
          color="bg-amber-500/10 text-amber-600"
        />
      </div>

      {/* Customer list */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-3.5 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone or email..."
              className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-xs outline-none focus:border-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border bg-background px-3 text-xs outline-none"
          >
            <option value="all">All customers</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 rounded-lg border bg-background px-3 text-xs outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="spent">Highest spending</option>
            <option value="purchases">Most purchases</option>
          </select>

          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium hover:bg-muted"
          >
            <RefreshCw className="size-3.5" />
            Clear filters
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="size-7 animate-spin text-primary" />
            <p className="mt-3 text-xs text-muted-foreground">
              Loading customers...
            </p>
          </div>
        ) : paginatedCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="size-10 text-muted-foreground/40" />
            <h3 className="mt-3 text-sm font-semibold">No customers found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Add a customer or change your search filters.
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-4 text-xs font-medium text-primary hover:underline"
            >
              Add your first customer
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-225 text-left">
                <thead className="bg-muted/40">
                  <tr className="border-b text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3 text-right">Purchases</th>
                    <th className="px-4 py-3 text-right">Total spent</th>
                    <th className="px-4 py-3">Last purchase</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {paginatedCustomers.map((customer, index) => (
                    <tr
                      key={customer.id}
                      className={`text-xs transition hover:bg-muted/30 ${
                        selectedCustomer?.id === customer.id
                          ? "bg-primary/5"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setDetailsTab("purchases");
                          }}
                          className="flex items-center gap-2.5 text-left"
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {(customer.name || "C")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                          <span className="font-semibold hover:text-primary">
                            {customer.name}
                          </span>
                        </button>
                      </td>

                      <td className="px-4 py-3.5 text-muted-foreground">
                        {customer.phone || "—"}
                      </td>

                      <td className="px-4 py-3.5 text-muted-foreground">
                        {customer.email || "—"}
                      </td>

                      <td className="px-4 py-3.5 text-right tabular-nums">
                        {customer.purchaseCount}
                      </td>

                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums">
                        {money(customer.totalSpent)}
                      </td>

                      <td className="px-4 py-3.5 text-muted-foreground">
                        {formatDate(customer.lastPurchase)}
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusBadge active={customer.active} />
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setDetailsTab("purchases");
                            }}
                            title="View customer"
                            className="flex size-8 items-center justify-center rounded-lg border hover:bg-muted"
                          >
                            <Eye className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(customer)}
                            title="Edit customer"
                            className="flex size-8 items-center justify-center rounded-lg border text-primary hover:bg-primary/10"
                          >
                            <Pencil className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteCustomer(customer)}
                            disabled={deletingId === customer.id}
                            title="Delete customer"
                            className="flex size-8 items-center justify-center rounded-lg border text-rose-600 hover:bg-rose-500/10 disabled:opacity-50"
                          >
                            {deletingId === customer.id ? (
                              <RefreshCw className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
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
                Showing {filteredCustomers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                {" "}to{" "}
                {Math.min(currentPage * pageSize, filteredCustomers.length)}
                {" "}of {filteredCustomers.length} customers
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

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((number) =>
                    number === 1 ||
                    number === totalPages ||
                    Math.abs(number - currentPage) <= 1
                  )
                  .map((number, index, array) => (
                    <span key={number} className="contents">
                      {index > 0 && array[index - 1] !== number - 1 && (
                        <span className="px-1 text-xs text-muted-foreground">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setPage(number)}
                        className={`size-8 rounded-lg border text-xs font-medium ${
                          currentPage === number
                            ? "border-primary bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        {number}
                      </button>
                    </span>
                  ))}

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

      {/* Customer details and purchase history */}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Customer details</h3>
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
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  {(selectedDetails.name || "C").slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-semibold">
                      {selectedDetails.name}
                    </h4>
                    <StatusBadge active={selectedDetails.active} />
                  </div>

                  <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Phone className="size-3.5" />
                      {selectedDetails.phone || "No phone number"}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="size-3.5" />
                      {selectedDetails.email || "No email"}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="size-3.5" />
                      {selectedDetails.address || "No address"}
                    </p>
                  </div>
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
                  <p className="text-[10px] text-muted-foreground">Total spent</p>
                  <p className="mt-1 text-sm font-semibold">
                    {money(selectedDetails.totalSpent)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Last purchase</p>
                  <p className="mt-1 text-xs font-semibold">
                    {formatDate(selectedDetails.lastPurchase)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setDetailsTab("purchases")}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                    detailsTab === "purchases"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <ShoppingBag className="size-3.5" />
                  Purchase history
                </button>
              </div>
            </>
          ) : (
            <div className="flex min-h-44 flex-col items-center justify-center text-center">
              <Users className="size-9 text-muted-foreground/40" />
              <p className="mt-3 text-xs text-muted-foreground">
                Select a customer to view their details.
              </p>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h3 className="text-sm font-semibold">Recent purchases</h3>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {selectedDetails
                  ? selectedDetails.name
                  : "Select a customer first"}
              </p>
            </div>
            <Receipt className="size-4 text-muted-foreground" />
          </div>

          {selectedDetails ? (
            selectedDetails.purchases.length ? (
              <div className="divide-y">
                {selectedDetails.purchases.slice(0, 5).map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">
                        {sale.invoice_number || `Sale #${sale.id}`}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {formatDate(sale.created_at)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold tabular-nums">
                        {money(sale.final_amount)}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {sale.status || "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center text-center">
                <ShoppingBag className="size-8 text-muted-foreground/40" />
                <p className="mt-2 text-xs text-muted-foreground">
                  No purchases recorded for this customer.
                </p>
              </div>
            )
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center text-center">
              <Receipt className="size-8 text-muted-foreground/40" />
              <p className="mt-2 text-xs text-muted-foreground">
                Customer purchase history will appear here.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <form
            onSubmit={saveCustomer}
            className="my-6 w-full max-w-md rounded-xl border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h3 className="text-sm font-semibold">
                  {editingCustomer ? "Edit customer" : "Add customer"}
                </h3>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Enter customer information below.
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
                  Full name <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Enter customer name"
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
                  placeholder="customer@email.com"
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
                  placeholder="Enter customer address..."
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
                {editingCustomer ? "Update customer" : "Save customer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
