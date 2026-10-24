"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Package,
  Search,
  Coffee,
  UtensilsCrossed,
  Cake,
  Croissant,
  GlassWater,
  Boxes,
  RefreshCw,
} from "lucide-react";

const API_BASE_URL = "https://resturent-retail-pos-system.vercel.app/api/v1";

// API list fetch helper
async function fetchList(endpoint) {
  let url = `${API_BASE_URL}/${endpoint}/`;
  const allResults = [];

  while (url) {
    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${endpoint}: ${response.status}`
      );
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      allResults.push(...data);
      break;
    }

    // Paginated API
    if (Array.isArray(data.results)) {
      allResults.push(...data.results);
      url = data.next || "";
    } else {
      // Single object response হলে
      break;
    }
  }

  return allResults;
}

// Category icon mapping
const categoryIcons = {
  coffee: Coffee,
  food: UtensilsCrossed,
  desserts: Cake,
  bakery: Croissant,
  beverages: GlassWater,
  other: Boxes,
};

function getCategoryIcon(name = "") {
  const value = name.toLowerCase();

  if (value.includes("coffee")) return "coffee";

  if (
    value.includes("beverage") ||
    value.includes("drink") ||
    value.includes("juice")
  ) {
    return "beverages";
  }

  if (
    value.includes("dessert") ||
    value.includes("cake") ||
    value.includes("sweet")
  ) {
    return "desserts";
  }

  if (
    value.includes("bakery") ||
    value.includes("bread")
  ) {
    return "bakery";
  }

  if (
    value.includes("food") ||
    value.includes("burger") ||
    value.includes("meal")
  ) {
    return "food";
  }

  return "other";
}

function getImageUrl(product) {
  const imageUrl = product.image_url || product.image;

  if (typeof imageUrl !== "string" || !imageUrl.trim()) {
    return null;
  }

  return imageUrl.trim();
}

function money(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function CategoryIcon({ name, className = "size-5" }) {
  const Icon = categoryIcons[name] || Boxes;

  return <Icon className={className} />;
}

function StockBadge({ stock }) {
  if (stock <= 0) {
    return (
      <span className="inline-flex rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-600">
        Out of stock
      </span>
    );
  }

  if (stock <= 10) {
    return (
      <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600">
        Low stock
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">
      In stock
    </span>
  );
}

function ProductCard({ product, onView }) {
  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-lg">
      <button
        type="button"
        onClick={() => onView(product.id)}
        className="block w-full text-left"
      >
        <div className="relative aspect-4/3 overflow-hidden bg-muted">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="size-12 text-muted-foreground/40" />
            </div>
          )}

          <div className="absolute right-3 top-3">
            <StockBadge stock={product.stock} />
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div>
            <h3 className="line-clamp-1 font-semibold text-foreground transition-colors group-hover:text-primary">
              {product.name}
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              SKU: {product.sku || "N/A"}
            </p>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Selling price</p>
              <p className="text-lg font-bold text-primary">
                {money(product.price)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-muted-foreground">Stock</p>
              <p className="font-semibold text-foreground">
                {product.stock}
              </p>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

export default function SingleCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = String(params.id ?? "");

  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [categoryData, productData] = await Promise.all([
        fetchList("categories"),
        fetchList("products"),
      ]);

      setCategories(
        categoryData.map((item) => ({
          ...item,
          icon: getCategoryIcon(item.name || ""),
          status: item.is_active === false ? "Inactive" : "Active",
        }))
      );

      setAllProducts(
        productData.map((item) => ({
          id: item.id,
          name: item.name || "Unnamed product",
          sku: item.sku || "",
          barcode: item.barcode || "",
          categoryId:
            typeof item.category === "object"
              ? String(item.category?.id ?? "")
              : String(item.category ?? ""),
          cost: Number(item.cost_price ?? 0),
          price: Number(item.selling_price ?? 0),
          stock: Number(item.stock ?? 0),
          image: getImageUrl(item),
        }))
      );
    } catch (err) {
      setError(err.message || "Unable to load category data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // Load data when the page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const category = useMemo(
    () => categories.find((item) => String(item.id) === categoryId),
    [categories, categoryId]
  );

  const products = useMemo(() => {
    if (!category) return [];

    return allProducts.filter(
      (product) => product.categoryId === String(category.id)
    );
  }, [category, allProducts]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) =>
      [product.name, product.sku, product.barcode]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [products, search]);

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="size-5 animate-spin" />
          <span>Loading category and products...</span>
        </div>
      </div>
    );
  }

  // API error state
  if (error) {
    return (
      <div className="space-y-5 p-5 lg:p-8">
        <button
          type="button"
          onClick={() => router.push("/categories")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Back to categories
        </button>

        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-5">
          <p className="font-semibold text-rose-600">
            Failed to load category
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            {error}
          </p>

          <button
            type="button"
            onClick={loadData}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
          >
            <RefreshCw className="size-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Category not found
  if (!category) {
    return (
      <div className="space-y-5 p-5 lg:p-8">
        <button
          type="button"
          onClick={() => router.push("/categories")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Back to categories
        </button>

        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Package className="mx-auto size-12 text-muted-foreground/40" />

          <h2 className="mt-4 text-lg font-semibold">
            Category not found
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            This category does not exist or could not be loaded from the API.
          </p>
        </div>
      </div>
    );
  }

  const Icon = categoryIcons[category.icon] || Boxes;

  const totalStock = products.reduce(
    (total, product) => total + product.stock,
    0
  );

  const lowStockCount = products.filter(
    (product) => product.stock > 0 && product.stock <= 10
  ).length;

  const outOfStockCount = products.filter(
    (product) => product.stock <= 0
  ).length;

  return (
    <div className="space-y-6 p-5 lg:p-8">
      {/* Back navigation */}
      <button
        type="button"
        onClick={() => router.push("/categories")}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        Back to categories
      </button>

      {/* Category header */}
      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between lg:p-7">
        <div className="flex items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-8" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {category.name}
              </h1>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  category.status === "Active"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-rose-500/10 text-rose-600"
                }`}
              >
                {category.status}
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {category.description ||
                `Manage and view all products in the ${category.name} category.`}
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              Category ID: {category.id}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/products")}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Package className="size-4" />
          View all products
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total products</p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {products.length}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total stock units</p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {totalStock.toLocaleString("en-BD")}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Low stock products</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {lowStockCount}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Out of stock</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">
            {outOfStockCount}
          </p>
        </div>
      </div>

      {/* Products section */}
      <section className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Category products
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {filteredProducts.length} product
              {filteredProducts.length !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, SKU or barcode..."
              className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onView={(id) => router.push(`/products/${id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/50 px-5 py-14 text-center">
            <Package className="mx-auto size-12 text-muted-foreground/40" />

            <h3 className="mt-4 font-semibold text-foreground">
              {search
                ? "No matching products found"
                : "No products in this category"}
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              {search
                ? "Try searching with another product name, SKU or barcode."
                : "There are currently no products assigned to this category."}
            </p>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}