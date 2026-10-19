
"use client";

import { Bell, Menu, Search } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Topbar({ onMenuClick, title = "Dashboard" }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Toggle sidebar"
        className="rounded-lg p-2 hover:bg-muted lg:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold">{title}</h1>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Manage your store operations
        </p>
      </div>

      <button
        type="button"
        aria-label="Search"
        title="Search"
        className="rounded-lg border border-border p-2 hover:bg-muted"
      >
        <Search size={18} />
      </button>

      <ThemeToggle />

      <button
        type="button"
        aria-label="Notifications"
        title="Notifications"
        className="relative rounded-lg border border-border p-2 hover:bg-muted"
      >
        <Bell size={18} />
        <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500" />
      </button>

      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        A
      </div>
    </header>
  );
}
