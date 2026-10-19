
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  DollarSign,
  ShoppingCart,
  Users,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";

const products = [
  {
    id: "1",
    name: "Classic Runner",
    sku: "SH-1042",
    stock: 42,
    color: "bg-blue-100",
  },
  {
    id: "2",
    name: "Everyday Tee",
    sku: "AP-2201",
    stock: 88,
    color: "bg-amber-100",
  },
  {
    id: "3",
    name: "Canvas Low Top",
    sku: "SH-1088",
    stock: 17,
    color: "bg-emerald-100",
  },
  {
    id: "4",
    name: "City Backpack",
    sku: "AC-3912",
    stock: 8,
    color: "bg-pink-100",
  },
  {
    id: "5",
    name: "Performance Sock",
    sku: "AP-1920",
    stock: 124,
    color: "bg-indigo-100",
  },
  {
    id: "6",
    name: "Leather Belt",
    sku: "AC-2880",
    stock: 3,
    color: "bg-orange-100",
  },
];

const kpis = [
  { label: "Today's Sales", value: "৳ 8,426.50", change: "+12.5%", Icon: DollarSign },
  { label: "Total Orders", value: "184", change: "+8.2%", Icon: ShoppingCart },
  { label: "Customers", value: "2,846", change: "+14.6%", Icon: Users },
  { label: "Low Stock Products", value: "12", change: "-4.8%", Icon: Boxes },
];

const recentOrders = [
  { id: "#NS-240820-001", customer: "Jordan Davis", amount: "৳ 139.68" },
  { id: "#NS-240820-000", customer: "Walk-in customer", amount: "৳ 82.40" },
  { id: "#NS-240819-998", customer: "Mia Thompson", amount: "৳ 246.99" },
  { id: "#NS-240819-997", customer: "Alex Morgan", amount: "৳ 58.00" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [period, setPeriod] = useState("This week");

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, change, Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
            </div>

            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {value}
            </p>

            <p
              className={`mt-2 flex items-center gap-1 text-xs font-medium ${
                change.startsWith("+")
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}
            >
              {change.startsWith("+") ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {change} vs last period
            </p>
          </div>
        ))}
      </div>

      {/* Sales overview and low stock */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Sales overview</h2>
              <p className="text-sm text-muted-foreground">
                Revenue performance for the last 7 days
              </p>
            </div>

            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs"
            >
              <option>This week</option>
              <option>This month</option>
              <option>This year</option>
            </select>
          </div>

          <div className="mt-8 flex h-56 items-end gap-3 border-b border-l border-border px-4 pt-4 sm:gap-6">
            {[42, 58, 47, 74, 62, 86, 68, 94, 79, 88, 76, 100].map(
              (height, index) => (
                <div
                  key={index}
                  className="group flex h-full flex-1 items-end"
                >
                  <div
                    className="w-full rounded-t-md bg-primary/20 transition-colors group-hover:bg-primary"
                    style={{ height: `${height}%` }}
                  />
                </div>
              )
            )}
          </div>

          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Low stock alerts</h2>
          <p className="text-sm text-muted-foreground">
            Items that need attention
          </p>

          <div className="mt-5 flex flex-col gap-4">
            {products
              .filter((product) => product.stock < 20)
              .map((product) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div
                    className={`flex size-10 items-center justify-center rounded-lg ${product.color} text-xs font-bold text-gray-500`}
                  >
                    {product.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      SKU {product.sku}
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-rose-600">
                    {product.stock} left
                  </span>
                </div>
              ))}
          </div>

          <button
            onClick={() => {
              router.push("/inventory");
            }}
            className="mt-5 flex w-full items-center justify-center gap-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-muted"
          >
            View inventory
            <ChevronRight className="size-4" />
          </button>
        </section>
      </div>

      {/* Recent orders and top products */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Recent orders</h2>
              <p className="text-sm text-muted-foreground">
                Latest transactions
              </p>
            </div>

            <button
              onClick={() => {
                router.push("/orders");
              }}
              className="text-sm font-medium text-primary"
            >
              View all
            </button>
          </div>

          <div className="mt-4 flex flex-col">
            {recentOrders.map((order, index) => (
              <div
                key={order.id}
                className="flex items-center gap-3 border-t border-border py-3"
              >
                <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                  <Receipt className="size-4 text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{order.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.customer}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold">{order.amount}</p>
                  <p className="text-xs text-emerald-600">Paid</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Top selling products</h2>
              <p className="text-sm text-muted-foreground">
                By units sold this month
              </p>
            </div>
            <MoreHorizontal className="size-5 text-muted-foreground" />
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {products.slice(0, 4).map((product, index) => (
              <div key={product.id} className="flex items-center gap-3">
                <span className="w-4 text-xs font-semibold text-muted-foreground">
                  0{index + 1}
                </span>

                <div
                  className={`flex size-9 items-center justify-center rounded-lg ${product.color} text-xs font-bold text-gray-500`}
                >
                  {product.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")}
                </div>

                <p className="flex-1 text-sm font-medium">{product.name}</p>

                <span className="text-sm font-semibold">
                  {[284, 216, 184, 142][index]} units
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
