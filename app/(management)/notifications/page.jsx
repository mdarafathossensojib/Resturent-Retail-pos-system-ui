
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ShoppingCart,
  Package,
  CreditCard,
  RotateCcw,
  ClipboardList,
  Settings2,
  AlertTriangle,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Inbox,
  Loader2,
  ExternalLink,
} from "lucide-react";

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

const notificationLabels = {
  sale: "Sale",
  purchase: "Purchase",
  refund: "Refund",
  supplier_return: "Supplier Return",
  low_stock: "Low Stock",
  stock_adjustment: "Stock Adjustment",
  payment: "Payment",
  system: "System",
};

const filters = [
  { label: "All", value: "all" },
  { label: "Unread", value: "false" },
  { label: "Read", value: "true" },
];

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [error, setError] = useState("");

  const PAGE_SIZE = 10;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        page_size: PAGE_SIZE,
      };

      if (filter !== "all") {
        params.is_read = filter;
      }

      const [notificationResponse, countResponse] = await Promise.all([
        apiClient.get("/notifications/", { params }),
        apiClient.get("/notifications/unread_count/"),
      ]);

      const data = notificationResponse.data;

      setNotifications(
        Array.isArray(data) ? data : data?.results || []
      );

      setTotalCount(
        Array.isArray(data) ? data.length : data?.count || 0
      );

      setTotalPages(
        Array.isArray(data)
          ? 1
          : Math.max(
              1,
              Math.ceil((data?.count || 0) / PAGE_SIZE)
            )
      );

      setUnreadCount(countResponse.data?.unread_count ?? 0);
    } catch (err) {
      console.error("Notification loading failed:", err);
      setError(
        "Failed to load notifications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleFilterChange = (value) => {
    setFilter(value);
    setPage(1);
  };

  const handleMarkRead = async (notification) => {
    if (actionLoading !== null) return;

    setActionLoading(notification.id);

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

      if (notification.related_url) {
        router.push(notification.related_url);
      } else {
        router.push(`/notifications/${notification.id}`);
      }
    } catch (err) {
      console.error("Mark notification as read failed:", err);
      setError("Could not update this notification.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markAllLoading) return;

    setMarkAllLoading(true);
    setError("");

    try {
      await apiClient.post("/notifications/mark_all_read/");

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          is_read: true,
        }))
      );

      setUnreadCount(0);

      if (filter === "false") {
        setPage(1);
      } else {
        await fetchNotifications();
      }
    } catch (err) {
      console.error("Mark all notifications failed:", err);
      setError("Could not mark all notifications as read.");
    } finally {
      setMarkAllLoading(false);
    }
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell size={22} className="text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              Notifications
            </h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Stay updated with your store activities and alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchNotifications}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || markAllLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {markAllLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <CheckCheck size={15} />
            )}
            Mark all as read
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Total Notifications
            </p>
            <Inbox size={19} className="text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-bold">{totalCount}</p>
        </div>

        <div className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Unread Notifications
            </p>
            <Bell size={19} className="text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold">{unreadCount}</p>
        </div>

        <div className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Read Notifications
            </p>
            <Check size={19} className="text-green-600" />
          </div>
          <p className="mt-2 text-2xl font-bold">
            {Math.max(0, totalCount - unreadCount)}
          </p>
        </div>
      </div>

      {/* Notification List */}
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        {/* Filter Header */}
        <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">All Notifications</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage and review your recent notifications.
            </p>
          </div>

          <div className="flex w-fit items-center gap-1 rounded-lg bg-muted p-1">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => handleFilterChange(item.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === item.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3">
            <Loader2
              size={28}
              className="animate-spin text-primary"
            />
            <p className="text-sm text-muted-foreground">
              Loading notifications...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
              <Bell size={28} className="text-muted-foreground" />
            </div>

            <h3 className="text-base font-semibold">
              {filter === "false"
                ? "No unread notifications"
                : filter === "true"
                  ? "No read notifications"
                  : "No notifications yet"}
            </h3>

            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {filter === "false"
                ? "You're all caught up. There are no unread notifications."
                : "Notifications about sales, purchases, payments and stock activities will appear here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => {
              const Icon =
                notificationIcons[notification.notification_type] ||
                Bell;

              return (
                <div
                  key={notification.id}
                  className={`group flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-start ${
                    !notification.is_read ? "bg-primary/[0.035]" : ""
                  }`}
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon
                      size={19}
                      className="text-muted-foreground"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-sm ${
                          notification.is_read
                            ? "font-medium"
                            : "font-semibold"
                        }`}
                      >
                        {notification.title}
                      </h3>

                      {!notification.is_read && (
                        <span className="size-2 rounded-full bg-primary" />
                      )}

                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {notificationLabels[
                          notification.notification_type
                        ] || "Notification"}
                      </span>
                    </div>

                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      {notification.message}
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:pt-1">
                    {!notification.is_read && (
                      <button
                        type="button"
                        disabled={actionLoading === notification.id}
                        onClick={() => handleMarkRead(notification)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
                      >
                        {actionLoading === notification.id ? (
                          <Loader2
                            size={13}
                            className="animate-spin"
                          />
                        ) : (
                          <Check size={13} />
                        )}
                        Mark read
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={actionLoading === notification.id}
                      onClick={() => handleMarkRead(notification)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
                    >
                      View
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && notifications.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
                Previous
              </button>

              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
