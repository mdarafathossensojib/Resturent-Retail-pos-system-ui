
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  ShoppingCart,
  Package,
  CreditCard,
  RotateCcw,
  ClipboardList,
  Settings2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
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

function formatDate(dateString) {
  if (!dateString) return "Unknown date";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

export default function NotificationDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id;

  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotification = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get(
        `/notifications/${id}/`
      );

      let data = response.data;

      // Automatically mark as read when opening the details page.
      if (!data.is_read) {
        await apiClient.patch(
          `/notifications/${id}/mark_read/`
        );

        data = {
          ...data,
          is_read: true,
        };
      }

      setNotification(data);
    } catch (err) {
      console.error("Notification details loading failed:", err);

      if (err?.response?.status === 404) {
        setError("Notification not found.");
      } else {
        setError("Unable to load notification details.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchNotification();
  }, [id, fetchNotification]);

  const handleRelatedPage = () => {
    if (!notification?.related_url) return;

    router.push(notification.related_url);
  };

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={28}
            className="animate-spin text-primary"
          />
          <p className="text-sm text-muted-foreground">
            Loading notification...
          </p>
        </div>
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => router.push("/notifications")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={17} />
          Back to notifications
        </button>

        <div className="rounded-xl border border-border bg-background px-4 py-12 text-center">
          <Bell
            size={30}
            className="mx-auto mb-3 text-muted-foreground"
          />
          <h2 className="font-semibold">
            Notification unavailable
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {error || "This notification could not be found."}
          </p>
        </div>
      </div>
    );
  }

  const Icon =
    notificationIcons[notification.notification_type] || Bell;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => router.push("/notifications")}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={17} />
        Back to notifications
      </button>

      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <Bell size={21} className="text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">
            Notification Details
          </h1>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          View the complete information about this notification.
        </p>
      </div>

      {/* Notification Card */}
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <div className="flex items-start gap-4 border-b border-border p-5 sm:p-6">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Icon size={23} className="text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {notificationLabels[
                  notification.notification_type
                ] || "Notification"}
              </span>

              <span
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${
                  notification.is_read
                    ? "bg-green-500/10 text-green-600"
                    : "bg-blue-500/10 text-blue-600"
                }`}
              >
                {notification.is_read ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <Clock size={13} />
                )}

                {notification.is_read ? "Read" : "Unread"}
              </span>
            </div>

            <h2 className="wrap-break-word text-lg font-semibold sm:text-xl">
              {notification.title}
            </h2>

            <p className="mt-2 text-xs text-muted-foreground">
              {formatDate(notification.created_at)}
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3 p-5 sm:p-6">
          <h3 className="text-sm font-semibold">
            Message
          </h3>

          <p className="whitespace-pre-wrap wrap-break-word text-sm leading-7 text-muted-foreground">
            {notification.message}
          </p>
        </div>

        {/* Related Action */}
        {notification.related_url && (
          <div className="border-t border-border bg-muted/20 p-5 sm:p-6">
            <h3 className="text-sm font-semibold">
              Related Information
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Open the related page to view more details.
            </p>

            <button
              type="button"
              onClick={handleRelatedPage}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              View Related Details
              <ExternalLink size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
