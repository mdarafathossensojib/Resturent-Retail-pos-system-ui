"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  Banknote,
  Barcode,
  Bell,
  BriefcaseBusiness,
  Calculator,
  Check,
  ChevronDown,
  CircleHelp,
  CreditCard,
  LayoutDashboard,
  Minus,
  Package,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

const products = [
  {
    id: "1",
    name: "Classic Runner",
    category: "Footwear",
    price: 64.99,
    sku: "SH-1042",
    color: "bg-[#dbeafe]",
    tag: "Best seller",
  },
  {
    id: "2",
    name: "Everyday Tee",
    category: "Apparel",
    price: 24.5,
    sku: "AP-2201",
    color: "bg-[#fef3c7]",
  },
  {
    id: "3",
    name: "Canvas Low Top",
    category: "Footwear",
    price: 49.99,
    sku: "SH-1088",
    color: "bg-[#dcfce7]",
  },
  {
    id: "4",
    name: "City Backpack",
    category: "Accessories",
    price: 58,
    sku: "AC-3912",
    color: "bg-[#fce7f3]",
  },
  {
    id: "5",
    name: "Performance Sock",
    category: "Apparel",
    price: 12.99,
    sku: "AP-1920",
    color: "bg-[#e0e7ff]",
  },
  {
    id: "6",
    name: "Leather Belt",
    category: "Accessories",
    price: 34,
    sku: "AC-2880",
    color: "bg-[#ffedd5]",
  },
  {
    id: "7",
    name: "Trail Hiker",
    category: "Footwear",
    price: 89.99,
    sku: "SH-4410",
    color: "bg-[#cffafe]",
  },
  {
    id: "8",
    name: "Running Cap",
    category: "Accessories",
    price: 18.99,
    sku: "AC-1055",
    color: "bg-[#f3e8ff]",
  },
];

const money = (value) => `$${value.toFixed(2)}`;

