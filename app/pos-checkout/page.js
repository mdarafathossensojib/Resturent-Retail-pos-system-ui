"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Barcode,
  Banknote,
  Check,
  CheckCircle2,
  CreditCard,
  Minus,
  Package,
  Percent,
  Plus,
  ReceiptText,
  ScanLine,
  Search,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

// Demo products — API integration will be done later.
const DEMO_PRODUCTS = [
  {
    id: 1,
    name: "Classic Burger",
    sku: "BUR-001",
    category: "Fast Food",
    price: 250,
    stock: 18,
    emoji: "🍔",
    color: "bg-orange-100",
  },
  {
    id: 2,
    name: "Cheese Burger",
    sku: "BUR-002",
    category: "Fast Food",
    price: 320,
    stock: 12,
    emoji: "🍔",
    color: "bg-amber-100",
  },
  {
    id: 3,
    name: "Chicken Pizza",
    sku: "PIZ-001",
    category: "Fast Food",
    price: 450,
    stock: 8,
    emoji: "🍕",
    color: "bg-red-100",
  },
  {
    id: 4,
    name: "French Fries",
    sku: "SID-001",
    category: "Snacks",
    price: 120,
    stock: 25,
    emoji: "🍟",
    color: "bg-yellow-100",
  },
  {
    id: 5,
    name: "Chicken Sandwich",
    sku: "SAN-001",
    category: "Snacks",
    price: 180,
    stock: 14,
    emoji: "🥪",
    color: "bg-lime-100",
  },
  {
    id: 6,
    name: "Chocolate Cake",
    sku: "CAK-001",
    category: "Desserts",
    price: 220,
    stock: 6,
    emoji: "🍰",
    color: "bg-pink-100",
  },
  {
    id: 7,
    name: "Cold Coffee",
    sku: "DRK-001",
    category: "Beverages",
    price: 160,
    stock: 20,
    emoji: "🧋",
    color: "bg-amber-100",
  },
  {
    id: 8,
    name: "Mineral Water",
    sku: "DRK-002",
    category: "Beverages",
    price: 30,
    stock: 40,
    emoji: "💧",
    color: "bg-sky-100",
  },
  {
    id: 9,
    name: "Orange Juice",
    sku: "DRK-003",
    category: "Beverages",
    price: 100,
    stock: 16,
    emoji: "🧃",
    color: "bg-orange-100",
  },
  {
    id: 10,
    name: "Donut",
    sku: "DES-001",
    category: "Desserts",
    price: 90,
    stock: 11,
    emoji: "🍩",
    color: "bg-rose-100",
  },
  {
    id: 11,
    name: "Potato Chips",
    sku: "SNK-001",
    category: "Snacks",
    price: 50,
    stock: 30,
    emoji: "🥔",
    color: "bg-yellow-100",
  },
  {
    id: 12,
    name: "Pasta",
    sku: "FOD-001",
    category: "Fast Food",
    price: 280,
    stock: 9,
    emoji: "🍝",
    color: "bg-orange-100",
  },
];

