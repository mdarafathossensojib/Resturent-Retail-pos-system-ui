"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Barcode,
  Check,
  Package,
  ScanLine,
  Search,
  ShoppingBag,
  ShoppingCart,
  X,
} from "lucide-react";
import CartPanelContent from "@/components/pos/cartPanelContent";
import Image from "next/image";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://resturent-retail-pos-system.vercel.app/api/v1";

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function getImageUrl(image) {
  if (!image) return "";

  if (typeof image === "object") {
    image = image.secure_url || image.url || "";
  }

  if (typeof image !== "string") return "";
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  if (image.startsWith("/")) return image;
  if (image.startsWith("image/")) {
    return `https://res.cloudinary.com/mdarafathossen/${image}`;
  }
  return "";
}

function getErrorMessage(data) {
  if (!data) return "Something went wrong.";

  if (typeof data === "string") return data;

  if (data.detail) return data.detail;

  if (data.non_field_errors) {
    return data.non_field_errors.join(", ");
  }

  return Object.entries(data)
    .map(([key, value]) => {
      const message = Array.isArray(value)
        ? value.join(", ")
        : typeof value === "object"
          ? JSON.stringify(value)
          : value;

      return `${key}: ${message}`;
    })
    .join(" | ");
}

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}



export default function POSCheckoutPage() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

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

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [pendingPayment, setPendingPayment] = useState(null);

  // Authentication token.
  function getAccessToken() {
    try {
      const tokens = JSON.parse(
        localStorage.getItem("authTokens") || "{}"
      );

      return tokens.access || null;
    } catch {
      return null;
    }
  }

  // Common API request function.
  async function apiRequest(endpoint, options = {}) {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      throw new Error("Please login first.");
    }

    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `JWT ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => null);

    if (response.status === 401) {
      router.push("/login");
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      throw new Error(getErrorMessage(data));
    }

    return data;
  }

  // Fetch all paginated API results.
  async function fetchAllPages(endpoint) {
    let nextUrl = `${API_BASE}${endpoint}`;
    let allItems = [];

    while (nextUrl) {
      const data = await apiRequest(nextUrl);

      allItems = [...allItems, ...getList(data)];

      if (!data?.next) {
        nextUrl = null;
      } else if (data.next.startsWith("http")) {
        nextUrl = data.next;
      } else if (data.next.startsWith("/")) {
        nextUrl = new URL(
          data.next,
          new URL(API_BASE).origin
        ).toString();
      } else {
        nextUrl = new URL(data.next, nextUrl).toString();
      }
    }

    return allItems;
  }

  // Normalize product data from API.
  function normalizeProduct(product) {
    return {
      id: product.id,
      name: product.name,
      sku: product.sku || "",
      barcode: product.barcode || "",
      category:
        typeof product.category === "object"
          ? product.category?.name || ""
          : product.category_name || "",
      categoryId:
        typeof product.category === "object"
          ? product.category?.id
          : product.category,
      price: Number(product.selling_price || 0),
      stock: Number(product.stock || 0),
      image: getImageUrl(product.image_url) || getImageUrl(product.image),
    };
  }

  // Load products and categories.
  async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const [productList, categoryList] = await Promise.all([
          fetchAllPages("/products/"),
          fetchAllPages("/categories/"),
        ]);

        setProducts(productList.map(normalizeProduct));
        setCategories(categoryList);
      } catch (err) {
        setError(err.message || "Failed to load products.");
      } finally {
        setLoading(false);
      }
    }

  // Load products on component mount.
  useEffect(() => {
    loadProducts();
  }, []);

  // Product filtering.
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const categoryMatch =
        category === "All items" ||
        product.category === category;

      const searchMatch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term) ||
        product.barcode.toLowerCase().includes(term);

      return categoryMatch && searchMatch;
    });
  }, [products, search, category]);

  // Cart calculations.
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const discountAmount = Math.min(
    subtotal,
    Math.max(0, Number(discount) || 0)
  );

  const total = Math.max(0, subtotal - discountAmount);

  const received = Math.max(0, Number(cashReceived) || 0);
  const change = Math.max(0, received - total);

  const itemCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // Add product to cart.
  function addToCart(product) {
    setError("");

    if (product.stock <= 0) {
      setError(`${product.name} is out of stock.`);
      return;
    }

    setCart((current) => {
      const existing = current.find(
        (item) => item.id === product.id
      );

      if (existing) {
        if (existing.quantity >= product.stock) {
          return current;
        }

        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
  }

  // Update quantity.
  function updateQuantity(id, amount) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.min(
                  item.stock,
                  item.quantity + amount
                ),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  // SKU / barcode lookup.
  function addBarcodeProduct(event) {
    event.preventDefault();

    const value = barcodeValue.trim().toLowerCase();
    if (!value) return;

    const found = products.find(
      (product) =>
        product.sku.toLowerCase() === value ||
        product.barcode.toLowerCase() === value
    );

    if (found) {
      addToCart(found);
      setBarcodeValue("");
    } else {
      setSearch(barcodeValue.trim());
      setError("Product not found. Check SKU or barcode.");
    }
  }

  // Find existing customer or create a new customer.
  async function resolveCustomer() {
    const phone = customerPhone.trim();
    const name = customerName.trim();

    if (!phone) {
      return null;
    }

    const lookup = await apiRequest(
      `/customers/lookup/?phone=${encodeURIComponent(phone)}`
    );

    if (lookup.found && lookup.customer) {
      return lookup.customer.id;
    }

    if (!name) {
      throw new Error(
        "For a New customer, provide customer name."
      );
    }

    const customer = await apiRequest("/customers/", {
      method: "POST",
      body: JSON.stringify({
        name,
        phone,
      }),
    });

    return customer.id;
  }

  // Submit payment for an already-created sale.
  async function submitPayment(saleId, payableAmount) {
    const methodMap = {
      Cash: "cash",
      Card: "card",
      Mobile: "mobile_banking",
    };

    const amountReceived =
      paymentMethod === "Cash"
        ? received
        : payableAmount;

    const payment = await apiRequest("/payments/", {
      method: "POST",
      body: JSON.stringify({
        sale: saleId,
        method: methodMap[paymentMethod],
        amount_received: amountReceived.toFixed(2),
      }),
    });

    return payment;
  }

  // Complete sale.
  async function completeSale() {
    if (!cart.length || submitting) return;

    if (paymentMethod === "Cash" && received < total) {
      setError("Received amount is less than payable total.");
      return;
    }

    if (pendingPayment) {
      await retryPayment();
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      // Step 1: Resolve customer.
      const customerId = await resolveCustomer();

      // Step 2: Create sale.
      const sale = await apiRequest("/sales/", {
        method: "POST",
        body: JSON.stringify({
          customer: customerId,
          items: cart.map((item) => ({
            product: item.id,
            quantity: item.quantity,
          })),
          discount_amount: discountAmount.toFixed(2),
          tax_amount: "0.00",
        }),
      });

      // Step 3: Save pending payment information.
      const saleId = sale.id;

      if (!saleId) {
        throw new Error(
          "Sale created but API did not return sale ID."
        );
      }

      setPendingPayment({
        saleId,
        payableAmount: Number(
          sale.final_amount ?? total
        ),
        invoiceNumber: sale.invoice_number || `SALE-${saleId}`,
        customer: customerName || "Walk-in customer",
        itemCount,
      });

      // Step 4: Submit payment.
      const payment = await submitPayment(
        saleId,
        Number(sale.final_amount ?? total)
      );

      // Step 5: Payment successful.
      setLastOrder({
        number: sale.invoice_number || `SALE-${saleId}`,
        total: Number(sale.final_amount ?? total),
        itemCount,
        customer: customerName || "Walk-in customer",
        change: Number(payment.change_amount || 0),
      });

      setPendingPayment(null);
      setShowSuccess(true);

      // Refresh product stock.
      await loadProducts();
    } catch (err) {
      setError(err.message || "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  }

  // Retry payment without creating another sale.
  async function retryPayment() {
    if (!pendingPayment || submitting) return;

    try {
      setSubmitting(true);
      setError("");

      const payment = await submitPayment(
        pendingPayment.saleId,
        pendingPayment.payableAmount
      );

      setLastOrder({
        number: pendingPayment.invoiceNumber,
        total: pendingPayment.payableAmount,
        itemCount: pendingPayment.itemCount,
        customer: pendingPayment.customer,
        change: Number(payment.change_amount || 0),
      });

      setPendingPayment(null);
      setShowSuccess(true);

      await loadProducts();
    } catch (err) {
      setError(
        `Payment failed. Sale ID: ${pendingPayment.saleId}. ${err.message}`
      );
    } finally {
      setSubmitting(false);
    }
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
    setError("");
    setSuccessMessage("");
    setPendingPayment(null);
  }


  

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
            {["All items", ...categories.map((item) => item.name)].map((item) => (
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
              )
            )}
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
          {loading ? (
            <div className="flex min-h-56 items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted-foreground">
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
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
                      className="relative flex aspect-5/4 items-center justify-center overflow-hidden bg-muted/40"
                    >
                      <Package className="size-10 text-muted-foreground/30" />
                      {product.image && (
                        <Image
                          src={product.image}
                          alt={product.name}
                          height={200}
                          width={200}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      )}

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
          <CartPanelContent 
            cart={cart}
            setCart={setCart}
            error={error}
            pendingPayment={pendingPayment}
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            updateQuantity={updateQuantity}
            discount={discount}
            setDiscount={setDiscount}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            cashReceived={cashReceived}
            setCashReceived={setCashReceived}
            submitting={submitting}
            completeSale={completeSale}
            itemCount={itemCount}
            subtotal={subtotal}
            total={total}
            received={received}
            change={change}
            money={money}
          />
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
              <CartPanelContent 
                cart={cart}
                setCart={setCart}
                error={error}
                pendingPayment={pendingPayment}
                customerName={customerName}
                setCustomerName={setCustomerName}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                updateQuantity={updateQuantity}
                discount={discount}
                setDiscount={setDiscount}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                cashReceived={cashReceived}
                setCashReceived={setCashReceived}
                submitting={submitting}
                completeSale={completeSale}
                itemCount={itemCount}
                subtotal={subtotal}
                total={total}
                received={received}
                change={change}
                money={money}
              />
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
              Checkout complete!
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Sale and payment have been saved successfully.
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
