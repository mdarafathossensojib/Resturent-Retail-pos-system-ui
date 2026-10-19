
"use client";

import { useMemo, useState } from "react";
import {
  Boxes,
  Search,
  Package,
  AlertTriangle,
  CircleCheck,
  TrendingDown,
  SlidersHorizontal,
  ArrowDownToLine,
} from "lucide-react";

const initialProducts = [
  { id: 1, name: "Classic Runner", sku: "SH-1042", category: "Footwear", stock: 42, threshold: 10, cost: 38, price: 64.99 },
  { id: 2, name: "Everyday Tee", sku: "AP-2201", category: "Apparel", stock: 88, threshold: 15, cost: 12, price: 24.5 },
  { id: 3, name: "Canvas Low Top", sku: "SH-1088", category: "Footwear", stock: 17, threshold: 10, cost: 29, price: 49.99 },
  { id: 4, name: "City Backpack", sku: "AC-3912", category: "Accessories", stock: 8, threshold: 10, cost: 32, price: 58 },
  { id: 5, name: "Performance Sock", sku: "AP-1920", category: "Apparel", stock: 124, threshold: 20, cost: 5, price: 12.99 },
  { id: 6, name: "Leather Belt", sku: "AC-2880", category: "Accessories", stock: 3, threshold: 10, cost: 18, price: 34 },
  { id: 7, name: "Trail Hiker", sku: "SH-4410", category: "Footwear", stock: 26, threshold: 10, cost: 54, price: 89.99 },
  { id: 8, name: "Running Cap", sku: "AC-1055", category: "Accessories", stock: 55, threshold: 12, cost: 9, price: 18.99 },
];

const money = (amount) =>
  `৳ ${Number(amount).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function StockStatus({ product }) {
  if (product.stock === 0) {
    return (
      <span className="inline-flex rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-600">
        Out of stock
      </span>
    );
  }

  if (product.stock <= product.threshold) {
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

export default function InventoryPage() {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery =
        `${product.name} ${product.sku} ${product.category}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesCategory =
        category === "All" || product.category === category;

      const matchesStatus =
        status === "All" ||
        (status === "Low stock" &&
          product.stock > 0 &&
          product.stock <= product.threshold) ||
        (status === "Out of stock" && product.stock === 0) ||
        (status === "In stock" && product.stock > product.threshold);

      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [products, query, category, status]);

  const totalUnits = products.reduce((sum, product) => sum + product.stock, 0);
  const lowStock = products.filter(
    (product) => product.stock > 0 && product.stock <= product.threshold
  ).length;
  const outOfStock = products.filter((product) => product.stock === 0).length;
  const inventoryValue = products.reduce(
    (sum, product) => sum + product.stock * product.cost,
    0
  );

  function exportCsv() {
    const headers = [
      "Product",
      "SKU",
      "Category",
      "Stock",
      "Low Stock Threshold",
      "Cost Price",
      "Selling Price",
    ];

    const rows = filteredProducts.map((product) => [
      product.name,
      product.sku,
      product.category,
      product.stock,
      product.threshold,
      product.cost,
      product.price,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventory.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function adjustStock(id, amount) {
    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? { ...product, stock: Math.max(0, product.stock + amount) }
          : product
      )
    );
  }

  const summary = [
    {
      label: "Total Products",
      value: products.length,
      detail: "Products in inventory",
      Icon: Package,
      iconStyle: "bg-primary/10 text-primary",
    },
    {
      label: "Total Stock Units",
      value: totalUnits.toLocaleString(),
      detail: "Units currently available",
      Icon: Boxes,
      iconStyle: "bg-blue-500/10 text-blue-600",
    },
    {
      label: "Low Stock Items",
      value: lowStock,
      detail: "At or below threshold",
      Icon: AlertTriangle,
      iconStyle: "bg-amber-500/10 text-amber-600",
    },
    {
      label: "Out of Stock",
      value: outOfStock,
      detail: "Products with zero stock",
      Icon: TrendingDown,
      iconStyle: "bg-rose-500/10 text-rose-600",
    },
  ];

  return (
    <div className="space-y-6 p-5 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-primary">
            <Boxes className="size-4" />
            <span className="font-medium">Stock management</span>
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Inventory
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor stock levels and identify products that need replenishment.
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted"
        >
          <ArrowDownToLine className="size-4" />
          Export CSV
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map(({ label, value, detail, Icon, iconStyle }) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-3 text-2xl font-semibold">{value}</p>
              </div>
              <div className={`flex size-10 items-center justify-center rounded-xl ${iconStyle}`}>
                <Icon className="size-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Inventory value</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Estimated value at product cost price
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <CircleCheck className="size-5" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-semibold tracking-tight">
            {money(inventoryValue)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Based on the current demo inventory data
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-600" />
            <h3 className="font-semibold">Needs attention</h3>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {lowStock + outOfStock} products need a stock review.
          </p>
          <button
            onClick={() => setStatus("Low stock")}
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            Review low stock items →
          </button>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Stock overview</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Search products, filter categories and review stock status.
              </p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
              {filteredProducts.length} products
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, SKU or category..."
                className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="All">All categories</option>
              <option value="Footwear">Footwear</option>
              <option value="Apparel">Apparel</option>
              <option value="Accessories">Accessories</option>
            </select>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="All">All stock statuses</option>
              <option value="In stock">In stock</option>
              <option value="Low stock">Low stock</option>
              <option value="Out of stock">Out of stock</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-212.5 text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-4 font-medium">Product</th>
                <th className="px-5 py-4 font-medium">Category</th>
                <th className="px-5 py-4 font-medium">Stock level</th>
                <th className="px-5 py-4 font-medium">Cost price</th>
                <th className="px-5 py-4 font-medium">Selling price</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-t border-border transition-colors hover:bg-muted/30"
                >
                  <td className="px-5 py-4">
                    <div className="font-medium">{product.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      SKU: {product.sku}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {product.category}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{product.stock} units</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Threshold: {product.threshold}
                    </div>
                    <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${
                          product.stock <= product.threshold
                            ? "bg-amber-500"
                            : "bg-primary"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (product.stock / Math.max(product.threshold * 4, 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">{money(product.cost)}</td>
                  <td className="px-5 py-4 font-medium">
                    {money(product.price)}
                  </td>
                  <td className="px-5 py-4">
                    <StockStatus product={product} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        title="Decrease stock"
                        onClick={() => adjustStock(product.id, -1)}
                        disabled={product.stock === 0}
                        className="flex size-8 items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-40"
                      >
                        −
                      </button>
                      <button
                        title="Increase stock"
                        onClick={() => adjustStock(product.id, 1)}
                        className="flex size-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                      >
                        +
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="p-10 text-center">
              <SlidersHorizontal className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No products found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try another search term or filter.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
