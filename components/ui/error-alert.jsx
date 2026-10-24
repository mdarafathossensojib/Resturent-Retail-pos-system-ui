
"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ErrorAlert({
  message,
  onClose,
  duration = 4000,
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration <= 0) return;

    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible || !message) return null;

  function handleClose() {
    setVisible(false);
    onClose?.();
  }

  return (
    <div
      role="alert"
      className="fixed right-6 top-20 z-100 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-lg border border-red-600/30 bg-red-950/95 px-5 py-4 text-red-100 shadow-lg backdrop-blur-sm"
    >
      <AlertTriangle className="size-5 shrink-0 text-red-400" />

      <p className="text-sm font-medium">{message}</p>

      <button
        type="button"
        onClick={handleClose}
        className="ml-2 shrink-0 text-red-300 hover:text-white"
        aria-label="Dismiss error"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
