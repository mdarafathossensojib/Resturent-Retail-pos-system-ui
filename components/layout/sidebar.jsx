
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  ReceiptText,
  Users,
  Truck,
  ShoppingBag,
  ChartNoAxesCombined,
  Settings,
  Store,
  ChevronLeft,
} from "lucide-react";

const menuGroups = [
  {
    label: "MAIN MENU",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "POS Checkout", href: "/pos-checkout", icon: ShoppingCart },
    ],
  },
  {
    label: "INVENTORY & SALES",
    items: [
      { label: "Products", href: "/products", icon: Package },
      { label: "Inventory", href: "/inventory", icon: Boxes },
      { label: "Orders", href: "/orders", icon: ReceiptText },
      { label: "Customers", href: "/customers", icon: Users },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { label: "Suppliers", href: "/suppliers", icon: Truck },
      { label: "Purchases", href: "/purchases", icon: ShoppingBag },
      { label: "Reports", href: "/reports", icon: ChartNoAxesCombined },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar({ onNavigate, collapsed = false, onToggle }) {
  const pathname = usePathname();

  return (
    <aside
      className={`flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200 ${
        collapsed ? "w-19" : "w-64"
      }`}
    >
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Store size={20} />
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">Retail POS</p>
            <p className="truncate text-xs text-muted-foreground">
              Management System
            </p>
          </div>
        )}

        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden rounded-md p-1.5 hover:bg-sidebar-accent lg:block"
          >
            <ChevronLeft
              size={17}
              className={collapsed ? "rotate-180" : ""}
            />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        {menuGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.15em] text-muted-foreground">
                {group.label}
              </p>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    } ${collapsed ? "justify-center px-0" : ""}`}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-muted-foreground">
            Retail POS System
          </p>
          <p className="mt-1 text-xs font-medium">Store Management</p>
        </div>
      )}
    </aside>
  );
}
