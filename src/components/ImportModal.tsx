import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatTeamList, parseTeamList, type TeamRow } from "../lib/teamList";
import { readStandings } from "../lib/standingsOcr";
import { Button } from "./ui";
import { CloseIcon, UploadIcon } from "./ui/icons";
import { cn } from "./ui/utils";

type Status =
  | { kind: "idle" }
  | { kind: "reading"; progress: number }
  | { kind: "read"; count: number }
  | { kind: "error"; message: string };

export default function ImportModal({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (rows: TeamRow[]) => void;
}) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  // Only the most recent screenshot gets to fill the list
  const readId = useRef(0);

  const rows = useMemo(() => parseTeamList(text), [text]);

  const readImage = useCallback(async (image: Blob) => {
    const id = ++readId.current;
    setStatus({ kind: "reading", progress: 0 });
    try {
      const found = await readStandings(image, (progress) => {
        if (id === readId.current) setStatus({ kind: "reading", progress });
      });
      if (id !== readId.current) return;
      if (found.length === 0) {
        setStatus({
          kind: "error",
          message: "No team names found in that image. Try a tighter crop of the standings table, or type the names below.",
        });
        return;
      }
      setText(formatTeamList(found));
      setStatus({ kind: "read", count: found.length });
    } catch {
      if (id !== readId.current) return;
      setStatus({
        kind: "error",
        message: "Couldn't read that image. The text reader downloads on first use, so check your connection, or type the names below.",
      });
    }
  }, []);

  // Start fresh each time the dialog opens
  useEffect(() => {
    if (!open) return;
    readId.current++;
    setText("");
    setStatus({ kind: "idle" });
    setDragging(false);
  }, [open]);

  // While open: lock the page behind it, close on Escape, accept a pasted screenshot from anywhere
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPaste = (e: ClipboardEvent) => {
      const image = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
      if (!image) return;
      e.preventDefault();
      readImage(image);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("paste", onPaste);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("paste", onPaste);
    };
  }, [open, onClose, readImage]);

  const reading = status.kind === "reading";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Import teams"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/80" onClick={onClose} />

          <motion.div
            className="relative flex max-h-[94dvh] w-full flex-col rounded-t-2xl border border-ink-700 bg-ink-900 shadow-2xl sm:w-[min(860px,100%)] sm:rounded-2xl"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <div className="flex items-center justify-between border-b border-ink-800 px-5 py-3">
              <h2 className="font-display text-xl font-bold uppercase tracking-[0.06em]">
                Import teams
              </h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-md text-fog hover:bg-ink-800 hover:text-bone"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="grid min-h-0 gap-5 overflow-auto p-4 sm:p-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div className="flex flex-col gap-4">
                {/* Screenshot drop zone */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInput.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInput.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    const image = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
                    if (image) readImage(image);
                  }}
                  className={cn(
                    "flex min-h-[132px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-flame-400",
                    dragging
                      ? "border-flame-500 bg-flame-500/10"
                      : "border-ink-600 bg-ink-950/50 hover:border-flame-500/70"
                  )}
                >
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const image = e.target.files?.[0];
                      if (image) readImage(image);
                      e.target.value = "";
                    }}
                  />
                  {reading ? (
                    <div className="w-full max-w-[260px]" role="status">
                      <div className="mb-2 text-sm font-medium">
                        {status.progress > 0
                          ? `Reading screenshot… ${Math.round(status.progress * 100)}%`
                          : "Getting the text reader ready…"}
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
                        <div
                          className="h-full rounded-full bg-flame-500 transition-[width] duration-200"
                          style={{ width: `${Math.max(4, status.progress * 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-800 text-flame-400">
                        <UploadIcon width={18} height={18} />
                      </span>
                      <div className="font-semibold">Drop a standings screenshot</div>
                      <div className="text-sm text-fog">
                        or paste one, or click to choose a file
                      </div>
                    </>
                  )}
                </div>

                {status.kind === "error" && (
                  <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-950/60 px-3 py-2 text-sm text-rose-100">
                    {status.message}
                  </p>
                )}
                {status.kind === "read" && (
                  <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-100">
                    Read {status.count} teams from the screenshot. Check the names below: emoji and
                    unusual characters don't survive, so fix those by hand.
                  </p>
                )}

                <label className="flex flex-col">
                  <span className="eyebrow mb-1.5">Teams, one per line, best finish first</span>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={9}
                    spellCheck={false}
                    placeholder={"1. Last season's champion\n2. Runner-up\n3. Third place\n…"}
                    className="field resize-y leading-relaxed"
                  />
                  <span className="mt-2 text-sm text-fog">
                    You can also type names or paste rows copied from a standings table. A leading
                    number sets the finish; without one, the line order does.
                  </span>
                </label>
              </div>

              {/* What will be imported */}
              <div className="flex min-h-[160px] flex-col rounded-xl border border-ink-800 bg-ink-950/50">
                <div className="eyebrow flex items-center justify-between border-b border-ink-800 px-4 py-2.5">
                  <span>Preview</span>
                  <span className="tabular-nums">{rows.length} teams</span>
                </div>
                {rows.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-fog">
                    Teams show up here as they're read.
                  </div>
                ) : (
                  <ol className="overflow-auto p-2 md:max-h-[420px]">
                    {rows.map((r, i) => (
                      <li key={i} className="flex items-baseline gap-3 rounded-md px-2 py-1.5">
                        <span className="w-7 text-right font-display text-lg font-bold leading-none tabular-nums text-flame-400">
                          {r.finish}
                        </span>
                        <span className="min-w-0 truncate text-sm font-medium">{r.name}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-ink-800 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-fog">
                Screenshots are read on this device and never uploaded.
              </p>
              <div className="flex gap-2">
                <Button onClick={onClose} className="flex-1 sm:flex-none">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={rows.length === 0 || reading}
                  onClick={() => onApply(rows)}
                  className="flex-1 sm:flex-none"
                >
                  {rows.length > 0 ? `Replace teams with these ${rows.length}` : "Replace teams"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
