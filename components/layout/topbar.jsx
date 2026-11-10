
"use client";

import { useCallback, useEffect, useState } from "react";
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
  ShoppingCart,
  Package,
  CreditCard,
  RotateCcw,
  ClipboardList,
  Settings2,
  AlertTriangle,
  BellRing,
  Check,
  CheckCheck,
  ExternalLink,
} from "lucide-react";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/components/auth/AuthProvider";
import apiClient from "@/services/apiClient";

const notificationIcons = {
  sale: ShoppingCart,
  purchase: ClipboardList,
  refund: RotateCcw,
  supplier_return: RotateCcw,
  low_stock: AlertTriangle,
  stock_adjustment: Package,
  payment: CreditCard,
  system: Settings2,
};

function formatNotificationTime(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function Topbar({ onMenuClick, title = "Dashboard" }) {
  const { user, logoutUser } = useAuth();
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ");

  const displayName =
    fullName || user?.name || user?.email || "User";

  const fetchNotifications = useCallback(async () => {
    setNotificationLoading(true);
    setNotificationError("");

    try {
      const [notificationResponse, countResponse] = await Promise.all([
        apiClient.get("/notifications/", {
          params: { page_size: 5 },
        }),
        apiClient.get("/notifications/unread_count/"),
      ]);

      const notificationData = notificationResponse.data;

      setNotifications(
        Array.isArray(notificationData)
          ? notificationData
          : notificationData?.results || []
      );

      setUnreadCount(countResponse.data?.unread_count ?? 0);
    } catch (error) {
      console.error("Notification fetch failed:", error);
      setNotificationError(
        "Unable to load notifications. Please try again."
      );
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  // Initial load and periodic unread-count refresh.
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 60000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleNotificationToggle = () => {
    const nextOpen = !notificationOpen;

    setNotificationOpen(nextOpen);
    setDropdownOpen(false);

    if (nextOpen) {
      fetchNotifications();
    }
  };

  const handleMarkRead = async (notification) => {
    try {
      if (!notification.is_read) {
        await apiClient.patch(
          `/notifications/${notification.id}/mark_read/`
        );

        setNotifications((previous) =>
          previous.map((item) =>
            item.id === notification.id
              ? { ...item, is_read: true }
              : item
          )
        );

        setUnreadCount((previous) => Math.max(0, previous - 1));
      }

      setNotificationOpen(false);

      router.push(`/notifications/${notification.id}`);
    } 
    catch (error) {
      console.error("Mark notification as read failed:", error);
      setNotificationError("Could not open this notification.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.post("/notifications/mark_all_read/");

      setNotifications((previous) =>
        previous.map((item) => ({ ...item, is_read: true }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Mark all notifications as read failed:", error);
      setNotificationError("Could not mark all notifications as read.");
    }
  };

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

      {/* Notifications */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={handleNotificationToggle}
          aria-label="Notifications"
          aria-expanded={notificationOpen}
          title="Notifications"
          className="relative rounded-lg border border-border p-2 hover:bg-muted"
        >
          <Bell size={18} />

          {unreadCount > 0 && (
            <>
              <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            </>
          )}
        </button>

        {notificationOpen && (
          <>
            <button
              type="button"
              aria-label="Close notifications"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setNotificationOpen(false)}
            />

            <div className="absolute right-0 z-50 mt-3 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-background shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold">
                    Notifications
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {unreadCount} unread notifications
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-primary hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              </div>

              {/* Notification list */}
              <div className="max-h-95 overflow-y-auto">
                {notificationLoading && notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 px-4 py-10">
                    <BellRing
                      size={24}
                      className="animate-pulse text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      Loading notifications...
                    </p>
                  </div>
                ) : notificationError && notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs text-red-500">
                      {notificationError}
                    </p>

                    <button
                      type="button"
                      onClick={fetchNotifications}
                      className="mt-3 text-xs font-medium text-primary hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                    <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                      <Bell size={22} className="text-muted-foreground" />
                    </div>

                    <p className="text-sm font-medium">
                      You&apos;re all caught up!
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      No notifications available right now.
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const Icon =
                      notificationIcons[notification.notification_type] ||
                      Bell;

                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleMarkRead(notification)}
                        className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/70 ${
                          !notification.is_read ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Icon
                            size={17}
                            className="text-muted-foreground"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm ${
                                notification.is_read
                                  ? "font-medium"
                                  : "font-semibold"
                              }`}
                            >
                              {notification.title}
                            </p>

                            {!notification.is_read && (
                              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                            )}
                          </div>

                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {notification.message}
                          </p>

                          <p className="mt-1.5 text-[11px] text-muted-foreground">
                            {formatNotificationTime(notification.created_at)}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {notificationError && notifications.length > 0 && (
                <p className="border-t border-border px-4 py-2 text-xs text-red-500">
                  {notificationError}
                </p>
              )}

              {/* Footer */}
              <div className="border-t border-border p-2">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationOpen(false);
                    router.push("/notifications");
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold text-primary hover:bg-muted"
                >
                  See all notifications
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User menu */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => {
            setDropdownOpen((open) => !open);
            setNotificationOpen(false);
          }}
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
                    router.push("/settings");
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
