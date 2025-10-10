import { Card, CardContent } from "./ui/Card";

type DraftPick = { id: string; name: string };
// Keep compat if this file was originally typed to WeightedEntrant
type WeightedEntrant = { id: string; name: string; weight: number; p: number };

type Props = {
  // Accept either the simple final order (DraftPick[]) or the older WeightedEntrant[]
  order: DraftPick[] | WeightedEntrant[];
  title?: string;
};

export default function DraftResults({ order, title = "Draft Order" }: Props) {
  if (!order || order.length === 0) return null;

  // Normalize to name list
  const names = order.map((o) => (o as DraftPick).name ?? (o as WeightedEntrant).name);

  return (
    <Card>
      <CardContent>
        <h2 className="text-lg font-semibold mb-3">{title}</h2>
        <ol className="space-y-1">
          {names.map((name, idx) => (
            <li key={`${idx}-${name}`} className="flex items-center gap-3">
              <span className="w-6 text-slate-400 tabular-nums">{idx + 1}.</span>
              <span className="font-medium">{name}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
