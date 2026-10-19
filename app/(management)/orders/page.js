
"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Receipt,
  ShoppingCart,
  CircleDollarSign,
  Clock3,
  CheckCircle2,
  Eye,
  X,
  ArrowDownToLine,
} from "lucide-react";

const initialOrders = [
  {
    id: "NS-240820-001",
    customer: "Jordan Davis",
    phone: "01700000001",
    date: "2026-10-19T10:30:00",
    items: 3,
    amount: 139.68,
    method: "Cash",
    status: "Completed",
    payment: "Paid",
  },
  {
    id: "NS-240820-000",
    customer: "Walk-in customer",
    phone: "—",
    date: "2026-10-19T09:45:00",
    items: 2,
    amount: 82.4,
    method: "Card",
    status: "Completed",
    payment: "Paid",
  },
  {
    id: "NS-240819-998",
    customer: "Mia Thompson",
    phone: "01700000002",
    date: "2026-10-18T16:20:00",
    items: 5,
    amount: 246.99,
    method: "Mobile Banking",
    status: "Completed",
    payment: "Paid",
  },
  {
    id: "NS-240819-997",
    customer: "Alex Morgan",
    phone: "01700000003",
    date: "2026-10-18T14:05:00",
    items: 1,
    amount: 58,
    method: "Cash",
    status: "Refunded",
    payment: "Refunded",
  },
  {
    id: "NS-240819-996",
    customer: "Sophia Carter",
    phone: "01700000004",
    date: "2026-10-18T11:15:00",
    items: 4,
    amount: 184.5,
    method: "Card",
    status: "Pending",
    payment: "Unpaid",
  },
];

const money = (amount) =>
  `৳ ${Number(amount).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function StatusBadge({ value }) {
  const styles = {
    Completed: "bg-emerald-500/10 text-emerald-600",
    Paid: "bg-emerald-500/10 text-emerald-600",
    Pending: "bg-amber-500/10 text-amber-600",
    Unpaid: "bg-amber-500/10 text-amber-600",
    Refunded: "bg-rose-500/10 text-rose-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[value] || "bg-muted text-muted-foreground"
      }`}
    >
      {value}
    </span>
  );
}

function formatDate(value) {
  return new Date(value).toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrdersPage() {
  const [orders] = useState(initialOrders);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [payment, setPayment] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesQuery =
        `${order.id} ${order.customer} ${order.phone}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesStatus =
        status === "All" || order.status === status;

      const matchesPayment =
        payment === "All" || order.payment === payment;

      return matchesQuery && matchesStatus && matchesPayment;
    });
  }, [orders, query, status, payment]);

  const totalSales = orders
    .filter((order) => order.status === "Completed")
    .reduce((sum, order) => sum + order.amount, 0);

  const completedCount = orders.filter(
    (order) => order.status === "Completed"
  ).length;

  const pendingCount = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const refundedCount = orders.filter(
    (order) => order.status === "Refunded"
  ).length;

  function exportCsv() {
    const headers = [
      "Order ID",
      "Customer",
      "Phone",
      "Date",
      "Items",
      "Amount",
      "Method",
      "Status",
      "Payment",
    ];

    const rows = filteredOrders.map((order) => [
      order.id,
      order.customer,
      order.phone,
      formatDate(order.date),
      order.items,
      order.amount,
      order.method,
      order.status,
      order.payment,
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
    link.download = "orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const summary = [
    {
      label: "Completed Orders",
      value: completedCount,
      Icon: CheckCircle2,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Completed Sales",
      value: money(totalSales),
      Icon: CircleDollarSign,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Pending Orders",
      value: pendingCount,
      Icon: Clock3,
      color: "bg-amber-500/10 text-amber-600",
    },
    {
      label: "Refunded Orders",
      value: refundedCount,
      Icon: Receipt,
      color: "bg-rose-500/10 text-rose-600",
    },
  ];

  return (
    <div className="space-y-6 p-5 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-primary">
            <Receipt className="size-4" />
            <span className="font-medium">Sales management</span>
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Orders</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review transactions, payment statuses and order details.
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
        {summary.map(({ label, value, Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-3 wrap-break-word text-2xl font-semibold tracking-tight">
                  {value}
                </p>
              </div>
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className="size-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">All orders</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Search by order number, customer name or phone.
              </p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
              {filteredOrders.length} orders
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search order or customer..."
                className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="All">All order statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Refunded">Refunded</option>
            </select>

            <select
              value={payment}
              onChange={(event) => setPayment(event.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="All">All payment statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-225 text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-4 font-medium">Order</th>
                <th className="px-5 py-4 font-medium">Customer</th>
                <th className="px-5 py-4 font-medium">Date</th>
                <th className="px-5 py-4 font-medium">Items</th>
                <th className="px-5 py-4 font-medium">Total</th>
                <th className="px-5 py-4 font-medium">Payment</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-border transition-colors hover:bg-muted/30"
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold">{order.id}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {order.method}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium">{order.customer}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {order.phone}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {formatDate(order.date)}
                  </td>
                  <td className="px-5 py-4">{order.items}</td>
                  <td className="px-5 py-4 font-semibold">
                    {money(order.amount)}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge value={order.payment} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge value={order.status} />
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
                    >
                      <Eye className="size-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="p-10 text-center">
              <ShoppingCart className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No orders found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try changing your search or filters.
              </p>
            </div>
          )}
        </div>
      </section>

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedOrder(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="order-detail-title" className="text-lg font-semibold">
                  Order details
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedOrder.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order details"
                className="rounded-lg p-2 hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex justify-between gap-4 border-b border-border pb-3">
                <span className="text-sm text-muted-foreground">Customer</span>
                <span className="text-right text-sm font-medium">
                  {selectedOrder.customer}
                  <span className="block mt-1 text-xs font-normal text-muted-foreground">
                    {selectedOrder.phone}
                  </span>
                </span>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-3">
                <span className="text-sm text-muted-foreground">Date</span>
                <span className="text-right text-sm">
                  {formatDate(selectedOrder.date)}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-3">
                <span className="text-sm text-muted-foreground">Items</span>
                <span className="text-sm font-medium">
                  {selectedOrder.items}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-3">
                <span className="text-sm text-muted-foreground">Payment method</span>
                <span className="text-sm font-medium">
                  {selectedOrder.method}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-3">
                <span className="text-sm text-muted-foreground">Order status</span>
                <StatusBadge value={selectedOrder.status} />
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-sm text-muted-foreground">Payment status</span>
                <StatusBadge value={selectedOrder.payment} />
              </div>
              <div className="flex justify-between border-t border-border pt-4">
                <span className="font-semibold">Order total</span>
                <span className="text-lg font-semibold">
                  {money(selectedOrder.amount)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Close
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
