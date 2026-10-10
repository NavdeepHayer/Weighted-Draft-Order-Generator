import * as React from "react";
import { cn } from "./utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-display font-bold uppercase tracking-[0.08em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-flame-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0";

const variants: Record<Variant, string> = {
  primary:
    "bg-flame-500 text-ink-950 hover:bg-flame-400 shadow-[0_10px_24px_-12px_rgb(255_106_31/0.9)]",
  secondary: "border border-ink-700 bg-ink-800 text-bone hover:border-ink-600 hover:bg-ink-700",
  ghost: "text-fog hover:bg-ink-800 hover:text-bone",
  danger: "bg-rose-600 text-white hover:bg-rose-500",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
};

export default function Button({
  className,
  variant = "secondary",
  size = "md",
  loading = false,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          <span>Loading…</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
