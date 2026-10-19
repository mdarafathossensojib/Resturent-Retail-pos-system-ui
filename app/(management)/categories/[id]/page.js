
"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Barcode,
  CheckCircle2,
  ChevronRight,
  Coffee,
  CupSoda,
  Package,
  Pencil,
  Search,
  Sandwich,
  CakeSlice,
  Cookie,
  Utensils,
  Layers3,
  CircleAlert,
  Tag,
  Boxes,
} from "lucide-react";
import { useMemo, useState } from "react";

const demoCategories = [
  {
    id: 1,
    name: "Coffee",
    description: "Hot and cold coffee beverages",
    icon: "coffee",
    status: "Active",
  },
  {
    id: 2,
    name: "Beverages",
    description: "Juices, water and soft drinks",
    icon: "beverages",
    status: "Active",
  },
  {
    id: 3,
    name: "Food",
    description: "Meals, burgers and savory items",
    icon: "food",
    status: "Active",
  },
  {
    id: 4,
    name: "Desserts",
    description: "Cakes, sweets and desserts",
    icon: "desserts",
    status: "Active",
  },
  {
    id: 5,
    name: "Bakery",
    description: "Fresh bread and baked goods",
    icon: "bakery",
    status: "Active",
  },
  {
    id: 6,
    name: "Snacks",
    description: "Light snacks and quick bites",
    icon: "snacks",
    status: "Active",
  },
];

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
    image: null,
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
    image: null,
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
    image: null,
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
    image: null,
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
    image: null,
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
    image: null,
  },
];

const categoryIcons = {
  coffee: Coffee,
  beverages: CupSoda,
  food: Sandwich,
  desserts: CakeSlice,
  bakery: Cookie,
  snacks: Utensils,
};

const money = (value) =>
  `৳${Number(value).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function CategoryIcon({ type, size = 22 }) {
  const Icon = categoryIcons[type] || Layers3;
  return <Icon size={size} strokeWidth={1.8} />;
}

function StockBadge({ stock }) {
  if (stock === 0) {
    return (
      <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-600">
        Out of stock
      </span>
    );
  }

  if (stock <= 10) {
    return (
      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600">
        Low stock
      </span>
    );
  }

  return (
    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">
      In stock
    </span>
  );
}

function ProductCard({ product, onView }) {
  return (
    <div className="group overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      <button
        type="button"
        onClick={onView}
        className="relative flex aspect-4/3 w-full items-center justify-center overflow-hidden bg-muted/40"
        aria-label={`View ${product.name}`}
      >
        {product.image ? (
            <Image 
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
        ) : (
          <Package className="size-16 text-muted-foreground/40 transition-transform group-hover:scale-110" />
        )}
      </button>

      <div className="space-y-4 p-4">
        <div>
          <h3 className="truncate font-semibold">{product.name}</h3>

          <p className="mt-1 text-xs text-muted-foreground">
            SKU: {product.sku}
          </p>

          {product.barcode && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Barcode className="size-3.5" />
              {product.barcode}
            </p>
          )}
        </div>

        <div className="flex items-end justify-between gap-2 border-t pt-3">
          <div>
            <p className="text-xs text-muted-foreground">Selling price</p>
            <p className="mt-1 font-bold">{money(product.price)}</p>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground">Stock</p>
            <p className="mt-1 font-semibold">{product.stock} units</p>
            <div className="mt-2">
              <StockBadge stock={product.stock} />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onView}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border text-sm font-medium transition hover:bg-muted"
        >
          View product
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

export default function SingleCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = String(params.id ?? "");

  const [search, setSearch] = useState("");

  const category = demoCategories.find(
    (item) => String(item.id) === categoryId
  );

  const products = useMemo(() => {
    if (!category) return [];

    return demoProducts.filter(
      (product) => product.category === category.name
    );
  }, [category]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) =>
      [
        product.name,
        product.sku,
        product.barcode,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [products, search]);

  if (!category) {
    return (
      <div className="space-y-5 p-5 lg:p-8">
        <button
          type="button"
          onClick={() => router.push("/categories")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to categories
        </button>

        <div className="rounded-2xl border bg-card px-5 py-16 text-center">
          <Layers3 className="mx-auto size-12 text-muted-foreground/50" />

          <h1 className="mt-4 text-xl font-semibold">
            Category not found
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            No demo category exists with ID {categoryId}.
          </p>

          <button
            type="button"
            onClick={() => router.push("/categories")}
            className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Browse categories
          </button>
        </div>
      </div>
    );
  }

  const totalStock = products.reduce(
    (sum, product) => sum + product.stock,
    0
  );

  const lowStockCount = products.filter(
    (product) => product.stock > 0 && product.stock <= 10
  ).length;

  const outOfStockCount = products.filter(
    (product) => product.stock === 0
  ).length;

  return (
    <div className="space-y-6 p-5 pb-10 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => router.push("/categories")}
              className="hover:text-primary"
            >
              Categories
            </button>

            <ChevronRight className="size-3.5" />

            <span>{category.name}</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Category Details
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Explore this category and its products.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/categories")}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border bg-card px-4 text-sm font-medium hover:bg-muted sm:self-auto"
        >
          <ArrowLeft className="size-4" />
          Back to categories
        </button>
      </div>

      {/* Category header */}
      <section className="rounded-2xl border bg-card p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:size-24">
            <CategoryIcon type={category.icon} size={42} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
                {category.status}
              </span>

              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                Category ID: {category.id}
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              {category.name}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {category.description || "No category description available."}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Package className="size-4" />
                {products.length} products
              </span>

              <span className="flex items-center gap-2">
                <Boxes className="size-4" />
                {totalStock} units in stock
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total products</p>
            <Package className="size-5 text-primary" />
          </div>
          <p className="mt-3 text-2xl font-semibold">{products.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            In this category
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Low stock</p>
            <CircleAlert className="size-5 text-amber-600" />
          </div>
          <p className="mt-3 text-2xl font-semibold">{lowStockCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Products needing attention
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Out of stock</p>
            <CircleAlert className="size-5 text-rose-600" />
          </div>
          <p className="mt-3 text-2xl font-semibold">{outOfStockCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Products unavailable
          </p>
        </div>
      </div>

      {/* Products */}
      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-col gap-4 border-b p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold">Products in {category.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {filteredProducts.length} products shown
            </p>
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, SKU or barcode..."
              className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onView={() => router.push(`/products/${product.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="px-5 py-16 text-center">
            <Package className="mx-auto size-10 text-muted-foreground/50" />

            <h3 className="mt-3 font-semibold">
              {search ? "No matching products" : "No products in this category"}
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              {search
                ? "Try a different search term."
                : "Products assigned to this category will appear here."}
            </p>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 text-sm font-medium text-primary hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />

        <div>
          <p className="text-sm font-medium">Demo data</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            This page currently uses temporary category and product data.
            We will connect it to the Django API later.
          </p>
        </div>
      </div>
    </div>
  );
}