const CATEGORIES = [
  "All items",
  "Fast Food",
  "Snacks",
  "Beverages",
  "Desserts",
];

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function POSCheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All items");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [discount, setDiscount] = useState("0");
  const [cashReceived, setCashReceived] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const [cartOpen, setCartOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [barcodeValue, setBarcodeValue] = useState("");

  // Product search and category filtering.
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return DEMO_PRODUCTS.filter((product) => {
      const categoryMatch =
        category === "All items" || product.category === category;

      const searchMatch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term);

      return categoryMatch && searchMatch;
    });
  }, [search, category]);

  // Cart calculations.
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const discountAmount = Math.min(
    subtotal,
    Math.max(0, Number(discount) || 0),
  );

  const total = Math.max(0, subtotal - discountAmount);

  const received = Math.max(0, Number(cashReceived) || 0);
  const change = Math.max(0, received - total);

  const itemCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  // Add product to cart.
  function addToCart(product) {
    setCart((current) => {
      const existing = current.find(
        (item) => item.id === product.id,
      );

      if (existing) {
        if (existing.quantity >= product.stock) {
          return current;
        }

        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return product.stock > 0
        ? [...current, { ...product, quantity: 1 }]
        : current;
    });
  }

  // Update cart quantity.
  function updateQuantity(id, amount) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.min(
                  item.stock,
                  item.quantity + amount,
                ),
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  // Add product using SKU/barcode input.
  function addBarcodeProduct(event) {
    event.preventDefault();

    const value = barcodeValue.trim().toLowerCase();

    const found = DEMO_PRODUCTS.find(
      (product) => product.sku.toLowerCase() === value,
    );

    if (found) {
      addToCart(found);
      setBarcodeValue("");
    } else if (value) {
      setSearch(barcodeValue.trim());
    }
  }

  // Demo checkout only.
  function completeSale() {
    if (!cart.length) return;

    if (paymentMethod === "Cash" && received < total) {
      return;
    }

    setLastOrder({
      number: `DEMO-${String(Date.now()).slice(-6)}`,
      total,
      itemCount,
      customer: customerName || "Walk-in customer",
    });

    setShowSuccess(true);
  }

  function resetSale() {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setDiscount("0");
    setCashReceived("");
    setPaymentMethod("Cash");
    setShowSuccess(false);
    setCartOpen(false);
  }

  // Shared cart and checkout panel.
  const cartPanel = (
    <div className="flex min-h-0 flex-col">
      {/* Cart header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShoppingCart size={18} />
          </div>

          <div>
            <h2 className="font-semibold">Current order</h2>
            <p className="text-xs text-muted-foreground">
              {itemCount} items
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCart([])}
          disabled={!cart.length}
          className="text-xs font-medium text-muted-foreground hover:text-destructive disabled:opacity-40"
        >
          Clear all
        </button>
      </div>

      {/* Customer information */}
      <div className="border-b border-border p-4">
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <UserRound size={14} />
          CUSTOMER
        </p>

        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Customer name (optional)"
          className="mb-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
        />

        <input
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="Phone number (optional)"
          inputMode="tel"
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* Cart items */}
        <div className="min-h-0 p-4">
          {!cart.length ? (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <ShoppingBag size={25} />
              </div>

              <p className="mt-3 text-sm font-semibold">
                Your cart is empty
              </p>

              <p className="mt-1 max-w-52 text-xs leading-5 text-muted-foreground">
                Select products from the catalog to start a new order.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pr-1">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-xl border border-border p-3"
                >
                  <div
                    className={`flex size-12 shrink-0 items-center justify-center rounded-lg text-2xl ${item.color}`}
                  >
                    {item.emoji}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {item.name}
                        </p>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {money(item.price)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setCart((current) =>
                            current.filter((x) => x.id !== item.id)
                          )
                        }
                        aria-label={`Remove ${item.name}`}
                        className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 rounded-lg border border-border p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          aria-label="Decrease quantity"
                          className="flex size-6 items-center justify-center rounded-md hover:bg-muted"
                        >
                          <Minus size={13} />
                        </button>

                        <span className="min-w-5 text-center text-xs font-semibold">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={item.quantity >= item.stock}
                          aria-label="Increase quantity"
                          className="flex size-6 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <p className="text-sm font-semibold">
                        {money(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Checkout summary */}
      <div className="space-y-3 border-t border-border p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{money(subtotal)}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="discount"
            className="flex items-center gap-1.5 text-sm text-muted-foreground"
          >
            <Percent size={14} />
            Discount (৳)
          </label>

          <input
            id="discount"
            type="number"
            min="0"
            max={subtotal}
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className="h-9 w-28 rounded-lg border border-border bg-background px-2 text-right text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center justify-between border-t border-dashed border-border pt-3">
          <span className="font-semibold">Total payable</span>
          <span className="text-xl font-bold text-primary">
            {money(total)}
          </span>
        </div>

        {/* Payment method */}
        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            PAYMENT METHOD
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Cash", Icon: Banknote },
              { label: "Card", Icon: CreditCard },
              { label: "Mobile", Icon: ReceiptText },
            ].map(({ label, Icon }) => (
              <button
                type="button"
                key={label}
                onClick={() => setPaymentMethod(label)}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-medium transition ${
                  paymentMethod === label
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Cash received and change */}
        {paymentMethod === "Cash" && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="cashReceived"
                className="mb-1.5 block text-xs text-muted-foreground"
              >
                Cash received (৳)
              </label>

              <input
                id="cashReceived"
                type="number"
                min="0"
                value={cashReceived}
                onChange={(e) =>
                  setCashReceived(e.target.value)
                }
                placeholder="0.00"
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <span className="mb-1.5 block text-xs text-muted-foreground">
                Change
              </span>

              <div className="flex h-10 items-center rounded-lg bg-muted px-3 text-sm font-semibold">
                {money(change)}
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={completeSale}
          disabled={
            !cart.length ||
            (paymentMethod === "Cash" && received < total)
          }
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CheckCircle2 size={17} />
          Complete sale
        </button>

        {paymentMethod === "Cash" &&
          cart.length > 0 &&
          received < total && (
            <p className="text-center text-[11px] text-amber-600">
              Received amount is less than the payable total.
            </p>
          )}

        <p className="text-center text-[10px] text-muted-foreground">
          Demo interface · No payment or sale will be submitted.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-muted/30 text-foreground">
      {/* Independent POS header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShoppingCart size={19} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base font-bold tracking-tight">
              Retail POS
            </h1>
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              Point of Sale
            </p>
          </div>

          <span className="ml-1 hidden h-7 w-px bg-border md:block" />

          <span className="hidden text-sm text-muted-foreground md:block">
            New sale
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-600 sm:inline-flex">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            POS ready
          </span>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium hover:bg-muted"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground lg:hidden"
            aria-label="Open cart"
          >
            <ShoppingCart size={17} />

            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_400px] xl:gap-6">
        {/* Product catalog */}
        <section className="min-w-0">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Sales terminal
              </p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Create new sale
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Find products and add them to the current order.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
              <ShoppingBag
                size={17}
                className="text-muted-foreground"
              />
              <div>
                <p className="text-[10px] text-muted-foreground">
                  Items in cart
                </p>
                <p className="text-sm font-semibold">
                  {itemCount} items
                </p>
              </div>
            </div>
          </div>

          {/* Barcode / SKU search */}
          <form
            onSubmit={addBarcodeProduct}
            className="mb-3 flex gap-2"
          >
            <div className="relative min-w-0 flex-1">
              <Barcode
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />

              <input
                value={barcodeValue}
                onChange={(e) =>
                  setBarcodeValue(e.target.value)
                }
                placeholder="Scan barcode or enter SKU and press Enter"
                className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <button
              type="submit"
              className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold hover:bg-muted sm:px-4"
            >
              <ScanLine size={16} />
              <span className="hidden sm:inline">Add item</span>
            </button>
          </form>

          {/* Product search */}
          <div className="relative mb-4">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name or SKU..."
              className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {/* Category filters */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                  category === item
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              Product catalog
            </h3>
            <span className="text-xs text-muted-foreground">
              {filteredProducts.length} products
            </span>
          </div>

          {/* Empty state */}
          {filteredProducts.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-4 text-center">
              <Package
                size={30}
                className="text-muted-foreground/50"
              />

              <p className="mt-3 text-sm font-semibold">
                No products found
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Try another product name or category.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("All items");
                }}
                className="mt-3 text-xs font-semibold text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredProducts.map((product) => {
                const inCart = cart.find(
                  (item) => item.id === product.id,
                );

                const unavailable = product.stock === 0;

                return (
                  <button
                    type="button"
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={
                      unavailable ||
                      (inCart?.quantity ?? 0) >= product.stock
                    }
                    className="group overflow-hidden rounded-2xl border border-border bg-card text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div
                      className={`relative flex aspect-5/4 items-center justify-center ${product.color}`}
                    >
                      <span className="text-5xl transition-transform duration-200 group-hover:scale-110">
                        {product.emoji}
                      </span>

                      {inCart && (
                        <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                          {inCart.quantity}
                        </span>
                      )}

                      {unavailable && (
                        <span className="absolute inset-0 flex items-center justify-center bg-background/75 text-xs font-semibold text-destructive">
                          Out of stock
                        </span>
                      )}
                    </div>

                    <div className="p-3">
                      <p className="truncate text-sm font-semibold">
                        {product.name}
                      </p>

                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {product.sku}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-primary">
                          {money(product.price)}
                        </span>

                        <span className="text-[10px] text-muted-foreground">
                          {product.stock} left
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Desktop cart */}
        <aside className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] min-h-0 overflow-y-auto rounded-2xl border border-border bg-card shadow-sm lg:block">
          {cartPanel}
        </aside>
      </main>

      {/* Mobile cart drawer */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setCartOpen(false)}
        >
          <section
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-semibold">
                Order & checkout
              </p>

              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="rounded-lg p-2 hover:bg-muted"
                aria-label="Close cart"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {cartPanel}
            </div>
          </section>
        </div>
      )}

      {/* Demo success modal */}
      {showSuccess && lastOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-2xl">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Check size={28} />
            </div>

            <h2 className="mt-4 text-lg font-bold">
              Demo checkout complete!
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              This is a UI preview. No sale was saved.
            </p>

            <div className="my-5 rounded-xl bg-muted/60 p-4 text-left">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Reference
                </span>
                <span className="font-semibold">
                  {lastOrder.number}
                </span>
              </div>

              <div className="mt-2 flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Customer
                </span>
                <span className="font-semibold">
                  {lastOrder.customer}
                </span>
              </div>

              <div className="mt-2 flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Items
                </span>
                <span className="font-semibold">
                  {lastOrder.itemCount}
                </span>
              </div>

              <div className="mt-3 flex justify-between border-t border-border pt-3">
                <span className="text-sm font-semibold">
                  Total
                </span>
                <span className="text-lg font-bold text-primary">
                  {money(lastOrder.total)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={resetSale}
              className="h-11 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Start new sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
