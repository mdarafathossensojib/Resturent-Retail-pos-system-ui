
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowDownToLine,
  Barcode,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Filter,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";

const initialProducts = [
  { id: 1, name: "Americano", sku: "COF-001", barcode: "100000000001", category: "Coffee", cost: 80, price: 120, stock: 42 },
  { id: 2, name: "Apple Juice", sku: "JUI-002", barcode: "100000000002", category: "Beverages", cost: 55, price: 90, stock: 18 },
  { id: 3, name: "BBQ Burger", sku: "FD-003", barcode: "100000000003", category: "Food", cost: 150, price: 230, stock: 12 },
  { id: 4, name: "Cappuccino", sku: "COF-004", barcode: "100000000004", category: "Coffee", cost: 100, price: 160, stock: 35 },
  { id: 5, name: "Chocolate Cake", sku: "DS-005", barcode: "100000000005", category: "Desserts", cost: 90, price: 140, stock: 7 },
  { id: 6, name: "Mineral Water", sku: "DRK-006", barcode: "100000000006", category: "Beverages", cost: 15, price: 25, stock: 0 },
];

const emptyForm = {
  name: "",
  sku: "",
  barcode: "",
  category: "",
  cost: "",
  price: "",
  stock: "",
};

const money = (value) =>
  `৳${Number(value).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function StockBadge({ stock }) {
  if (stock === 0) {
    return <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-600">Out of stock</span>;
  }

  if (stock <= 10) {
    return <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600">Low stock</span>;
  }

  return <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">In stock</span>;
}

function ProductCard({ product, onView, onEdit, onDelete }) {
  return (
    <div className="group overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      {/* Product image / fallback icon */}
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
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            ) : (
            <Package className="size-16 text-muted-foreground/40 transition-transform duration-300 group-hover:scale-110" />
            )}

        <div className="absolute left-3 top-3">
          <StockBadge stock={product.stock} />
        </div>

        <span className="absolute bottom-3 right-3 rounded-lg bg-background/90 p-2 text-foreground opacity-0 shadow transition group-hover:opacity-100">
          <Eye className="size-4" />
        </span>
      </button>

      {/* Product details */}
      <div className="space-y-4 p-4">
        <div>
          <p className="text-xs font-medium text-primary">
            {product.category || "Uncategorized"}
          </p>

          <button
            type="button"
            onClick={onView}
            className="mt-1 block w-full truncate text-left font-semibold hover:text-primary"
          >
            {product.name}
          </button>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>SKU: {product.sku}</span>
            {product.barcode && (
              <span className="flex items-center gap-1">
                <Barcode className="size-3.5" />
                {product.barcode}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 border-t pt-3">
          <div>
            <p className="text-xs text-muted-foreground">Selling price</p>
            <p className="mt-1 text-lg font-bold tabular-nums">
              {money(product.price)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cost: {money(product.cost)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground">Stock</p>
            <p className="mt-1 font-semibold tabular-nums">
              {product.stock} units
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onView}
            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition hover:bg-muted"
          >
            <Eye className="size-4" />
            Details
          </button>

          <button
            type="button"
            onClick={onEdit}
            title="Edit product"
            aria-label={`Edit ${product.name}`}
            className="flex h-9 items-center justify-center rounded-lg border px-3 transition hover:bg-muted"
          >
            <Edit3 className="size-4" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            title="Delete product"
            aria-label={`Delete ${product.name}`}
            className="flex h-9 items-center justify-center rounded-lg border px-3 text-muted-foreground transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-600"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
    const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [stockFilter, setStockFilter] = useState("All stock");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = [
        product.name,
        product.sku,
        product.barcode,
        product.category,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));

      const matchesCategory =
        category === "All categories" || product.category === category;

      const matchesStock =
        stockFilter === "All stock" ||
        (stockFilter === "In stock" && product.stock > 10) ||
        (stockFilter === "Low stock" &&
          product.stock > 0 &&
          product.stock <= 10) ||
        (stockFilter === "Out of stock" && product.stock === 0);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, category, stockFilter]);

  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const lowStock = products.filter(
    (product) => product.stock > 0 && product.stock <= 10
  ).length;
  const outOfStock = products.filter((product) => product.stock === 0).length;

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
      category: product.category,
      cost: String(product.cost),
      price: String(product.price),
      stock: String(product.stock),
    });
    setFormError("");
    setModalOpen(true);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!form.name.trim() || !form.sku.trim() || !form.category.trim()) {
      setFormError("Product name, SKU and category are required.");
      return;
    }

    if (
      form.cost === "" ||
      form.price === "" ||
      form.stock === "" ||
      Number(form.cost) < 0 ||
      Number(form.price) < 0 ||
      Number(form.stock) < 0
    ) {
      setFormError("Enter valid non-negative prices and stock quantity.");
      return;
    }

    const duplicateSku = products.some(
      (product) =>
        product.sku.toLowerCase() === form.sku.trim().toLowerCase() &&
        product.id !== editingProduct?.id
    );

    if (duplicateSku) {
      setFormError("This SKU already exists.");
      return;
    }

    const productData = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      barcode: form.barcode.trim(),
      category: form.category.trim(),
      cost: Number(form.cost),
      price: Number(form.price),
      stock: Number(form.stock),
    };

    if (editingProduct) {
      setProducts((current) =>
        current.map((product) =>
          product.id === editingProduct.id
            ? { ...product, ...productData }
            : product
        )
      );
    } else {
      setProducts((current) => [
        { id: Date.now(), ...productData },
        ...current,
      ]);
    }

    setModalOpen(false);
    setForm(emptyForm);
  }

  function viewProduct(product) {
    router.push(`/products/${product.id}`);
    }

  function deleteProduct(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}" from this demo list?`
    );

    if (!confirmed) return;

    setProducts((current) =>
      current.filter((item) => item.id !== product.id)
    );
  }

  function exportCsv() {
    const columns = ["Name", "SKU", "Barcode", "Category", "Cost price", "Selling price", "Stock"];

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
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
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
    <div className="space-y-6 p-5 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Catalog management
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">Products</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage products, pricing, barcodes and product categories.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportCsv}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium hover:bg-muted"
          >
            <ArrowDownToLine className="size-4" />
            Export CSV
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" />
            Add product
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total products", value: products.length, icon: Package },
          { label: "Total stock units", value: totalStock.toLocaleString(), icon: Boxes },
          { label: "Low stock items", value: lowStock, icon: Filter },
          { label: "Out of stock", value: outOfStock, icon: Tags },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-semibold">Product catalog</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {filteredProducts.length} products shown
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:flex">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, SKU, barcode..."
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary lg:w-64"
              />
            </div>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              <option>All categories</option>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
              className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              <option>All stock</option>
              <option>In stock</option>
              <option>Low stock</option>
              <option>Out of stock</option>
            </select>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <Package className="size-10 text-muted-foreground/50" />
            <h3 className="mt-3 font-semibold">No products found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different search or filter.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setCategory("All categories");
                setStockFilter("All stock");
              }}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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

            <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                Showing {filteredProducts.length} of {products.length} products
                </p>

                <div className="flex items-center gap-2">
                <button
                    disabled
                    className="rounded-lg border p-2 text-muted-foreground disabled:opacity-40"
                    aria-label="Previous page"
                >
                    <ChevronLeft className="size-4" />
                </button>

                <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground">
                    1
                </span>

                <button
                    disabled
                    className="rounded-lg border p-2 text-muted-foreground disabled:opacity-40"
                    aria-label="Next page"
                >
                    <ChevronRight className="size-4" />
                </button>
                </div>
            </div>
        </>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            className="my-6 w-full max-w-2xl rounded-2xl border bg-card shadow-2xl"
          >
            <div className="flex items-start justify-between border-b p-5">
              <div>
                <h3 id="product-modal-title" className="text-lg font-semibold">
                  {editingProduct ? "Edit product" : "Add new product"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the product details below.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                aria-label="Close modal"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { key: "name", label: "Product name", required: true, placeholder: "Enter product name" },
                  { key: "sku", label: "SKU", required: true, placeholder: "e.g. COF-001" },
                  { key: "barcode", label: "Barcode", placeholder: "Enter barcode (optional)" },
                  { key: "category", label: "Category", required: true, placeholder: "Enter category name" },
                  { key: "cost", label: "Cost price (৳)", required: true, type: "number", placeholder: "0.00" },
                  { key: "price", label: "Selling price (৳)", required: true, type: "number", placeholder: "0.00" },
                  { key: "stock", label: "Initial stock", required: true, type: "number", placeholder: "0" },
                ].map((field) => (
                  <label key={field.key} className="flex flex-col gap-2 text-sm font-medium">
                    {field.label}
                    <input
                      required={field.required}
                      type={field.type || "text"}
                      min={field.type === "number" ? "0" : undefined}
                      step={field.key === "stock" ? "1" : field.type === "number" ? "0.01" : undefined}
                      value={form[field.key]}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className="h-11 rounded-lg border bg-background px-3 outline-none focus:border-primary"
                    />
                  </label>
                ))}
              </div>

              {formError && (
                <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-10 rounded-lg border px-4 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  {editingProduct ? "Save changes" : "Add product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
