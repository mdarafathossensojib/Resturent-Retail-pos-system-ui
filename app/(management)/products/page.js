"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowDownToLine,
  Barcode,
  AlertTriangle,
  CheckCircle,
  Boxes,
  Edit3,
  Eye,
  Filter,
  Package,
  Plus,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";

const API_BASE =
  "https://resturent-retail-pos-system.vercel.app/api/v1";

const emptyForm = {
  name: "",
  sku: "",
  barcode: "",
  category: "",
  cost: "",
  price: "",
  stock: "",
};

// Reads common JWT access-token storage formats used by the login page.
function getAccessToken() {
  if (typeof window === "undefined") return null;

  const keys = ["access", "access_token", "accessToken", "authTokens", "tokens"];
  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (const key of keys) {
      const value = storage.getItem(key);
      if (!value) continue;
      try {
        const parsed = JSON.parse(value);
        const token = typeof parsed === "string" ? parsed : parsed.access || parsed.access_token || parsed.accessToken;
        if (token) return token;
      } catch {
        if (key !== "authTokens" && key !== "tokens") return value;
      }
    }
  }
  return null;
}

async function readApiError(response) {
  let data;
  try { data = await response.json(); } catch { data = null; }
  if (response.status === 401) return "Please log in again to continue.";
  if (response.status === 403) return "You don't have permission to perform this action.";
  if (response.status === 404) return "The requested product or category was not found.";
  if (response.status === 429) return "Too many requests. Please wait and try again.";
  if (response.status >= 500) return "The server encountered an error. Please try again later.";
  if (data && typeof data === "object") {
    const messages = Object.entries(data).flatMap(([key, value]) => {
      const values = Array.isArray(value) ? value : [value];
      return values.filter((v) => typeof v === "string").map((v) => key === "detail" || key === "non_field_errors" ? v : `${key}: ${v}`);
    });
    if (messages.length) return messages.join(" ");
  }
  return `Request failed (${response.status}). Please try again.`;
}

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function StockBadge({ stock, threshold = 10 }) {
  if (stock === 0) {
    return (
      <span className="rounded-full bg-rose-500/10 px-2 py-1 text-[10px] font-medium text-rose-600">
        Out of stock
      </span>
    );
  }

  if (stock <= threshold) {
    return (
      <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-600">
        Low stock
      </span>
    );
  }

  return (
    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-600">
      In stock
    </span>
  );
}

