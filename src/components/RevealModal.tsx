import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type RevealModalProps = {
  open: boolean;
  draftOrder: string[];
  auto?: boolean;               // auto-advance through picks
  revealEveryMs?: number;       // time between start of each spotlight
  holdSpotlightMs?: number;     // how long the big spotlight holds before moving to list
  onClose: () => void;
  onFinished: () => void;
};

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

  // Confetti canvas INSIDE the modal so it sits above content
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef<((opts: any) => void) | null>(null);
  const confettiReadyRef = useRef(false);

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

  // Create a confetti instance bound to our modal canvas
  useEffect(() => {
    let mounted = true;
    confettiReadyRef.current = false;

    if (open && canvasRef.current) {
      import("canvas-confetti").then((m) => {
        if (!mounted || !canvasRef.current) return;
        const instance = m.create(canvasRef.current, { resize: true, useWorker: true });
        confettiRef.current = (opts: any) => instance(opts);
        // one frame to ensure canvas has final size
        requestAnimationFrame(() => { confettiReadyRef.current = true; });
      });
    }

    return () => {
      mounted = false;
      confettiRef.current = null;
      confettiReadyRef.current = false;
    };
  }, [open]);

  // EFFECT A: Auto-start next spotlight when none is active
  useEffect(() => {
    if (!open || !auto || finished || spotlight) return;
    const delay = idx === 0 ? 250 : revealEveryMs;
    const t = setTimeout(() => {
      if (idx < draftOrder.length) {
        const pick = draftOrder[idx];
        setSpotlight(pick);
        if (idx === 0) fireConfettiFromSpotlight(); // 🎉 first pick
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
    if (!confettiRef.current || !confettiReadyRef.current || !canvasRef.current) return;

    let origin = { x: 0.5, y: 0.5 }; // fallback = modal center
    if (spotlightBoxRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const spotRect = spotlightBoxRef.current.getBoundingClientRect();
      const cx = (spotRect.left + spotRect.width / 2 - canvasRect.left) / canvasRect.width;
      const cy = (spotRect.top + spotRect.height / 2 - canvasRect.top) / canvasRect.height;
      origin = {
        x: Math.min(0.98, Math.max(0.02, cx)),
        y: Math.min(0.98, Math.max(0.02, cy)),
      };
    }

    confettiRef.current({
      particleCount: 220,
      spread: 120,
      startVelocity: 45,
      scalar: 1.1,
      ticks: 200,
      origin,
    });
  }

  // Manual step: toggle between revealing & placing
  function stepOnce() {
    if (finished) return;
    if (!spotlight) {
      const pick = draftOrder[idx];
      setSpotlight(pick);
      if (idx === 0) fireConfettiFromSpotlight();
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
          className="fixed inset-0 z-[1000] flex items-center justify-center"
          aria-modal="true"
          role="dialog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80" onClick={onClose} />

          {/* Dialog */}
          <motion.div
            className="relative w-[min(760px,95vw)] rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            initial={{ scale: 0.96, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            {/* Confetti canvas ABOVE modal content */}
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 w-full h-full z-50"
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-5 relative z-10">
              <h2 className="text-xl font-bold">Live Draft Reveal</h2>
              <button
                onClick={onClose}
                className="rounded-lg px-2 py-1 text-slate-300 hover:bg-slate-800"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Spotlight + list */}
            <div className="grid gap-5 md:grid-cols-[1fr,1fr] relative z-10">
              {/* Spotlight column */}
              <div
                ref={spotlightBoxRef}
                className="flex flex-col items-center justify-center min-h-[220px] rounded-xl bg-slate-950/40 border border-slate-800"
              >
                <AnimatePresence mode="wait">
                  {spotlight ? (
                    <motion.div
                      key={spotlight}
                      initial={{ opacity: 0, scale: 0.7, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      transition={{ type: "spring", stiffness: 200, damping: 18 }}
                      className="text-center"
                    >
                      <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">
                        Now revealing pick #{idx + 1}
                      </div>
                      <div className="text-4xl sm:text-5xl font-extrabold tracking-wide px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg">
                        {spotlight}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-slate-500 text-sm">
                      {finished ? "All picks revealed." : "Get ready…"}
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Revealed list column */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/40">
                <div className="px-4 py-3 border-b border-slate-800 text-sm text-slate-400">
                  Revealed picks
                </div>
                <div ref={listRef} className="max-h-[320px] overflow-auto px-3 py-3">
                  <motion.ol layout className="list-decimal list-inside grid gap-2 text-slate-200">
                    {revealed.map((team, i) => (
                      <motion.li
                        key={`${i}-${team}`}
                        {...listMotion}
                        className="px-3 py-2 rounded-lg bg-slate-800/70"
                      >
                        {team}
                      </motion.li>
                    ))}
                  </motion.ol>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 flex items-center justify-between relative z-10">
              <div className="text-sm text-slate-400">
                {finished ? "All picks revealed!" : `Next: #${idx + 1} of ${draftOrder.length}`}
              </div>
              <div className="flex gap-2">
                {!auto && !finished && (
                  <button
                    onClick={stepOnce}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold"
                  >
                    {spotlight ? "Place pick" : "Reveal next pick"}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700"
                >
                  {finished ? "Close" : "Cancel"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
