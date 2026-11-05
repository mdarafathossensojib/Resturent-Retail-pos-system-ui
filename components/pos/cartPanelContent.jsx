"use client";

import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Minus,
  Percent,
  Plus,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  UserRound,
} from "lucide-react";
import Image from "next/image";

export default function CartPanelContent({
  cart,
  setCart,
  error,
  pendingPayment,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  updateQuantity,
  discount,
  setDiscount,
  paymentMethod,
  setPaymentMethod,
  cashReceived,
  setCashReceived,
  submitting,
  completeSale,
  itemCount,
  subtotal,
  total,
  received,
  change,
  money,
}) {
  return (
    <>
      {error && (
        <div className="mx-4 mt-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      {pendingPayment && (
        <div className="mx-4 mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700">
          Sale #{pendingPayment.saleId} Creating, But payment could not be completed.
          attempting to retry payment. If this persists, please contact support.
        </div>
      )}
      
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
                    className="flex size-12 shrink-0 items-center justify-center rounded-lg">
                    {item.image && (
                        <Image
                            src={item.image}
                            alt={item.name}
                            height={25}
                            width={25}
                            className="h-10 w-10 rounded-lg object-cover"
                            loading="lazy"
                            onError={(event) => {
                            event.currentTarget.style.display = "none";
                            }}
                        />
                        )}
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
                  onChange={(e) => setCashReceived(e.target.value)}
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
              submitting ||
              (paymentMethod === "Cash" && received < total)
            }
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCircle2 size={17} />
            {submitting
              ? "Processing..."
              : pendingPayment
                ? "Retry payment"
                : "Complete sale"}
          </button>

          {paymentMethod === "Cash" &&
            cart.length > 0 &&
            received < total && (
              <p className="text-center text-[11px] text-amber-600">
                Received amount is less than the payable total.
              </p>
            )}

          <p className="text-center text-[10px] text-muted-foreground">
            By completing the sale, you agree to the terms and conditions of the POS system.
          </p>
        </div>
      </div>
    </>
  );
}