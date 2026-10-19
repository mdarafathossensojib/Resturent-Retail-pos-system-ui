
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Coffee,
  CupSoda,
  Sandwich,
  CakeSlice,
  Cookie,
  Utensils,
  Layers3,
  Package,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Tag,
} from "lucide-react";

const initialCategories = [
  {
    id: 1,
    name: "Coffee",
    description: "Hot and cold coffee beverages",
    icon: "coffee",
    productCount: 12,
    status: "Active",
  },
  {
    id: 2,
    name: "Beverages",
    description: "Juices, water and soft drinks",
    icon: "beverages",
    productCount: 10,
    status: "Active",
  },
  {
    id: 3,
    name: "Food",
    description: "Meals, burgers and savory items",
    icon: "food",
    productCount: 8,
    status: "Active",
  },
  {
    id: 4,
    name: "Desserts",
    description: "Cakes, sweets and desserts",
    icon: "desserts",
    productCount: 7,
    status: "Active",
  },
  {
    id: 5,
    name: "Bakery",
    description: "Fresh bread and baked goods",
    icon: "bakery",
    productCount: 6,
    status: "Active",
  },
  {
    id: 6,
    name: "Snacks",
    description: "Light snacks and quick bites",
    icon: "snacks",
    productCount: 7,
    status: "Active",
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

const emptyForm = {
  name: "",
  description: "",
  icon: "coffee",
};

function CategoryIcon({ type, size = 22 }) {
  const Icon = categoryIcons[type] || Layers3;

  return <Icon size={size} strokeWidth={1.8} />;
}

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">
            {value}
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        </div>

        <div className="rounded-xl bg-red-50 p-3 text-red-600 dark:bg-red-950/40 dark:text-red-400">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch =
        category.name.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || category.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const totalProducts = categories.reduce(
    (total, category) => total + category.productCount,
    0
  );

  const activeCategories = categories.filter(
    (category) => category.status === "Active"
  ).length;

  const emptyCategories = categories.filter(
    (category) => category.productCount === 0
  ).length;

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(category) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description,
      icon: category.icon,
    });
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      setError("Category name is required.");
      return;
    }

    const duplicate = categories.some(
      (category) =>
        category.name.toLowerCase() === name.toLowerCase() &&
        category.id !== editingId
    );

    if (duplicate) {
      setError("A category with this name already exists.");
      return;
    }

    if (editingId !== null) {
      setCategories((current) =>
        current.map((category) =>
          category.id === editingId
            ? { ...category, name, description, icon: form.icon }
            : category
        )
      );
    } else {
      const newCategory = {
        id: Date.now(),
        name,
        description,
        icon: form.icon,
        productCount: 0,
        status: "Active",
      };

      setCategories((current) => [newCategory, ...current]);
    }

    closeModal();
  }

  function handleDelete(category) {
    if (category.productCount > 0) {
      window.alert(
        "This category contains products. Move or reassign those products before deleting it."
      );
      return;
    }

    if (window.confirm(`Delete the "${category.name}" category?`)) {
      setCategories((current) =>
        current.filter((item) => item.id !== category.id)
      );
    }
  }

  function exportCSV() {
    const rows = [
      ["ID", "Category", "Description", "Products", "Status"],
      ...filteredCategories.map((category) => [
        category.id,
        category.name,
        category.description,
        category.productCount,
        category.status,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "categories.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span>Catalog</span>
            <ChevronRight size={15} />
            <span className="text-zinc-900 dark:text-zinc-100">
              Categories
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            Categories
          </h1>

          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Organize and manage your product categories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Download size={17} />
            Export CSV
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Categories"
          value={categories.length}
          subtitle="All catalog categories"
          icon={Layers3}
        />
        <StatCard
          title="Active Categories"
          value={activeCategories}
          subtitle="Currently active"
          icon={Tag}
        />
        <StatCard
          title="Products Assigned"
          value={totalProducts}
          subtitle="Across all categories"
          icon={Package}
        />
        <StatCard
          title="Empty Categories"
          value={emptyCategories}
          subtitle="No products assigned"
          icon={FolderIcon}
        />
      </div>

      {/* Search and filters */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search categories..."
              className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 outline-none focus:border-red-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 sm:min-w-40"
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            Showing {filteredCategories.length} of {categories.length} categories
          </span>
          {(search || statusFilter !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
              }}
              className="font-medium text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Category grid */}
      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                    <CategoryIcon type={category.icon} size={23} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-zinc-900 dark:text-white">
                      {category.name}
                    </h3>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        category.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {category.status}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(category)}
                    aria-label={`Edit ${category.name}`}
                    title="Edit category"
                    className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    aria-label={`Delete ${category.name}`}
                    title="Delete category"
                    className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <p className="mt-4 min-h-10 text-sm leading-5 text-zinc-500 dark:text-zinc-400">
                {category.description || "No description provided."}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <Package size={17} />
                  Products
                </div>

                <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {category.productCount}
                </span>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/categories/${category.id}`)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                View category
                <ChevronRight className="size-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-5 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <Layers3 size={25} />
          </div>

          <h3 className="mt-4 font-semibold text-zinc-900 dark:text-white">
            No categories found
          </h3>

          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Try a different search or create a new category.
          </p>

          <button
            type="button"
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
          >
            <Plus size={17} />
            Add Category
          </button>
        </div>
      )}

      {/* Add/Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="category-modal-title"
                  className="text-xl font-semibold text-zinc-900 dark:text-white"
                >
                  {editingId !== null ? "Edit Category" : "Add Category"}
                </h2>

                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {editingId !== null
                    ? "Update the category details."
                    : "Create a category for organizing products."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close modal"
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="category-name"
                  className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-200"
                >
                  Category Name <span className="text-red-500">*</span>
                </label>

                <input
                  id="category-name"
                  autoFocus
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(event) => {
                    setForm({ ...form, name: event.target.value });
                    setError("");
                  }}
                  placeholder="e.g. Coffee"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="category-description"
                  className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-200"
                >
                  Description
                </label>

                <textarea
                  id="category-description"
                  rows={3}
                  maxLength={500}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Briefly describe this category..."
                  className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Category Icon
                </label>

                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {Object.keys(categoryIcons).map((type) => {
                    const selected = form.icon === type;

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm({ ...form, icon: type })}
                        aria-label={`Select ${type} icon`}
                        title={type}
                        className={`flex h-12 items-center justify-center rounded-xl border transition ${
                          selected
                            ? "border-red-500 bg-red-50 text-red-600 ring-2 ring-red-500/10 dark:bg-red-950/40 dark:text-red-400"
                            : "border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <CategoryIcon type={type} size={21} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400"
                >
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  {editingId !== null ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FolderIcon({ size = 21 }) {
  return <Layers3 size={size} />;
}
