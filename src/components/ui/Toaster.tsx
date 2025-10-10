import React, {
  createContext, useCallback, useContext,
  useEffect, useMemo, useRef, useState
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "./utils";

type ToastVariant = "success" | "info" | "error";
type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number; // ms
};

type ToastContextValue = {
  push: (message: string, opts?: Partial<Pick<Toast, "variant" | "duration">>) => void;
  success: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
};

const ToastCtx = createContext<ToastContextValue | null>(null);

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((xs) => xs.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, opts?: Partial<Pick<Toast, "variant" | "duration">>) => {
      const id = crypto.randomUUID();

      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

      const toast: Toast = {
        id,
        message,
        variant: opts?.variant ?? "info",
        duration: Math.max(1400, opts?.duration ?? (prefersReduced ? 3200 : 2400)),
      };
      setToasts((xs) => [...xs, toast]);
      window.setTimeout(() => remove(id), toast.duration);
    },
    [remove]
  );

  const api = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (m, d) => push(m, { variant: "success", duration: d }),
      info: (m, d) => push(m, { variant: "info", duration: d }),
      error: (m, d) => push(m, { variant: "error", duration: d }),
    }),
    [push]
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <Toaster toasts={toasts} onClose={remove} />
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToasterProvider");
  return ctx;
}

function Toaster({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  const mountRef = useRef<Element | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    let m = document.getElementById("toast-root");
    if (!m) {
      m = document.createElement("div");
      m.id = "toast-root";
      document.body.appendChild(m);
    }
    mountRef.current = m;
    force((x) => x + 1);
  }, []);

  if (!mountRef.current) return null;

  return createPortal(
    <div
      className="fixed inset-x-0 z-[2000] pointer-events-none flex justify-center"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
      role="region"
      aria-label="Notifications"
    >
      {/* tighter stack on mobile */}
      <div className="flex w-full flex-col gap-2 px-3 sm:gap-3 sm:px-0 pointer-events-auto">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, translateY: 20, scale: 0.98 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              exit={{ opacity: 0, translateY: 20, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.12}
              onDragEnd={(_, info) => {
                if (info.offset.y > 60 || info.velocity.y > 400) onClose(t.id);
              }}
              className={cn(
                // Mobile width: slim, nearly full; Desktop: comfy card
                "mx-auto w-full max-w-[95%] sm:w-auto sm:max-w-[720px] sm:min-w-[420px]",
                "rounded-2xl border shadow-2xl backdrop-blur",
                // Smaller padding + font on mobile; larger on desktop
                "px-3 py-2 text-sm sm:px-6 sm:py-4 sm:text-lg",
                t.variant === "success" &&
                  "bg-emerald-600/20 border-emerald-500/40 text-emerald-100",
                t.variant === "info" &&
                  "bg-slate-800/80 border-slate-700 text-slate-100",
                t.variant === "error" &&
                  "bg-rose-600/20 border-rose-500/40 text-rose-100"
              )}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <span aria-hidden className="mt-0.5 sm:mt-1 text-base sm:text-xl">
                  {t.variant === "success" ? "✅" : t.variant === "error" ? "❌" : "ℹ️"}
                </span>
                <div className="flex-1 leading-snug">{t.message}</div>
                <button
                  onClick={() => onClose(t.id)}
                  className="rounded-md px-2 py-1 sm:px-3 hover:bg-black/20 text-slate-300"
                  aria-label="Close notification"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>,
    mountRef.current
  );
}
