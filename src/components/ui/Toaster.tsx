import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
      const toast: Toast = {
        id,
        message,
        variant: opts?.variant ?? "info",
        duration: Math.max(1200, opts?.duration ?? 2400),
      };
      setToasts((xs) => [...xs, toast]);
      // auto-remove
      window.setTimeout(() => remove(id), toast.duration);
    },
    [remove]
  );

  const api = useMemo<ToastContextValue>(() => ({
    push,
    success: (m, d) => push(m, { variant: "success", duration: d }),
    info: (m, d) => push(m, { variant: "info", duration: d }),
    error: (m, d) => push(m, { variant: "error", duration: d }),
  }), [push]);

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
    <div className="fixed inset-x-0 bottom-6 z-[2000] flex justify-center pointer-events-none">
      <div className="flex flex-col gap-4 pointer-events-auto">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: 20 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "min-w-[480px] max-w-[720px] text-lg px-6 py-4 rounded-2xl border shadow-2xl",
                "backdrop-blur",
                t.variant === "success" && "bg-emerald-600/20 border-emerald-500/40 text-emerald-100",
                t.variant === "info"    && "bg-slate-800/80 border-slate-700 text-slate-100",
                t.variant === "error"   && "bg-rose-600/20 border-rose-500/40 text-rose-100"
              )}
            >
              <div className="flex items-start gap-3">
                <span aria-hidden className="mt-1 text-xl">
                  {t.variant === "success" ? "✅" : t.variant === "error" ? "❌" : "ℹ️"}
                </span>
                <div className="flex-1">{t.message}</div>
                <button
                  onClick={() => onClose(t.id)}
                  className="rounded-md px-3 py-1 hover:bg-black/20 text-slate-300"
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