function ProductCard({ product, onView, onEdit, onDelete }) {
  const imageSrc = typeof product.imageUrl === "string" && product.imageUrl.trim()
    ? product.imageUrl.trim()
    : typeof product.image === "string" && product.image.trim()
      ? product.image.trim()
      : null;
      
  return (
    <article className="group overflow-hidden rounded-xl border bg-card transition-colors duration-200 hover:border-primary/40">
      {/* Product image */}
      <button
        type="button"
        onClick={onView}
        aria-label={`View ${product.name}`}
        className="relative flex aspect-5/3 w-full items-center justify-center overflow-hidden bg-muted/40"
      >
        
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Package className="size-11 text-muted-foreground/35 transition-transform duration-300 group-hover:scale-105" />
        )}

        <div className="absolute left-2 top-2">
          <StockBadge
            stock={product.stock}
            threshold={product.lowStockThreshold}
          />
        </div>

        <span className="absolute bottom-2 right-2 rounded-md bg-background/90 p-1.5 text-foreground opacity-0 shadow transition group-hover:opacity-100">
          <Eye className="size-3.5" />
        </span>
      </button>

      {/* Product details */}
      <div className="space-y-3 p-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-primary">
            {product.category || "Uncategorized"}
          </p>

          <button
            type="button"
            onClick={onView}
            className="mt-1 block w-full truncate text-left text-sm font-semibold hover:text-primary"
            title={product.name}
          >
            {product.name}
          </button>

          <div className="mt-1.5 space-y-1 text-[10px] text-muted-foreground">
            <p className="truncate">SKU: {product.sku || "—"}</p>

            {product.barcode && (
              <p className="flex min-w-0 items-center gap-1 truncate">
                <Barcode className="size-3 shrink-0" />
                <span className="truncate">{product.barcode}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between gap-2 border-t pt-2.5">
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">
              Selling price
            </p>

            <p className="mt-0.5 truncate text-sm font-bold tabular-nums">
              {money(product.price)}
            </p>

            <p className="mt-1 truncate text-[10px] text-muted-foreground">
              Cost: {money(product.cost)}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[10px] text-muted-foreground">Stock</p>

            <p className="mt-0.5 text-xs font-semibold tabular-nums">
              {product.stock} units
            </p>
          </div>
        </div>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onView}
            className="inline-flex h-8 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border px-1.5 text-xs font-medium transition hover:bg-muted"
          >
            <Eye className="size-3.5 shrink-0" />
            Details
          </button>

          <button
            type="button"
            onClick={onEdit}
            title="Edit product"
            aria-label={`Edit ${product.name}`}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border transition hover:bg-muted"
          >
            <Edit3 className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            title="Delete product"
            aria-label={`Delete ${product.name}`}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border text-muted-foreground transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-600"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ProductsPage() {
  const router = useRouter();

  const sentinelRef = useRef(null);
  const nextPageRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const [products, setProducts] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [nextPage, setNextPage] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [stockFilter, setStockFilter] = useState("All stock");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const formatProduct = useCallback((item, categoryMap) => {
    return {
      id: item.id,
      name: item.name,
      sku: item.sku || "",
      barcode: item.barcode || "",
      category:
        categoryMap.get(typeof item.category === "object" ? item.category?.id : item.category) ||
        (typeof item.category === "object" ? item.category?.name : null) ||
        `Category ${item.category ?? ""}`,
      categoryId: typeof item.category === "object" ? item.category?.id : item.category,
      cost: Number(item.cost_price ?? 0),
      price: Number(item.selling_price ?? 0),
      stock: Number(item.stock ?? 0),
      lowStockThreshold: Number(item.low_stock_threshold ?? 10),
      image: item.image || null,
      imageUrl: item.image_url || null,
    };
  }, []);

  // Load the first page and categories.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchInitialData() {
      try {
        setLoading(true);
        setError("");

        const [productsResponse, categoriesResponse] =
          await Promise.all([
            fetch(`${API_BASE}/products/`, {
              signal: controller.signal,
            }),
            fetch(`${API_BASE}/categories/`, {
              signal: controller.signal,
            }),
          ]);

        if (!productsResponse.ok) {
          throw new Error("Failed to fetch products.");
        }

        const productsData = await productsResponse.json();

        if (!categoriesResponse.ok) {
          throw new Error("Failed to fetch categories.");
        }

        const categoriesJson = await categoriesResponse.json();

        const categoryList = Array.isArray(categoriesJson)
          ? categoriesJson
          : categoriesJson.results || [];

        const categoryMap = new Map(
          categoryList.map((item) => [item.id, item.name])
        );

        const productList = Array.isArray(productsData)
          ? productsData
          : productsData.results || [];

        setCategoriesData(categoryList);

        setProducts(
          productList.map((item) =>
            formatProduct(item, categoryMap)
          )
        );

        setTotalCount(
          Array.isArray(productsData)
            ? productList.length
            : Number(productsData.count ?? productList.length)
        );

        const next =
          Array.isArray(productsData) ? null : productsData.next;

        nextPageRef.current = next;
        setNextPage(next);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong while loading products."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchInitialData();

    return () => controller.abort();
  }, [formatProduct]);

  // Load the next API page and append it to the existing list.
  const loadMoreProducts = useCallback(async () => {
    const url = nextPageRef.current;

    if (!url || loadingMoreRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    setLoadMoreError("");

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Could not load more products.");
      }

      const data = await response.json();

      const items = Array.isArray(data)
        ? data
        : data.results || [];

      const categoryMap = new Map(
        categoriesData.map((item) => [item.id, item.name])
      );

      const formattedItems = items.map((item) =>
        formatProduct(item, categoryMap)
      );

      setProducts((current) => {
        const existingIds = new Set(
          current.map((product) => product.id)
        );

        const newItems = formattedItems.filter(
          (product) => !existingIds.has(product.id)
        );

        return [...current, ...newItems];
      });

      const next = Array.isArray(data) ? null : data.next;

      nextPageRef.current = next;
      setNextPage(next);

      if (data.count != null) {
        setTotalCount(Number(data.count));
      }
    } catch (err) {
      setLoadMoreError(
        err instanceof Error
          ? err.message
          : "Could not load more products."
      );
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [categoriesData, formatProduct]);

  // Automatically load when the bottom sentinel enters the viewport.
  useEffect(() => {
    const target = sentinelRef.current;

    if (!target || !nextPage || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreProducts();
        }
      },
      {
        rootMargin: "240px 0px",
      }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [loadMoreProducts, nextPage, loading]);

  const categories = useMemo(() => {
    return [
      ...new Set(
        categoriesData.map((item) => item.name).filter(Boolean)
      ),
    ].sort();
  }, [categoriesData]);

  // Search and filters apply to products loaded so far.
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const searchFields = [
        product.name,
        product.sku,
        product.barcode,
        product.category,
      ];

      const matchesSearch = searchFields
        .filter(Boolean)
        .some((value) =>
          value.toLowerCase().includes(query)
        );

      const matchesCategory =
        category === "All categories" ||
        product.category === category;

      const threshold = product.lowStockThreshold;

      const matchesStock =
        stockFilter === "All stock" ||
        (stockFilter === "In stock" &&
          product.stock > threshold) ||
        (stockFilter === "Low stock" &&
          product.stock > 0 &&
          product.stock <= threshold) ||
        (stockFilter === "Out of stock" &&
          product.stock === 0);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStock
      );
    });
  }, [products, search, category, stockFilter]);

  const totalStock = products.reduce(
    (sum, product) => sum + product.stock,
    0
  );

  const lowStock = products.filter(
    (product) =>
      product.stock > 0 &&
      product.stock <= product.lowStockThreshold
  ).length;

  const outOfStock = products.filter(
    (product) => product.stock === 0
  ).length;

  function openCreateModal() {
    setEditingProduct(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(product) {
    setEditingProduct(product);

    setForm({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || "",
      category: String(product.categoryId ?? ""),
      cost: String(product.cost),
      price: String(product.price),
      stock: String(product.stock),
    });

    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!form.name.trim() || !form.sku.trim() || !form.category) {
      setFormError("Product name, SKU and category are required.");
      return;
    }
    if (form.cost === "" || form.price === "" || form.stock === "" ||
        !Number.isFinite(Number(form.cost)) || !Number.isFinite(Number(form.price)) ||
        !Number.isInteger(Number(form.stock)) || Number(form.cost) < 0 ||
        Number(form.price) < 0 || Number(form.stock) < 0) {
      setFormError("Enter valid non-negative prices and a whole-number stock quantity.");
      return;
    }

    const duplicateSku = products.some((product) =>
      product.sku.toLowerCase() === form.sku.trim().toLowerCase() &&
      product.id !== editingProduct?.id
    );
    if (duplicateSku) {
      setFormError("This SKU already exists in the loaded products. The server will also validate uniqueness.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setFormError("You need to log in before adding or editing products.");
      setToast({ type: "error", message: "You need to log in before adding or editing products." });
      return;
    }

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      barcode: form.barcode.trim() || null,
      category: Number(form.category),
      cost_price: Number(form.cost),
      selling_price: Number(form.price),
      stock: Number(form.stock),
    };

    setSaving(true);
    try {
      const isEdit = Boolean(editingProduct);
      const response = await fetch(`${API_BASE}/products/${isEdit ? `${editingProduct.id}/` : ""}`, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await readApiError(response);
        setFormError(message);
        setToast({ type: "error", message: response.status === 403 ? `You don't have permission to ${isEdit ? "edit" : "add"} products.` : message });
        return;
      }

      const saved = await response.json();
      const categoryMap = new Map(categoriesData.map((item) => [item.id, item.name]));
      const formatted = formatProduct(saved, categoryMap);
      setProducts((current) => isEdit
        ? current.map((item) => item.id === formatted.id ? formatted : item)
        : [formatted, ...current.filter((item) => item.id !== formatted.id)]
      );
      if (!isEdit) setTotalCount((count) => count + 1);
      setModalOpen(false);
      setForm(emptyForm);
      setEditingProduct(null);
      setToast({ type: "success", message: isEdit ? "Product updated successfully." : "Product created successfully." });
    } catch (err) {
      const message = err instanceof TypeError
        ? "Network error. Check your internet connection and API server/CORS settings."
        : err.message || "Something went wrong while saving the product.";
      setFormError(message);
      setToast({ type: "error", message });
    } finally {
      setSaving(false);
    }
  }

  function viewProduct(product) {
    router.push(`/products/${product.id}`);
  }

  async function deleteProduct(product) {
    const confirmed = window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    const token = getAccessToken();
    if (!token) {
      setToast({ type: "error", message: "You need to log in before deleting products." });
      return;
    }

    setDeletingId(product.id);
    try {
      const response = await fetch(`${API_BASE}/products/${product.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const message = await readApiError(response);
        setToast({ type: "error", message: response.status === 403 ? "You don't have permission to delete products." : message });
        return;
      }
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setTotalCount((count) => Math.max(0, count - 1));
      setToast({ type: "success", message: "Product deleted successfully." });
    } catch (err) {
      setToast({ type: "error", message: err instanceof TypeError ? "Network error. Check your connection and API server." : err.message || "Could not delete product." });
    } finally {
      setDeletingId(null);
    }
  }

  function exportCsv() {
    const columns = [
      "Name",
      "SKU",
      "Barcode",
      "Category",
      "Cost price",
      "Selling price",
      "Stock",
    ];

    const rows = filteredProducts.map((product) => [
      product.name,
      product.sku,
      product.barcode,
      product.category,
      product.cost,
      product.price,
      product.stock,
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
    link.download = "products.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5 p-4 lg:p-6">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            Catalog management
          </p>

          <h2 className="text-xl font-semibold tracking-tight">
            Products
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage products, pricing, barcodes and categories.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-card px-3 text-xs font-medium hover:bg-muted"
          >
            <ArrowDownToLine className="size-4" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" />
            Add product
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: "Total products",
            value: totalCount || products.length,
            icon: Package,
          },
          {
            label: "Loaded stock units",
            value: totalStock.toLocaleString(),
            icon: Boxes,
          },
          {
            label: "Loaded low stock",
            value: lowStock,
            icon: Filter,
          },
          {
            label: "Loaded out of stock",
            value: outOfStock,
            icon: Tags,
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

            <p className="mt-2 text-xl font-semibold tracking-tight">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Product catalog */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold">
              Product catalog
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              {filteredProducts.length} shown · {products.length} loaded of{" "}
              {totalCount || products.length}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:flex">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search name, SKU, barcode..."
                className="h-9 w-full rounded-lg border bg-background pl-8 pr-3 text-xs outline-none focus:border-primary lg:w-60"
              />
            </div>

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              className="h-9 rounded-lg border bg-background px-2.5 text-xs outline-none focus:border-primary"
            >
              <option>All categories</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(event) =>
                setStockFilter(event.target.value)
              }
              className="h-9 rounded-lg border bg-background px-2.5 text-xs outline-none focus:border-primary"
            >
              <option>All stock</option>
              <option>In stock</option>
              <option>Low stock</option>
              <option>Out of stock</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center px-5 py-16">
            <p className="text-sm text-muted-foreground">
              Loading products...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <p role="alert" className="text-sm text-rose-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 rounded-lg border px-4 py-2 text-sm hover:bg-muted"
            >
              Retry
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <Package className="size-10 text-muted-foreground/50" />

            <h3 className="mt-3 text-sm font-semibold">
              No products found
            </h3>

            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Search and filters apply to products loaded so far.
              Scroll down to load more products.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("All categories");
                setStockFilter("All stock");
              }}
              className="mt-4 text-xs font-medium text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 items-start gap-3 p-3 min-[480px]:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onView={() => viewProduct(product)}
                  onEdit={() => openEditModal(product)}
                  onDelete={() => deleteProduct(product)}
                />
              ))}
            </div>

            {/* Infinite scroll sentinel and fallback button */}
            <div
              ref={sentinelRef}
              className="flex min-h-16 items-center justify-center border-t px-4 py-4"
            >
              {loadingMore ? (
                <p className="text-xs text-muted-foreground">
                  Loading more products...
                </p>
              ) : loadMoreError ? (
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
                  <span role="alert" className="text-rose-600">
                    {loadMoreError}
                  </span>

                  <button
                    type="button"
                    onClick={loadMoreProducts}
                    className="rounded-md border px-3 py-1.5 hover:bg-muted"
                  >
                    Try again
                  </button>
                </div>
              ) : nextPage ? (
                <button
                  type="button"
                  onClick={loadMoreProducts}
                  className="rounded-lg border px-4 py-2 text-xs font-medium hover:bg-muted"
                >
                  Load more
                </button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  You’re all caught up · {products.length} products loaded
                </p>
              )}
            </div>
          </>
        )}
      </section>

      {/* Add / edit modal — currently local demo state */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModalOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            className="my-6 w-full max-w-2xl rounded-xl border bg-card shadow-2xl"
          >
            <div className="flex items-start justify-between border-b p-4">
              <div>
                <h3
                  id="product-modal-title"
                  className="text-base font-semibold"
                >
                  {editingProduct
                    ? "Edit product"
                    : "Add new product"}
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  Enter the product details below.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                aria-label="Close modal"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-4"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    key: "name",
                    label: "Product name",
                    required: true,
                    placeholder: "Enter product name",
                  },
                  {
                    key: "sku",
                    label: "SKU",
                    required: true,
                    placeholder: "e.g. COF-001",
                  },
                  {
                    key: "barcode",
                    label: "Barcode",
                    placeholder: "Enter barcode (optional)",
                  },
                  {
                    key: "category",
                    label: "Category",
                    required: true,
                    placeholder: "Enter category name",
                  },
                  {
                    key: "cost",
                    label: "Cost price (৳)",
                    required: true,
                    type: "number",
                    placeholder: "0.00",
                  },
                  {
                    key: "price",
                    label: "Selling price (৳)",
                    required: true,
                    type: "number",
                    placeholder: "0.00",
                  },
                  {
                    key: "stock",
                    label: "Initial stock",
                    required: true,
                    type: "number",
                    placeholder: "0",
                  },
                ].map((field) => (
                  <label
                    key={field.key}
                    className="flex flex-col gap-1.5 text-xs font-medium"
                  >
                    {field.label}

                    {field.key === "category" ? (
                      <select
                        required
                        value={form.category}
                        onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                        className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                      >
                        <option value="">Select a category</option>
                        {categoriesData.map((item) => (
                          <option key={item.id} value={String(item.id)}>{item.name}</option>
                        ))}
                      </select>
                    ) : <input
                      required={field.required}
                      type={field.type || "text"}
                      min={
                        field.type === "number"
                          ? "0"
                          : undefined
                      }
                      step={
                        field.key === "stock"
                          ? "1"
                          : field.type === "number"
                            ? "0.01"
                            : undefined
                      }
                      value={form[field.key]}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                    />}
                  </label>
                ))}
              </div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-600"
                >
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                  className="h-9 rounded-lg border px-4 text-xs font-medium hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="h-9 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingProduct ? "Save changes" : "Add product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div role={toast.type === "error" ? "alert" : "status"} className={`fixed right-5 top-20 z-100 flex max-w-md items-center gap-3 rounded-lg border px-4 py-3 shadow-xl ${toast.type === "error" ? "border-red-600/30 bg-red-950/95 text-red-100" : "border-green-600/30 bg-green-950/95 text-green-100"}`}>
          {toast.type === "error" ? <AlertTriangle className="size-5 shrink-0 text-red-400" /> : <CheckCircle className="size-5 shrink-0 text-green-400" />}
          <p className="text-sm font-medium">{toast.message}</p>
          <button type="button" onClick={() => setToast(null)} className="ml-2 shrink-0 opacity-80 hover:opacity-100" aria-label="Dismiss notification"><X className="size-4" /></button>
        </div>
      )}
    </div>
  );
}