import { useState } from "react";
import type { Entrant, Scheme } from "../types";
import { Button } from "./ui";

export default function EntrantForm({
  scheme,
  onAdd,
}: {
  scheme: Scheme;
  onAdd: (e: Entrant) => void;
}) {
  const [name, setName] = useState("");
  const [finish, setFinish] = useState<number | "">("");
  const [manualWeight, setManualWeight] = useState<number | "">("");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      finish: finish === "" ? undefined : Number(finish),
      manualWeight: manualWeight === "" ? undefined : Number(manualWeight),
    });
    setName("");
    setFinish("");
    setManualWeight("");
  };

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        handleAdd();
      }}
    >
      <label className="min-w-[180px] flex-1 basis-full sm:basis-0">
        <span className="eyebrow mb-1.5 block">Add a team</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="field"
          placeholder="Team or manager name"
        />
      </label>

      <label className="w-24">
        <span className="eyebrow mb-1.5 block">Finish</span>
        <input
          type="number"
          min={1}
          step={1}
          value={finish}
          onChange={(e) =>
            setFinish(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="field"
          placeholder="1 = champ"
        />
      </label>

      {scheme === "custom" && (
        <label className="w-24">
          <span className="eyebrow mb-1.5 block">Weight</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={manualWeight}
            onChange={(e) =>
              setManualWeight(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            className="field"
            placeholder="e.g. 3.5"
          />
        </label>
      )}

      <Button type="submit" variant="primary" className="ml-auto h-[38px]">
        Add
      </Button>
    </form>
  );
}
