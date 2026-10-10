import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Ball, Button } from "./ui";
import { CloseIcon } from "./ui/icons";
import { cn } from "./ui/utils";

type RevealModalProps = {
  open: boolean;
  draftOrder: string[];
  auto?: boolean;               // auto-advance through picks
  revealEveryMs?: number;       // time between start of each spotlight
  holdSpotlightMs?: number;     // how long the big spotlight holds before moving to list
  onClose: () => void;
  onFinished: () => void;
};

// --- Global confetti instance attached to <body> ---
let CONFETTI_INSTANCE: ReturnType<typeof confetti.create> | null = null;
function getConfettiInstance() {
  if (typeof window === "undefined") return null;
  if (!CONFETTI_INSTANCE) {
    const canvas = document.createElement("canvas");
    canvas.id = "confetti-root";
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "2147483647"; // absolute top
    document.body.appendChild(canvas);
    CONFETTI_INSTANCE = confetti.create(canvas, { resize: true, useWorker: true });
  }
  return CONFETTI_INSTANCE;
}

export default function RevealModal({
  open,
  draftOrder,
  auto = true,
  revealEveryMs = 2600,
  holdSpotlightMs = 1100,
  onClose,
  onFinished,
}: RevealModalProps) {
  const [idx, setIdx] = useState(0);                  // next unrevealed index
  const [revealed, setRevealed] = useState<string[]>([]);
  const [spotlight, setSpotlight] = useState<string | null>(null);

  // The spotlight box DOM node (we’ll fire confetti from its center)
  const spotlightBoxRef = useRef<HTMLDivElement>(null);

  const finished = idx >= draftOrder.length && draftOrder.length > 0;

  // Disable background scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setIdx(0);
      setRevealed([]);
      setSpotlight(null);
    }
  }, [open]);

  // EFFECT A: Auto-start next spotlight when none is active
  useEffect(() => {
    if (!open || !auto || finished || spotlight) return;
    const delay = idx === 0 ? 250 : revealEveryMs;
    const t = setTimeout(() => {
      if (idx < draftOrder.length) {
        const pick = draftOrder[idx];
        setSpotlight(pick);
        fireConfettiFromSpotlight();
      }
    }, delay);
    return () => clearTimeout(t);
  }, [open, auto, finished, spotlight, idx, revealEveryMs, draftOrder.length, draftOrder]);

  // EFFECT B: Commit spotlight to list after a short hold
  useEffect(() => {
    if (!open || !spotlight) return;
    const t = setTimeout(() => {
      setRevealed((r) => [...r, spotlight]);
      setSpotlight(null);
      setIdx((i) => i + 1);
    }, holdSpotlightMs);
    return () => clearTimeout(t);
  }, [open, spotlight, holdSpotlightMs]);

  // Notify parent once all picks are placed
  useEffect(() => {
    if (open && finished) onFinished();
  }, [open, finished, onFinished]);

  // Confetti burst from the CENTER of the spotlight box
  function fireConfettiFromSpotlight() {
    const c = getConfettiInstance();
    if (!c) return;

    // Respect reduced motion
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

    let origin = { x: 0.5, y: 0.2 }; // fallback = viewport top-center
    if (spotlightBoxRef.current) {
      const r = spotlightBoxRef.current.getBoundingClientRect();
      origin = {
        x: (r.left + r.width / 2) / window.innerWidth,
        y: (r.top + r.height / 2) / window.innerHeight,
      };
    }

    const isSmall = window.matchMedia?.("(max-width: 640px)")?.matches ?? false;
    const scalar = isSmall ? 0.8 : 1;
    const colors = ["#ff6a1f", "#ff8a4c", "#f4f0e8", "#ffffff"];

    // Center burst
    c({
      particleCount: isSmall ? 80 : 140,
      spread: 75,
      startVelocity: 45,
      scalar,
      colors,
      origin,
    });

    // Side accents
    c({
      particleCount: isSmall ? 40 : 80,
      angle: 60,
      spread: 55,
      startVelocity: 35,
      scalar,
      colors,
      origin: { x: Math.min(0.95, origin.x + 0.35), y: origin.y + 0.03 },
    });
    c({
      particleCount: isSmall ? 40 : 80,
      angle: 120,
      spread: 55,
      startVelocity: 35,
      scalar,
      colors,
      origin: { x: Math.max(0.05, origin.x - 0.35), y: origin.y + 0.03 },
    });
  }

  // Manual step: toggle between revealing & placing
  function stepOnce() {
    if (finished) return;
    if (!spotlight) {
      const pick = draftOrder[idx];
      setSpotlight(pick);
      fireConfettiFromSpotlight(); // 🎉 fire on every manual reveal
    } else {
      setRevealed((r) => [...r, spotlight]);
      setSpotlight(null);
      setIdx((i) => i + 1);
    }
  }

  // Smooth list layout transitions
  const listMotion = useMemo(
    () => ({
      initial: { opacity: 0, scale: 0.95, y: -6 },
      animate: { opacity: 1, scale: 1, y: 0 },
      transition: { duration: 0.22 },
      layout: true as const,
    }),
    []
  );

  // Keep revealed list scrolled to bottom
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [revealed.length]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-3"
          aria-modal="true"
          role="dialog"
          aria-label="Live draft reveal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/85" onClick={onClose} />

          {/* Dialog */}
          <motion.div
            className="relative flex max-h-full w-[min(820px,100%)] flex-col overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl"
            initial={{ scale: 0.96, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink-800 px-5 py-3">
              <h2 className="font-display text-xl font-bold uppercase tracking-[0.06em]">
                Live draft reveal
              </h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-md text-fog hover:bg-ink-800 hover:text-bone"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Spotlight + list */}
            <div className="grid min-h-0 gap-4 overflow-auto p-4 sm:p-5 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              {/* Spotlight column */}
              <div
                ref={spotlightBoxRef}
                className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-ink-800 bg-[radial-gradient(420px_260px_at_50%_0%,rgb(255_106_31/0.18),transparent_70%)] bg-ink-950/60 p-5 md:min-h-[340px]"
              >
                <AnimatePresence mode="wait">
                  {spotlight ? (
                    <motion.div
                      key={spotlight}
                      initial={{ opacity: 0, scale: 0.7, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      transition={{ type: "spring", stiffness: 200, damping: 18 }}
                      className="flex max-w-full flex-col items-center text-center"
                    >
                      <div className="eyebrow mb-3">Pick</div>
                      <Ball className="mb-5 h-20 w-20 text-5xl">{idx + 1}</Ball>
                      <div className="max-w-full break-words font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-5xl">
                        {spotlight}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="eyebrow">
                      {finished ? "All picks revealed" : "Get ready…"}
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Revealed list column */}
              <div className="flex min-h-0 flex-col rounded-xl border border-ink-800 bg-ink-950/60">
                <div className="eyebrow border-b border-ink-800 px-4 py-2.5">
                  Revealed picks
                </div>
                <div ref={listRef} className="max-h-[300px] overflow-auto p-2 md:max-h-[296px]">
                  <motion.ol layout className="grid gap-1">
                    {revealed.map((team, i) => (
                      <motion.li
                        key={`${i}-${team}`}
                        {...listMotion}
                        className="flex items-baseline gap-3 rounded-lg bg-ink-800/70 px-3 py-2"
                      >
                        <span
                          className={cn(
                            "w-7 font-display text-xl font-extrabold leading-none tabular-nums",
                            i === 0 ? "text-flame-500" : "text-fog"
                          )}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 truncate font-medium">{team}</span>
                      </motion.li>
                    ))}
                  </motion.ol>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-ink-800 px-5 py-3">
              <div className="text-sm text-fog">
                {finished ? "All picks revealed!" : `Next: #${idx + 1} of ${draftOrder.length}`}
              </div>
              <div className="flex gap-2">
                {!auto && !finished && (
                  <Button variant="primary" onClick={stepOnce}>
                    {spotlight ? "Place pick" : "Reveal next pick"}
                  </Button>
                )}
                <Button onClick={onClose}>{finished ? "Close" : "Cancel"}</Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
