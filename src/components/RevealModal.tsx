import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

async function confettiBurst() {
  try {
    const confetti = (await import("canvas-confetti")).default;
    confetti({ particleCount: 200, spread: 80, origin: { y: 0.7 } });
  } catch {}
}

type RevealModalProps = {
  open: boolean;
  draftOrder: string[];
  auto?: boolean;
  delay?: number;
  onClose: () => void;          // user closes (X) or after finishing
  onFinished: () => void;       // called when all picks revealed
};

export default function RevealModal({
  open,
  draftOrder,
  auto = true,
  delay = 2000,
  onClose,
  onFinished,
}: RevealModalProps) {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState<string[]>([]);

  // lock page scroll while modal open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // reset when (re)opened
  useEffect(() => {
    if (open) { setIdx(0); setRevealed([]); }
  }, [open]);

  // auto reveal
  useEffect(() => {
    if (!open || !auto) return;
    if (idx < draftOrder.length) {
      const t = setTimeout(() => revealOne(), delay);
      return () => clearTimeout(t);
    } else if (draftOrder.length > 0) {
      onFinished(); // mark completion
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idx, auto, delay, draftOrder.length]);

  function revealOne() {
    if (idx >= draftOrder.length) return;
    const next = draftOrder[idx];
    setRevealed((r) => [...r, next]);
    setIdx((i) => i + 1);
    if (idx === 0) confettiBurst(); // first pick hype
  }

  const finished = idx >= draftOrder.length && draftOrder.length > 0;

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
          <div className="absolute inset-0 bg-black/70" onClick={onClose} />

          {/* Dialog */}
          <motion.div
            className="relative w-[min(680px,92vw)] rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            initial={{ scale: 0.96, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Live Draft Reveal</h2>
              <button
                onClick={onClose}
                className="rounded-lg px-2 py-1 text-slate-300 hover:bg-slate-800"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-400 mb-3">
              Revealing picks {auto ? "automatically" : "manually"}…
            </p>

            <ol className="list-decimal list-inside grid gap-2 mb-4">
              <AnimatePresence initial={false}>
                {revealed.map((team, i) => (
                  <motion.li
                    key={`${i}-${team}`}
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-4 py-2 rounded-xl bg-slate-800/80"
                  >
                    <span className="font-semibold">{i + 1}.</span> {team}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>

            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">
                {finished
                  ? "All picks revealed."
                  : `Next: #${idx + 1} of ${draftOrder.length}`}
              </div>
              <div className="flex gap-2">
                {!auto && !finished && (
                  <button
                    onClick={revealOne}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500"
                  >
                    Reveal next pick
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
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
