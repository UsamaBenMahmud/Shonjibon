import { useEffect } from "react";
import { useUIStore } from "@/store/ui";
import { cn } from "@/utils/cn";

export function Toaster() {
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} id={toast.id} message={toast.message} variant={toast.variant} onDismiss={dismissToast} />
      ))}
    </div>
  );
}

function ToastItem({
  id,
  message,
  variant,
  onDismiss,
}: {
  id: string;
  message: string;
  variant: "success" | "error" | "info";
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 3200);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const tones: Record<string, string> = {
    success: "bg-teal-dark text-white",
    error: "bg-coral text-coral-ink",
    info: "bg-ink text-white",
  };

  return (
    <div
      role="status"
      className={cn(
        "animate-fade-up pointer-events-auto rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg",
        tones[variant]
      )}
    >
      {message}
    </div>
  );
}
