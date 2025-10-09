import type { WeightedEntrant } from "../lib/lottery";

export default function DraftResults({ order }: { order: WeightedEntrant[] }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Draft Order</h2>
      </div>
      <ol className="list-decimal list-inside grid gap-1 text-slate-100">
        {order.map((e) => (
          <li key={e.id}><span className="font-semibold">{e.name}</span></li>
        ))}
      </ol>
    </div>
  );
}
