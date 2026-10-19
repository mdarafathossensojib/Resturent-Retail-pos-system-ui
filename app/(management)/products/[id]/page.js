
"use client";

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

// Temporary demo data.
// Later, this will come from the Django API.
const demoProducts = [
  {
    id: 1,
    name: "Americano",
    sku: "COF-001",
    barcode: "100000000001",
    category: "Coffee",
    cost: 80,
    price: 120,
    stock: 42,
    low_stock_threshold: 10,
    image: null,
    description: "A classic Americano coffee.",
    created_at: "2026-10-01",
  },
  {
    id: 2,
    name: "Apple Juice",
    sku: "JUI-002",
    barcode: "100000000002",
    category: "Beverages",
    cost: 55,
    price: 90,
    stock: 18,
    low_stock_threshold: 10,
    image: null,
    description: "Refreshing apple juice.",
    created_at: "2026-10-01",
  },
  {
    id: 3,
    name: "BBQ Burger",
    sku: "FD-003",
    barcode: "100000000003",
    category: "Food",
    cost: 150,
    price: 230,
    stock: 12,
    low_stock_threshold: 10,
    image: null,
    description: "A delicious BBQ burger.",
    created_at: "2026-10-01",
  },
  {
    id: 4,
    name: "Cappuccino",
    sku: "COF-004",
    barcode: "100000000004",
    category: "Coffee",
    cost: 100,
    price: 160,
    stock: 35,
    low_stock_threshold: 10,
    image: null,
    description: "Coffee with steamed milk foam.",
    created_at: "2026-10-01",
  },
  {
    id: 5,
    name: "Chocolate Cake",
    sku: "DS-005",
    barcode: "100000000005",
    category: "Desserts",
    cost: 90,
    price: 140,
    stock: 7,
    low_stock_threshold: 10,
    image: null,
    description: "Rich chocolate cake.",
    created_at: "2026-10-01",
  },
  {
    id: 6,
    name: "Mineral Water",
    sku: "DRK-006",
    barcode: "100000000006",
    category: "Beverages",
    cost: 15,
    price: 25,
    stock: 0,
    low_stock_threshold: 10,
    image: null,
    description: "Bottled mineral water.",
    created_at: "2026-10-01",
  },
];

const money = (value) =>
  `৳${Number(value).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

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
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="break-all text-right text-sm font-medium">
        {value || "Not provided"}
      </span>
    </div>
  );
}

function StatCard({ label, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export default function SingleProductPage() {
  const router = useRouter();
  const params = useParams();

  const productId = String(params.id ?? "");

  const product = demoProducts.find(
    (item) => String(item.id) === productId
  );

  if (!product) {
    return (
      <div className="space-y-5 p-5 lg:p-8">
        <button
          type="button"
          onClick={() => router.push("/products")}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to products
        </button>

        <div className="rounded-2xl border bg-card px-5 py-16 text-center">
          <Package className="mx-auto size-12 text-muted-foreground/50" />

          <h1 className="mt-4 text-xl font-semibold">
            Product not found
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            No demo product exists with ID {productId}.
          </p>

          <button
            type="button"
            onClick={() => router.push("/products")}
            className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Browse products
          </button>
        </div>
      </div>
    );
  }

  const profit = Number(product.price) - Number(product.cost);

  const profitMargin =
    Number(product.price) > 0
      ? (profit / Number(product.price)) * 100
      : 0;

  return (
    <div className="space-y-6 p-5 pb-10 lg:p-8">
      {/* Breadcrumb and actions */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => router.push("/products")}
              className="hover:text-primary"
            >
              Products
            </button>

            <ChevronRight className="size-3.5" />

            <span>{product.name}</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Product Details
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            View product information, pricing and inventory.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/products")}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border bg-card px-4 text-sm font-medium transition hover:bg-muted sm:self-auto"
        >
          <ArrowLeft className="size-4" />
          Back to products
        </button>
      </div>

      {/* Product overview */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="relative flex aspect-4/3 max-h-105 items-center justify-center overflow-hidden bg-muted/30">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 55vw"
                className="object-contain p-4"
              />
            ) : (
              <div className="flex size-32 items-center justify-center rounded-3xl bg-primary/10 text-primary sm:size-40">
                <Package className="size-20 sm:size-24" strokeWidth={1.2} />
              </div>
            )}

            <div className="absolute left-4 top-4">
              <StockStatus
                stock={product.stock}
                threshold={product.low_stock_threshold}
              />
            </div>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <Tag className="size-3.5" />
                {product.category}
              </span>

              <span className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                SKU: {product.sku}
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {product.name}
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {product.description || "No product description available."}
              </p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Selling price
              </p>

              <p className="mt-1 text-3xl font-bold tracking-tight text-primary">
                {money(product.price)}
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                Cost price: {money(product.cost)}
              </p>
            </div>
          </div>
        </section>

        {/* Inventory overview */}
        <section className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Boxes className="size-5" />
              </span>

              <div>
                <h2 className="font-semibold">Inventory overview</h2>
                <p className="text-sm text-muted-foreground">
                  Current stock information
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/50 p-4">
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

              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">
                  Stock threshold
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {product.low_stock_threshold}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Low-stock limit
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Stock level
                </span>
                <span className="font-medium">
                  {product.stock} units
                </span>
              </div>

              <div
                className="h-2.5 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label="Stock level"
                aria-valuemin={0}
                aria-valuemax={Math.max(
                  product.stock,
                  product.low_stock_threshold,
                  1
                )}
                aria-valuenow={product.stock}
              >
                <div
                  className={`h-full rounded-full transition-all ${
                    product.stock === 0
                      ? "bg-rose-500"
                      : product.stock <= product.low_stock_threshold
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${
                      product.stock === 0
                        ? 0
                        : Math.min(
                            100,
                            (product.stock /
                              Math.max(
                                product.stock,
                                product.low_stock_threshold * 2,
                                1
                              )) *
                              100
                          )
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Barcode className="size-5" />
              </span>

              <h2 className="font-semibold">Product information</h2>
            </div>

            <InfoRow label="Product ID" value={product.id} />
            <InfoRow label="SKU" value={product.sku} />
            <InfoRow label="Barcode" value={product.barcode} />
            <InfoRow label="Category" value={product.category} />
            <InfoRow
              label="Added on"
              value={
                product.created_at
                  ? new Date(
                      `${product.created_at}T00:00:00`
                    ).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "Not available"
              }
            />
          </div>
        </section>
      </div>

      {/* Pricing statistics */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          Pricing overview
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />

        <div>
          <p className="text-sm font-medium">Demo data</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            These details currently come from temporary frontend data.
            The values will be replaced with real product information
            from the Django API in a later step.
          </p>
        </div>
      </div>
    </div>
  );
}
