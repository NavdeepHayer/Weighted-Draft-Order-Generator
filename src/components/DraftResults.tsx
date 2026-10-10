import { cn } from "./ui/utils";

type DraftPick = { id: string; name: string };

type Props = {
  order: DraftPick[];
  // One slot per team, so the board is there before anything is drawn
  slots: number;
  // A drawn order stays sealed until this is set
  shown: boolean;
  // First-pick odds by team id, shown next to each revealed pick
  odds?: Map<string, number>;
};

// Uneven placeholder bars so a sealed board doesn't give away name lengths
const SEALED_WIDTHS = ["62%", "44%", "71%", "53%", "80%", "48%", "66%"];

export default function DraftResults({ order, slots, shown, odds }: Props) {
  const drawn = order.length > 0;
  const count = Math.max(slots, order.length);

  return (
    <ol className="gap-x-0 @2xl:columns-2 @5xl:columns-3">
      {Array.from({ length: count }, (_, idx) => {
        const pick = order[idx];
        const p = pick ? odds?.get(pick.id) : undefined;
        return (
          <li
            key={idx}
            className="flex h-11 break-inside-avoid items-center gap-4 border-b border-ink-800 px-4 sm:px-5"
          >
            <span
              className={cn(
                "w-8 font-display text-2xl font-extrabold leading-none tabular-nums",
                drawn && shown && idx === 0 ? "text-flame-500" : "text-ink-600"
              )}
            >
              {String(idx + 1).padStart(2, "0")}
            </span>
            {drawn && shown && pick ? (
              <>
                <span className={cn("min-w-0 flex-1 truncate font-medium", idx === 0 && "font-semibold")}>
                  {pick.name}
                </span>
                {p !== undefined && (
                  <span className="text-xs tabular-nums text-fog" title="First-pick odds going in">
                    {(p * 100).toFixed(1)}%
                  </span>
                )}
              </>
            ) : drawn ? (
              <span
                className="h-2.5 rounded-full bg-gradient-to-r from-flame-500/40 to-ink-700"
                style={{ width: SEALED_WIDTHS[idx % SEALED_WIDTHS.length] }}
              />
            ) : (
              <span className="flex-1 border-t border-dashed border-ink-700" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
