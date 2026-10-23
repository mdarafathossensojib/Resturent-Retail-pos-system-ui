"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Barcode,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Edit3,
  Package,
  Tag,
  TrendingUp,
} from "lucide-react";

const API_BASE =
  "https://resturent-retail-pos-system.vercel.app/api/v1";

const money = (value) =>
  `৳${Number(value ?? 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function formatDate(value) {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StockStatus({ stock, threshold = 10 }) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-600">
        <CircleAlert className="size-3.5" />
        Out of stock
      </span>
    );
  }

  if (stock <= threshold) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600">
        <CircleAlert className="size-3.5" />
        Low stock
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600">
      <CheckCircle2 className="size-3.5" />
      In stock
    </span>
  );
}

function InfoRow({ label, value }) {
  const displayValue =
    value !== null && value !== undefined && value !== ""
      ? value
      : "Not provided";

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b py-3 last:border-b-0">
      <span className="text-xs text-muted-foreground sm:text-sm">
        {label}
      </span>

      <span className="max-w-[65%] break-all text-right text-xs font-medium sm:text-sm">
        {displayValue}
      </span>
    </div>
  );
}

function StatCard({ label, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground sm:text-sm">
          {label}
        </p>

        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
      </div>

      <p className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}

export default function SingleProductPage() {
  const router = useRouter();
  const params = useParams();

  const productId = String(params.id ?? "");

  const [product, setProduct] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProduct = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError("");
      setProduct(null);

      const [productResponse, categoriesResponse] =
        await Promise.all([
          fetch(`${API_BASE}/products/${productId}/`, {
            signal,
          }),
          fetch(`${API_BASE}/categories/`, {
            signal,
          }),
        ]);

      if (productResponse.status === 404) {
        setProduct(null);
        return;
      }

      if (!productResponse.ok) {
        throw new Error(
          `Failed to load product (${productResponse.status}).`
        );
      }

      const productData = await productResponse.json();

      let categoryList = [];

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();

        categoryList = Array.isArray(categoriesData)
          ? categoriesData
          : categoriesData.results || [];
      }

      const matchedCategory = categoryList.find(
        (item) => String(item.id) === String(productData.category)
      );

      setCategoryName(
        matchedCategory?.name ||
          (productData.category != null
            ? `Category ${productData.category}`
            : "Uncategorized")
      );

      setProduct({
        id: productData.id,
        name: productData.name || "Unnamed product",
        sku: productData.sku || "",
        barcode: productData.barcode || "",
        cost: Number(productData.cost_price ?? 0),
        price: Number(productData.selling_price ?? 0),
        stock: Number(productData.stock ?? 0),
        lowStockThreshold: Number(
          productData.low_stock_threshold ?? 10
        ),
        image: productData.image || null,
        imageUrl: productData.image_url || null,
        createdAt: productData.created_at || null,
        updatedAt: productData.updated_at || null,
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading this product."
        );
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [productId]);

  useEffect(() => {
    if (!productId || productId === "undefined") {
      return;
    }

    const controller = new AbortController();

    fetchProduct(controller.signal);

    return () => controller.abort();
  }, [fetchProduct, productId, router]);

  function goToEdit() {
    // Editing still uses the existing product modal.
    // The current modal does not yet persist changes to Django.
    router.push("/products");
  }

  const profit =
    product !== null ? product.price - product.cost : 0;

  const profitMargin =
    product && product.price > 0
      ? (profit / product.price) * 100
      : 0;

  const stockCapacity = product
    ? Math.max(product.stock, product.lowStockThreshold * 2, 1)
    : 1;

  const stockPercentage = product
    ? Math.min(100, (product.stock / stockCapacity) * 100)
    : 0;

  if (!productId || productId === "undefined") {
    return (
      <div className="rounded-xl border bg-card px-5 py-14 text-center">
        <CircleAlert className="mx-auto size-10 text-rose-500" />

        <h2 className="mt-3 text-base font-semibold">
          Invalid product ID
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          A valid product ID is required to display product details.
        </p>

        <button
          type="button"
          onClick={() => router.push("/products")}
          className="mt-5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
        >
          Back to products
        </button>
      </div>
    );
  }

  const imageSrc = typeof product?.imageUrl === "string" && product.imageUrl.trim()
    ? product.imageUrl.trim()
    : typeof product?.image === "string" && product.image.trim()
      ? product.image.trim()
      : null;

  return (
    <div className="space-y-5 p-4 pb-8 lg:p-6">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => router.push("/products")}
              className="transition hover:text-primary"
            >
              Products
            </button>

            <ChevronRight className="size-3.5" />

            <span className="max-w-48 truncate">
              {product?.name || "Product details"}
            </span>
          </div>

          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Product details
          </h1>

          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            View product information, pricing and inventory.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push("/products")}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-card px-3 text-xs font-medium transition hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
            Back to products
          </button>

          {product && (
            <button
              type="button"
              onClick={goToEdit}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition hover:opacity-90"
            >
              <Edit3 className="size-3.5" />
              Edit product
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex min-h-64 items-center justify-center rounded-xl border bg-card">
          <div className="text-center">
            <div className="mx-auto size-7 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />

            <p className="mt-3 text-sm text-muted-foreground">
              Loading product details...
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border bg-card px-5 py-14 text-center">
          <CircleAlert className="mx-auto size-10 text-rose-500" />

          <h2 className="mt-3 text-base font-semibold">
            Unable to load product
          </h2>

          <p role="alert" className="mt-2 text-sm text-muted-foreground">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
        </div>
      )}

      {/* Not found */}
      {!loading && !error && !product && (
        <div className="rounded-xl border bg-card px-5 py-14 text-center">
          <Package className="mx-auto size-12 text-muted-foreground/40" />

          <h2 className="mt-4 text-lg font-semibold">
            Product not found
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            No product was found with ID {productId}.
          </p>

          <button
            type="button"
            onClick={() => router.push("/products")}
            className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            Browse products
          </button>
        </div>
      )}

      {/* Product data */}
      {!loading && !error && product && (
        <>
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
            {/* Main product card */}
            <section className="overflow-hidden rounded-xl border bg-card">
              <div className="relative flex aspect-5/3 max-h-95 items-center justify-center overflow-hidden bg-muted/30">
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={product.name}
                    fill
                    priority
                    unoptimized
                    sizes="(max-width: 1280px) 100vw, 55vw"
                    className="object-contain p-5"
                  />
                ) : (
                  <div className="flex size-24 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:size-32">
                    <Package
                      className="size-14 sm:size-20"
                      strokeWidth={1.2}
                    />
                  </div>
                )}

                <div className="absolute left-3 top-3">
                  <StockStatus
                    stock={product.stock}
                    threshold={product.lowStockThreshold}
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary">
                    <Tag className="size-3.5" />
                    {categoryName || "Uncategorized"}
                  </span>

                  {product.sku && (
                    <span className="rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                      SKU: {product.sku}
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="wrap-break-word text-xl font-bold tracking-tight sm:text-2xl">
                    {product.name}
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Product ID: {product.id}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground">
                    Selling price
                  </p>

                  <p className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                    {money(product.price)}
                  </p>

                  <p className="mt-2 text-xs text-muted-foreground">
                    Cost price: {money(product.cost)}
                  </p>
                </div>
              </div>
            </section>

            {/* Inventory overview */}
            <div className="space-y-4">
              <section className="rounded-xl border bg-card p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Boxes className="size-5" />
                  </span>

                  <div>
                    <h2 className="text-sm font-semibold">
                      Inventory overview
                    </h2>

                    <p className="text-xs text-muted-foreground">
                      Current stock information
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">
                      Available stock
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {product.stock}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Units available
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">
                      Stock threshold
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {product.lowStockThreshold}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Low-stock limit
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">
                      Stock level
                    </span>

                    <span className="font-medium">
                      {product.stock} units
                    </span>
                  </div>

                  <div
                    className="h-2 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-label="Stock level"
                    aria-valuemin={0}
                    aria-valuemax={stockCapacity}
                    aria-valuenow={product.stock}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${
                        product.stock === 0
                          ? "bg-rose-500"
                          : product.stock <= product.lowStockThreshold
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      style={{ width: `${stockPercentage}%` }}
                    />
                  </div>

                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {product.stock === 0
                      ? "This product is currently out of stock."
                      : product.stock <= product.lowStockThreshold
                        ? "Stock is at or below the configured threshold."
                        : "Stock is above the configured threshold."}
                  </p>
                </div>
              </section>

              <section className="rounded-xl border bg-card p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Barcode className="size-4" />
                  </span>

                  <h2 className="text-sm font-semibold">
                    Product information
                  </h2>
                </div>

                <InfoRow label="Product ID" value={product.id} />
                <InfoRow label="SKU" value={product.sku} />
                <InfoRow label="Barcode" value={product.barcode} />
                <InfoRow label="Category" value={categoryName} />
                <InfoRow
                  label="Added on"
                  value={formatDate(product.createdAt)}
                />
                <InfoRow
                  label="Last updated"
                  value={formatDate(product.updatedAt)}
                />
              </section>
            </div>
          </div>

          {/* Pricing overview */}
          <section>
            <h2 className="mb-3 text-base font-semibold">
              Pricing overview
            </h2>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                label="Cost price"
                value={money(product.cost)}
                subtitle="Cost per unit"
                icon={Package}
              />

              <StatCard
                label="Selling price"
                value={money(product.price)}
                subtitle="Selling price per unit"
                icon={TrendingUp}
              />

              <StatCard
                label="Potential profit"
                value={money(profit)}
                subtitle={`Approx. ${profitMargin.toFixed(1)}% margin per unit`}
                icon={CalendarDays}
              />
            </div>
          </section>

          {/* Description is not included in the current API serializer. */}
          <section className="rounded-xl border bg-card p-4 sm:p-5">
            <h2 className="text-sm font-semibold">
              Description
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Description is not available from the current product API.
            </p>
          </section>
        </>
      )}
    </div>
  );
}