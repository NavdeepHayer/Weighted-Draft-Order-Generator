import { useState } from "react";
import type { Entrant } from "../types";

export default function EntrantForm({ onAdd }: { onAdd: (e: Entrant) => void }) {
  const [name, setName] = useState("");
  const [finish, setFinish] = useState<number | "">("");
  const [manualWeight, setManualWeight] = useState<number | "">("");

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex-1 min-w-[160px]">
        <label className="block text-sm text-slate-400">Team / Manager</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g., Avery"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-400">Last season finish (1 = champion)</label>
        <input
          type="number"
          min={1}
          step={1}
          value={finish}
          onChange={(e) => setFinish(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-32 px-3 py-2 rounded-xl bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g., 14"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-400">Manual weight (optional)</label>
        <input
          type="number"
          min={0}
          step={0.01}
          value={manualWeight}
          onChange={(e) => setManualWeight(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-36 px-3 py-2 rounded-xl bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g., 3.5"
        />
      </div>
      <button
        onClick={() => {
          if (!name.trim()) return;
          onAdd({
            id: crypto.randomUUID(),
            name: name.trim(),
            finish: finish === "" ? undefined : Number(finish),
            manualWeight: manualWeight === "" ? undefined : Number(manualWeight),
          });
          setName(""); setFinish(""); setManualWeight("");
        }}
        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium"
      >
        Add
      </button>
    </div>
  );
}
