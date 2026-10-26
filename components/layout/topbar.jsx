
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Menu,
  Search,
  UserRound,
  Settings,
  LogOut,
  ChevronDown,
  UserCircle,
} from "lucide-react";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/components/auth/AuthProvider";

export function Topbar({ onMenuClick, title = "Dashboard" }) {
  const { user, logoutUser } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ");

  const displayName =
    fullName ||
    user?.name ||
    user?.email ||
    "User";

  const handleLogout = () => {
    logoutUser();
    setDropdownOpen(false);
    router.replace("/login");
  };

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

      {/* User menu */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setDropdownOpen((open) => !open)}
          aria-expanded={dropdownOpen}
          aria-haspopup="menu"
          className="flex max-w-47.5 items-center gap-2 rounded-xl border border-border px-2 py-1.5 hover:bg-muted sm:px-3"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <span className="hidden truncate text-sm font-medium sm:block">
            {displayName}
          </span>

          <ChevronDown
            size={15}
            className={`hidden shrink-0 transition-transform sm:block ${
              dropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {dropdownOpen && (
          <>
            {/* Click outside to close */}
            <button
              type="button"
              aria-label="Close user menu"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setDropdownOpen(false)}
            />

            <div
              role="menu"
              className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-background shadow-lg"
            >
              <div className="border-b border-border px-4 py-3">
                <p className="truncate text-sm font-semibold">
                  {displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email || ""}
                </p>
              </div>

              <div className="p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push("/profile");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
                >
                  <UserRound size={17} />
                  Profile
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push("/settings");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
                >
                  <Settings size={17} />
                  Settings
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push("/dashboard");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
                >
                  <UserCircle size={17} />
                  Dashboard
                </button>
              </div>

              <div className="border-t border-border p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
