
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, RefreshCw, X, Eye, RotateCcw,
  ShoppingBag, Truck, Package, Receipt, Trash2,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2,
} from "lucide-react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://resturent-retail-pos-system.vercel.app/api/v1"
).replace(/\/$/, "");

const emptyItem = {
  product: "",
  quantity: 1,
  cost_price: "",
};

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getList = (data) =>
  Array.isArray(data) ? data : data?.results || [];

const getToken = () => {
  try {
    return JSON.parse(localStorage.getItem("authTokens") || "{}").access;
  } catch {
    return null;
  }
};

const getError = (data) => {
  if (!data) return "Something went wrong.";

  if (data.detail) return data.detail;

  return Object.entries(data)
    .map(([key, value]) =>
      `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
    )
    .join(" | ");
};

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <span className={`flex size-9 items-center justify-center rounded-lg ${color}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export default function PurchasesPage() {
  const router = useRouter();

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [returning, setReturning] = useState(false);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showReturn, setShowReturn] = useState(false);

  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [purchaseSearch, setPurchaseSearch] = useState("");

  const [returnItems, setReturnItems] = useState({});

  const pageSize = 6;

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
      throw new Error(
        getError(data) || `Request failed (${response.status})`
      );
    }

    return data;
  }, [router]);

  const fetchAll = useCallback(async (endpoint) => {
    let url = `${API_BASE}${endpoint}`;
    let result = [];

    while (url) {
      const data = await apiRequest(url);
      result = [...result, ...getList(data)];

      if (!data?.next) {
        url = null;
      } else if (data.next.startsWith("http")) {
        url = data.next;
      } else {
        url = new URL(
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

      const [purchaseData, supplierData, productData] =
        await Promise.all([
          fetchAll("/purchases/"),
          fetchAll("/suppliers/"),
          fetchAll("/products/"),
        ]);

      setPurchases(purchaseData);
      setSuppliers(supplierData);
      setProducts(productData);
    } catch (err) {
      setError(err.message || "Failed to load purchase data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const supplierMap = useMemo(
    () => new Map(suppliers.map((s) => [s.id, s])),
    [suppliers]
  );

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  const getPurchaseSupplier = (purchase) => {
    const id = typeof purchase.supplier === "object"
      ? purchase.supplier?.id
      : purchase.supplier;

    return supplierMap.get(id) || purchase.supplier;
  };

  const getPurchaseItems = (purchase) =>
    purchase.items || purchase.purchase_items || [];

  const totalPurchased = purchases.reduce(
    (sum, purchase) => sum + Number(purchase.total_amount || 0),
    0
  );

  const totalUnits = purchases.reduce(
    (sum, purchase) =>
      sum + getPurchaseItems(purchase).reduce(
        (itemSum, item) => itemSum + Number(item.quantity || 0),
        0
      ),
    0
  );

  const filteredPurchases = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...purchases]
      .filter((purchase) => {
        const supplier = getPurchaseSupplier(purchase);
        const invoice = `purchase #${purchase.id}`;

        return (
          invoice.includes(query) ||
          String(supplier?.name || "").toLowerCase().includes(query) ||
          String(purchase.id).includes(query)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
      );
  }, [purchases, search, supplierMap]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPurchases.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  const selectedItems = items.map((item) => {
    const product = productMap.get(Number(item.product));
    const quantity = Math.max(0, Number(item.quantity) || 0);
    const cost = Math.max(0, Number(item.cost_price) || 0);

    return {
      ...item,
      productData: product,
      subtotal: quantity * cost,
    };
  });

  const grandTotal = selectedItems.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  const availableProducts = products.filter(
    (product) => !items.some(
      (item) => Number(item.product) === product.id
    )
  );

  const searchedProducts = availableProducts.filter((product) =>
    `${product.name} ${product.sku || ""} ${product.barcode || ""}`
      .toLowerCase()
      .includes(purchaseSearch.toLowerCase())
  );

  function updateItem(index, field, value) {
    setItems((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addItem() {
    setItems((current) => [...current, { ...emptyItem }]);
  }

  function removeItem(index) {
    setItems((current) =>
      current.length === 1
        ? current
        : current.filter((_, i) => i !== index)
    );
  }

  function resetForm() {
    setSupplierId("");
    setItems([{ ...emptyItem }]);
    setPurchaseSearch("");
  }

  async function createPurchase(event) {
    event.preventDefault();

    if (saving) return;

    if (!supplierId) {
      setError("Please select a supplier.");
      return;
    }

    if (items.some(
      (item) =>
        !item.product ||
        Number(item.quantity) < 1 ||
        item.cost_price === "" ||
        Number(item.cost_price) < 0
    )) {
      setError("Please complete all purchase item fields.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        supplier: Number(supplierId),
        items: items.map((item) => ({
          product: Number(item.product),
          quantity: Number(item.quantity),
          cost_price: Number(item.cost_price).toFixed(2),
        })),
      };

      await apiRequest("/purchases/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      resetForm();
      setShowForm(false);

      setToast("Purchase completed successfully. Stock has been updated.");
      setTimeout(() => setToast(""), 4000);

      await loadData(true);
    } catch (err) {
      setError(err.message || "Purchase creation failed.");
    } finally {
      setSaving(false);
    }
  }

  function openReturn(purchase) {
    setSelectedPurchase(purchase);

    const initial = {};

    getPurchaseItems(purchase).forEach((item) => {
      initial[item.id] = {
        quantity: 0,
        remaining: Number(item.quantity || 0),
      };
    });

    setReturnItems(initial);
    setShowReturn(true);
  }

  function getAlreadyReturned(item) {
    return (item.supplier_return_items || []).reduce(
      (sum, returned) => sum + Number(returned.quantity || 0),
      0
    );
  }

  const returnTotal = selectedPurchase
    ? getPurchaseItems(selectedPurchase).reduce((sum, item) => {
        const quantity = Number(returnItems[item.id]?.quantity || 0);
        return sum + quantity * Number(item.cost_price || 0);
      }, 0)
    : 0;

  async function submitReturn(event) {
    event.preventDefault();

    if (!selectedPurchase || returning) return;

    const payloadItems = getPurchaseItems(selectedPurchase)
      .filter((item) => Number(returnItems[item.id]?.quantity || 0) > 0)
      .map((item) => ({
        purchase_item: item.id,
        quantity: Number(returnItems[item.id].quantity),
      }));

    if (!payloadItems.length) {
      setError("Select at least one item to return.");
      return;
    }

    try {
      setReturning(true);
      setError("");

      await apiRequest(
        `/purchases/${selectedPurchase.id}/supplier-return/`,
        {
          method: "POST",
          body: JSON.stringify({ items: payloadItems }),
        }
      );

      setShowReturn(false);
      setSelectedPurchase(null);

      setToast("Supplier return completed. Stock has been updated.");
      setTimeout(() => setToast(""), 4000);

      await loadData(true);
    } catch (err) {
      setError(err.message || "Supplier return failed.");
    } finally {
      setReturning(false);
    }
  }

  function openDetails(purchase) {
    setSelectedPurchase(purchase);
  }

  return (
    <div className="space-y-5 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            Inventory management
          </p>
          <h1 className="text-xl font-semibold tracking-tight">Purchases</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Record stock purchases and manage supplier returns.
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
            onClick={() => {
              setError("");
              setShowForm(true);
            }}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" />
            New Purchase
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Total purchases"
          value={purchases.length}
          icon={ShoppingBag}
          color="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          label="Total purchase amount"
          value={money(totalPurchased)}
          icon={Receipt}
          color="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          label="Products purchased"
          value={totalUnits}
          icon={Package}
          color="bg-violet-500/10 text-violet-600"
        />
        <StatCard
          label="Suppliers"
          value={suppliers.length}
          icon={Truck}
          color="bg-amber-500/10 text-amber-600"
        />
      </div>

      {/* Purchase history */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-3.5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold">Purchase history</h2>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {filteredPurchases.length} purchase records
            </p>
          </div>

          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice or supplier..."
              className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-xs outline-none focus:border-primary"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="size-7 animate-spin text-primary" />
            <p className="mt-3 text-xs text-muted-foreground">
              Loading purchases...
            </p>
          </div>
        ) : paginatedPurchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="size-10 text-muted-foreground/40" />
            <h3 className="mt-3 text-sm font-semibold">No purchases found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Create your first purchase to increase stock.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-187.5 text-left">
                <thead className="bg-muted/40">
                  <tr className="border-b text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-center">Items</th>
                    <th className="px-4 py-3 text-right">Total amount</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {paginatedPurchases.map((purchase) => {
                    const supplier = getPurchaseSupplier(purchase);

                    return (
                      <tr key={purchase.id} className="text-xs hover:bg-muted/30">
                        <td className="px-4 py-3.5 font-semibold">
                          PUR-{String(purchase.id).padStart(5, "0")}
                        </td>

                        <td className="px-4 py-3.5">
                          {supplier?.name || `Supplier #${purchase.supplier}`}
                        </td>

                        <td className="px-4 py-3.5 text-muted-foreground">
                          {formatDate(purchase.created_at)}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          {getPurchaseItems(purchase).length}
                        </td>

                        <td className="px-4 py-3.5 text-right font-semibold tabular-nums">
                          {money(purchase.total_amount)}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex justify-center gap-1.5">
                            <button
                              type="button"
                              title="View details"
                              onClick={() => openDetails(purchase)}
                              className="flex size-8 items-center justify-center rounded-lg border hover:bg-muted"
                            >
                              <Eye className="size-3.5" />
                            </button>

                            <button
                              type="button"
                              title="Supplier return"
                              onClick={() => openReturn(purchase)}
                              className="flex size-8 items-center justify-center rounded-lg border text-amber-600 hover:bg-amber-500/10"
                            >
                              <RotateCcw className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col justify-between gap-3 border-t px-4 py-3 sm:flex-row sm:items-center">
              <p className="text-[11px] text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredPurchases.length)}
                {" "}of {filteredPurchases.length} purchases
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

                <span className="px-3 text-xs">
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

      {/* New purchase modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3">
          <form
            onSubmit={createPurchase}
            className="my-5 w-full max-w-4xl rounded-xl border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="text-sm font-semibold">Create new purchase</h2>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Select supplier and add purchased products.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-4">
              {/* Supplier */}
              <div>
                <label className="mb-2 block text-xs font-medium">
                  Supplier <span className="text-rose-500">*</span>
                </label>

                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} {supplier.phone ? `— ${supplier.phone}` : ""}
                    </option>
                  ))}
                </select>

                {suppliers.length === 0 && (
                  <p className="mt-2 text-[10px] text-amber-600">
                    No suppliers found. Create a supplier first.
                  </p>
                )}
              </div>

              {/* Products */}
              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-semibold">Purchase items</h3>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Select products and enter quantity and unit cost.
                    </p>
                  </div>
                  <span className="rounded-md bg-muted px-2 py-1 text-[10px]">
                    {items.length} items
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedItems.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border bg-background p-3"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold">
                          Item {index + 1}
                        </p>

                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="rounded-md p-1.5 text-rose-600 hover:bg-rose-500/10 disabled:opacity-30"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-12">
                        <div className="md:col-span-6">
                          <label className="mb-1.5 block text-[10px] text-muted-foreground">
                            Product
                          </label>

                          <select
                            required
                            value={item.product}
                            onChange={(e) =>
                              updateItem(index, "product", e.target.value)
                            }
                            className="h-10 w-full rounded-lg border bg-card px-3 text-xs outline-none focus:border-primary"
                          >
                            <option value="">Select product</option>
                            {products.map((product) => (
                              <option
                                key={product.id}
                                value={product.id}
                                disabled={items.some(
                                  (other, i) =>
                                    i !== index &&
                                    Number(other.product) === product.id
                                )}
                              >
                                {product.name} — Stock: {product.stock}
                              </option>
                            ))}
                          </select>

                          {item.productData && (
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              SKU: {item.productData.sku || "—"} · Current stock:{" "}
                              {item.productData.stock}
                            </p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-1.5 block text-[10px] text-muted-foreground">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", e.target.value)
                            }
                            className="h-10 w-full rounded-lg border bg-card px-3 text-xs outline-none focus:border-primary"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-1.5 block text-[10px] text-muted-foreground">
                            Unit cost (৳)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={item.cost_price}
                            onChange={(e) =>
                              updateItem(index, "cost_price", e.target.value)
                            }
                            placeholder="0.00"
                            className="h-10 w-full rounded-lg border bg-card px-3 text-xs outline-none focus:border-primary"
                          />
                        </div>

                        <div className="flex flex-col justify-center md:col-span-2">
                          <label className="mb-1.5 text-[10px] text-muted-foreground">
                            Subtotal
                          </label>
                          <p className="h-10 flex items-center text-xs font-semibold tabular-nums">
                            {money(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium text-primary hover:bg-primary/5"
                >
                  <Plus className="size-3.5" />
                  Add another product
                </button>

                {products.length === 0 && (
                  <p className="mt-3 text-xs text-amber-600">
                    No products found. Create products from the Products page first.
                  </p>
                )}
              </div>

              {/* Summary */}
              <div className="ml-auto max-w-sm rounded-xl border bg-muted/20 p-4">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total items</span>
                  <span>{items.reduce(
                    (sum, item) => sum + (Number(item.quantity) || 0),
                    0
                  )}</span>
                </div>

                <div className="mt-3 flex justify-between border-t pt-3">
                  <span className="text-sm font-semibold">Grand total</span>
                  <span className="text-lg font-bold text-primary">
                    {money(grandTotal)}
                  </span>
                </div>

                <p className="mt-2 text-[10px] text-muted-foreground">
                  Final amount will be calculated and saved by the backend.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t p-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                disabled={saving}
                className="h-9 rounded-lg border px-4 text-xs font-medium hover:bg-muted"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || !suppliers.length || !products.length}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {saving && <RefreshCw className="size-3.5 animate-spin" />}
                Complete Purchase
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Purchase details modal */}
      {selectedPurchase && !showReturn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedPurchase(null);
          }}
        >
          <div className="my-5 w-full max-w-2xl rounded-xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="text-sm font-semibold">
                  Purchase PUR-{String(selectedPurchase.id).padStart(5, "0")}
                </h2>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {formatDate(selectedPurchase.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPurchase(null)}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-[10px] text-muted-foreground">Supplier</p>
                <p className="mt-1 text-sm font-semibold">
                  {getPurchaseSupplier(selectedPurchase)?.name ||
                    `Supplier #${selectedPurchase.supplier}`}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-112.5 text-left text-xs">
                  <thead>
                    <tr className="border-b text-[10px] uppercase text-muted-foreground">
                      <th className="py-2">Product</th>
                      <th className="py-2 text-right">Qty</th>
                      <th className="py-2 text-right">Unit cost</th>
                      <th className="py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {getPurchaseItems(selectedPurchase).map((item) => {
                      const productId = typeof item.product === "object"
                        ? item.product.id
                        : item.product;

                      const product = productMap.get(productId);

                      return (
                        <tr key={item.id}>
                          <td className="py-3 font-medium">
                            {product?.name ||
                              item.product?.name ||
                              `Product #${productId}`}
                          </td>
                          <td className="py-3 text-right">{item.quantity}</td>
                          <td className="py-3 text-right">
                            {money(item.cost_price)}
                          </td>
                          <td className="py-3 text-right font-semibold">
                            {money(item.subtotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between border-t pt-3">
                <span className="text-sm font-semibold">Total amount</span>
                <span className="text-lg font-bold text-primary">
                  {money(selectedPurchase.total_amount)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t p-4">
              <button
                type="button"
                onClick={() => openReturn(selectedPurchase)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium text-amber-600 hover:bg-amber-500/10"
              >
                <RotateCcw className="size-3.5" />
                Supplier Return
              </button>
              <button
                type="button"
                onClick={() => setSelectedPurchase(null)}
                className="h-9 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier return modal */}
      {showReturn && selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3">
          <form
            onSubmit={submitReturn}
            className="my-5 w-full max-w-2xl rounded-xl border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="text-sm font-semibold">Supplier return</h2>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Purchase PUR-{String(selectedPurchase.id).padStart(5, "0")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReturn(false)}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[65vh] space-y-3 overflow-y-auto p-4">
              {getPurchaseItems(selectedPurchase).map((item) => {
                const productId = typeof item.product === "object"
                  ? item.product.id
                  : item.product;

                const product = productMap.get(productId);
                const alreadyReturned = getAlreadyReturned(item);
                const remaining = Number(item.quantity) - alreadyReturned;

                const quantity = Number(
                  returnItems[item.id]?.quantity || 0
                );

                return (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold">
                          {product?.name ||
                            item.product?.name ||
                            `Product #${productId}`}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Purchased: {item.quantity} · Already returned:{" "}
                          {alreadyReturned} · Remaining: {remaining}
                        </p>
                      </div>

                      <p className="text-xs font-semibold">
                        {money(item.cost_price)}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <label className="text-[10px] text-muted-foreground">
                        Return quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={remaining}
                        value={quantity}
                        disabled={remaining <= 0}
                        onChange={(e) =>
                          setReturnItems((current) => ({
                            ...current,
                            [item.id]: {
                              quantity: e.target.value,
                              remaining,
                            },
                          }))
                        }
                        className="h-9 w-24 rounded-lg border bg-background px-3 text-xs outline-none focus:border-primary disabled:opacity-40"
                      />
                      <span className="ml-auto text-xs font-semibold">
                        {money(quantity * Number(item.cost_price))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t p-4">
              <div className="mb-4 flex justify-between">
                <span className="text-sm font-semibold">Return total</span>
                <span className="text-lg font-bold text-amber-600">
                  {money(returnTotal)}
                </span>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReturn(false)}
                  disabled={returning}
                  className="h-9 rounded-lg border px-4 text-xs font-medium hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={returning || returnTotal <= 0}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-600 px-4 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {returning && <RefreshCw className="size-3.5 animate-spin" />}
                  Confirm Return
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