export function PosTerminal() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All items");
  const [cart, setCart] = useState([
    { ...products[0], qty: 1 },
    { ...products[2], qty: 1 },
    { ...products[4], qty: 2 },
  ]);
  const [payment, setPayment] = useState("Card");
  const [completed, setCompleted] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const scanRef = useRef(null);

  useEffect(() => scanRef.current?.focus(), []);

  const filtered = useMemo(
    () =>
      products.filter((product) => {
        const matchesCategory =
          category === "All items" || product.category === category;
        const matchesQuery = `${product.name} ${product.sku}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesCategory && matchesQuery;
      }),
    [category, query],
  );

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  function addProduct(product) {
    setCart((current) =>
      current.some((item) => item.id === product.id)
        ? current.map((item) =>
            item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
          )
        : [...current, { ...product, qty: 1 }],
    );
    setQuery("");
    scanRef.current?.focus();
  }

  function scanProduct() {
    const found =
      products.find(
        (product) => product.sku.toLowerCase() === query.trim().toLowerCase(),
      ) ||
      products.find((product) =>
        product.name.toLowerCase().includes(query.trim().toLowerCase()),
      );
    if (found) addProduct(found);
  }

  function changeQuantity(id, amount) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, qty: item.qty + amount } : item,
        )
        .filter((item) => item.qty > 0),
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="flex h-16 items-center justify-between border-b bg-card px-5 lg:px-7">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShoppingBag className="size-5" />
          </div>
          <div>
            <p className="font-semibold tracking-tight">Northstar Market</p>
            <p className="text-xs text-muted-foreground">
              Store 04 · Register 02
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground sm:flex">
            <span className="size-2 rounded-full bg-emerald-500" />
            Scanner connected
          </div>
          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
          </button>
          <div className="flex items-center gap-2 border-l pl-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-800">
              JD
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium">Jordan Davis</p>
              <p className="text-xs text-muted-foreground">Cashier</p>
            </div>
            <ChevronDown className="size-4 text-muted-foreground" />
          </div>
        </div>
      </header>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="hidden w-20 shrink-0 flex-col items-center border-r bg-card py-5 md:flex lg:w-56 lg:items-stretch lg:px-3">
          <nav className="flex flex-col gap-2">
            <NavItem icon={LayoutDashboard} label="Checkout" active />
            <NavItem icon={ReceiptText} label="Orders" />
            <NavItem icon={Package} label="Products" />
            <NavItem icon={BriefcaseBusiness} label="Customers" />
            <NavItem icon={Calculator} label="Reports" />
          </nav>
          <nav className="mt-auto flex flex-col gap-2 border-t pt-4">
            <NavItem icon={Settings} label="Settings" />
            <NavItem icon={CircleHelp} label="Help center" />
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b bg-card px-4 py-4 lg:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  New sale
                </h1>
                <p className="text-sm text-muted-foreground">
                  Wednesday, August 20, 2026 · 10:42 AM
                </p>
              </div>
              <div className="flex gap-2">
                <button className="touch-button border bg-card text-foreground">
                  <ArrowDownToLine className="size-4" />
                  Hold order
                </button>
                <button
                  className="touch-button border bg-card text-foreground"
                  onClick={() => setCart([])}
                >
                  <X className="size-4" />
                  Clear cart
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-5 p-4 lg:p-7">
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Barcode className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary" />
                  <input
                    ref={scanRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.nativeEvent.isComposing &&
                        event.keyCode !== 229
                      )
                        scanProduct();
                    }}
                    placeholder="Scan barcode or search products..."
                    className="h-14 w-full rounded-xl border-2 border-primary/30 bg-card pl-12 pr-24 text-base shadow-sm outline-none transition focus:border-primary"
                  />
                  <kbd className="absolute right-4 top-1/2 -translate-y-1/2 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                    Enter
                  </kbd>
                </div>
                <button
                  className="touch-button justify-center bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={scanProduct}
                >
                  <Search className="size-4" />
                  Find product
                </button>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="mr-1 shrink-0 text-sm font-medium">
                  Quick add:
                </span>
                {["All items", "Footwear", "Apparel", "Accessories"].map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => setCategory(item)}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${category === item ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground ring-1 ring-border hover:bg-muted"}`}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
            </section>
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addProduct(product)}
                  className="product-tile group text-left"
                >
                  <div
                    className={`mb-3 flex h-28 items-center justify-center rounded-lg ${product.color}`}
                  >
                    <span className="text-4xl font-bold tracking-tight text-foreground/20">
                      {product.name
                        .split(" ")
                        .map((word) => word[0])
                        .join("")}
                    </span>
                    {product.tag && (
                      <span className="absolute right-3 top-3 rounded-full bg-card/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        {product.tag}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm font-semibold">
                    {product.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {product.sku} · {product.category}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-semibold">
                      {money(product.price)}
                    </span>
                    <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground">
                      <Plus className="size-4" />
                    </span>
                  </div>
                </button>
              ))}
            </section>
            <div className="mt-auto hidden items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground lg:flex">
              <span>
                <Barcode className="mr-2 inline size-4" />
                Ready for next scan
              </span>
              <span>F2 Search · F4 Hold order · F8 Pay</span>
            </div>
          </div>
        </div>
        <aside className="flex w-full shrink-0 flex-col border-l bg-card lg:w-95 xl:w-105">
          <div className="flex items-center justify-between border-b px-5 py-5">
            <div>
              <h2 className="font-semibold">Current order</h2>
              <p className="text-sm text-muted-foreground">
                #{completed ? "NS-240820-002" : "NS-240820-001"}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShoppingCart className="size-5" />
            </div>
          </div>
          <div className="flex min-h-48 flex-1 flex-col gap-1 overflow-y-auto p-5">
            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <ShoppingCart className="size-9 opacity-40" />
                <p className="font-medium">Cart is empty</p>
                <p className="text-xs">Scan an item to begin a sale</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 border-b py-3 last:border-0"
                >
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${item.color} text-xs font-bold text-foreground/30`}
                  >
                    {item.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {item.name}
                      </p>
                      <p className="text-sm font-semibold">
                        {money(item.price * item.qty)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {money(item.price)} each
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => changeQuantity(item.id, -1)}
                        className="flex size-7 items-center justify-center rounded-md border hover:bg-muted"
                        aria-label={`Decrease ${item.name}`}
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-5 text-center text-sm font-medium">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => changeQuantity(item.id, 1)}
                        className="flex size-7 items-center justify-center rounded-md border hover:bg-muted"
                        aria-label={`Increase ${item.name}`}
                      >
                        <Plus className="size-3" />
                      </button>
                      <button
                        onClick={() =>
                          setCart((current) =>
                            current.filter(
                              (cartItem) => cartItem.id !== item.id,
                            ),
                          )
                        }
                        className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t px-5 py-5">
            <button className="mb-4 flex w-full items-center gap-3 rounded-lg border border-dashed p-3 text-left hover:bg-muted">
              <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                <UserRound className="size-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Add customer</p>
                <p className="text-xs text-muted-foreground">
                  Optional · Find by name or phone
                </p>
              </div>
              <Plus className="size-4 text-muted-foreground" />
            </button>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({itemCount} items)</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{money(tax)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t pt-3 text-lg font-bold">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                ["Card", CreditCard],
                ["Cash", Banknote],
                ["Other", WalletCards],
              ].map(([label, Icon]) => (
                <button
                  key={label}
                  onClick={() => setPayment(label)}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border text-xs font-medium ${payment === label ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}
                >
                  <Icon className="size-5" />
                  {label}
                </button>
              ))}
            </div>
            <button
              disabled={cart.length === 0}
              onClick={() => setCompleted(true)}
              className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {completed ? (
                <>
                  <Check className="size-5" />
                  Sale completed
                </>
              ) : (
                <>
                  Charge {money(total)}{" "}
                  <ChevronDown className="size-4 -rotate-90" />
                </>
              )}
            </button>
            {completed && (
              <button
                onClick={() => setReceiptOpen(true)}
                className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border text-sm font-medium hover:bg-muted"
              >
                <Printer className="size-4" />
                Print receipt
              </button>
            )}
          </div>
        </aside>
      </div>
      {receiptOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-foreground/30 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Receipt preview"
        >
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold">Receipt preview</h2>
                <p className="text-xs text-muted-foreground">
                  Northstar Market · Register 02
                </p>
              </div>
              <button
                onClick={() => setReceiptOpen(false)}
                aria-label="Close receipt"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>
            <div className="my-5 border-y border-dashed py-4 text-sm">
              <div className="flex justify-between">
                <span>Order #NS-240820-002</span>
                <span>Aug 20, 2026</span>
              </div>
              {cart.map((item) => (
                <div key={item.id} className="mt-2 flex justify-between">
                  <span>
                    {item.qty} × {item.name}
                  </span>
                  <span>{money(item.price * item.qty)}</span>
                </div>
              ))}
              <div className="mt-4 flex justify-between border-t pt-3 font-semibold">
                <span>Total paid · {payment}</span>
                <span>{money(total)}</span>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-medium text-primary-foreground"
            >
              <Printer className="size-4" />
              Print receipt
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function NavItem({ icon: Icon, label, active = false }) {
  return (
    <button
      className={`flex min-h-12 items-center justify-center gap-3 rounded-lg px-3 text-sm font-medium lg:justify-start ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
    >
      <Icon className="size-5" />
      <span className="hidden lg:block">{label}</span>
    </button>
  );
}
