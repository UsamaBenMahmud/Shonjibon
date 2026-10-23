import { forwardRef, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

// --- Button ---------------------------------------------------------------

type ButtonVariant = "primary" | "secondary" | "ghost";

export function Button({
  variant = "primary",
  className,
  children,
  ...rest
}: {
  variant?: ButtonVariant;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = variant === "primary" ? "btn-primary" : variant === "secondary" ? "btn-secondary" : "btn-ghost";
  return (
    <button className={cn(base, className)} {...rest}>
      {children}
    </button>
  );
}

// --- Input / Textarea / Select --------------------------------------------

interface FieldWrapProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export function FieldWrap({ label, error, hint, required, children }: FieldWrapProps) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-ink">
          {label} {required && <span className="text-coral-text">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="block text-xs text-ink-muted">{hint}</span>}
      {error && <span className="block text-xs font-medium text-coral-text">{error}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/70 transition focus:border-teal";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(
  ({ className, error, ...rest }, ref) => (
    <input ref={ref} className={cn(inputBase, error && "border-coral", className)} {...rest} />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }>(
  ({ className, error, ...rest }, ref) => (
    <textarea ref={ref} className={cn(inputBase, "min-h-28 resize-y", error && "border-coral", className)} {...rest} />
  )
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...rest }, ref) => (
    <select ref={ref} className={cn(inputBase, "appearance-none bg-surface", className)} {...rest}>
      {children}
    </select>
  )
);
Select.displayName = "Select";

// --- Badge ------------------------------------------------------------

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "teal" | "coral" | "sand";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "border-border bg-bg-soft text-ink-muted",
    teal: "border-teal/30 bg-teal/10 text-teal-dark",
    coral: "border-coral/30 bg-coral-soft text-coral-text",
    sand: "border-sand bg-sand/60 text-ink",
  };
  return <span className={cn("badge", tones[tone], className)}>{children}</span>;
}

export function SampleBadge({ label }: { label: string }) {
  return <Badge tone="coral">● {label}</Badge>;
}

// --- Card ---------------------------------------------------------------

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("card p-5", className)}>{children}</div>;
}

// --- Skeleton -------------------------------------------------------------

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3 p-5">
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

// --- Modal ---------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button aria-label="Close" className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-xl",
          wide ? "max-w-3xl" : "max-w-md"
        )}
      >
        {title && <h3 className="mb-4 text-lg font-semibold text-ink">{title}</h3>}
        {children}
      </div>
    </div>
  );
}

// --- Accordion -------------------------------------------------------------

export function Accordion({ items }: { items: { id: string; question: ReactNode; answer: ReactNode }[] }) {
  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
      {items.map((item) => (
        <details key={item.id} className="group p-5 open:bg-bg-soft/40">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink">
            {item.question}
            <span className="shrink-0 rounded-full border border-border p-1 text-ink-muted transition group-open:rotate-45">
              <PlusIcon />
            </span>
          </summary>
          <div className="pt-3 text-sm leading-relaxed text-ink-muted">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

// --- Empty state -------------------------------------------------------

export function EmptyState({ title, body, icon }: { title: string; body?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-bg-soft/50 p-10 text-center">
      <div className="text-3xl text-teal">{icon ?? "🌊"}</div>
      <p className="font-medium text-ink">{title}</p>
      {body && <p className="max-w-sm text-sm text-ink-muted">{body}</p>}
    </div>
  );
}
