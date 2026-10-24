
"use client";

import { useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";

export default function SuccessAlert({
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
      role="status"
      className="fixed right-6 top-20 z-100 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-lg border border-green-600/30 bg-green-950/95 px-5 py-4 text-green-100 shadow-lg backdrop-blur-sm"
    >
      <CheckCircle className="size-5 shrink-0 text-green-400" />

      <p className="text-sm font-medium">{message}</p>

      <button
        type="button"
        onClick={handleClose}
        className="ml-2 shrink-0 text-green-300 hover:text-white"
        aria-label="Dismiss success message"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
