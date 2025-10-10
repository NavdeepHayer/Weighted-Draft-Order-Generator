import type { Entrant } from "../types";
import { Button } from "./ui";

export default function EntrantsTable({
  entrants,
  onChange,
  onRemove,
}: {
  entrants: Entrant[];
  onChange: (next: Entrant[]) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400 border-b border-slate-800">
            <th className="py-2">#</th>
            <th>Team / Manager</th>
            <th>Finish</th>
            <th>Manual Weight</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {entrants.map((e, idx) => (
            <tr key={e.id} className="border-b border-slate-800 hover:bg-slate-800/40">
              <td className="py-2 pr-2 align-middle text-slate-400">{idx + 1}</td>
              <td className="py-2 pr-2 align-middle">
                <input
                  value={e.name}
                  onChange={(ev) => {
                    const next = entrants.map((x) =>
                      x.id === e.id ? { ...x, name: ev.target.value } : x,
                    );
                    onChange(next);
                  }}
                  className="w-full px-2 py-1 rounded-lg bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </td>
              <td className="py-2 pr-2 align-middle">
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={e.finish ?? ""}
                  onChange={(ev) => {
                    const v = ev.target.value === "" ? undefined : Number(ev.target.value);
                    const next = entrants.map((x) =>
                      x.id === e.id ? { ...x, finish: v } : x,
                    );
                    onChange(next);
                  }}
                  className="w-24 px-2 py-1 rounded-lg bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </td>
              <td className="py-2 pr-2 align-middle">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={e.manualWeight ?? ""}
                  onChange={(ev) => {
                    const v = ev.target.value === "" ? undefined : Number(ev.target.value);
                    const next = entrants.map((x) =>
                      x.id === e.id ? { ...x, manualWeight: v } : x,
                    );
                    onChange(next);
                  }}
                  className="w-28 px-2 py-1 rounded-lg bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </td>
              <td className="py-2 align-middle text-right">
                <Button
                  onClick={() => onRemove(e.id)}
                  variant="danger"
                  size="sm"
                >
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
