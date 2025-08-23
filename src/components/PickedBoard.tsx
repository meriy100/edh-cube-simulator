"use client";

import React from "react";
import type { GridCard } from "./CardGridWithPreview";

export type BoardState = {
  main: string[]; // card ids
  side: string[]; // card ids
};

type Props = {
  draftId: string;
  seatIndex: number;
  pickedCards: GridCard[];
  perRow?: number;
  className?: string;
};

function storageKey(draftId: string, seatIndex: number) {
  return `draft:${draftId}:seat:${seatIndex}:board`;
}

function reconcileState(ids: string[], current: BoardState | null): BoardState {
  const unique = Array.from(new Set(ids));
  if (!current) return { main: unique, side: [] };
  // keep only existing ids; preserve order; append any new to main
  const seen = new Set(unique);
  const main = current.main.filter((id) => seen.has(id));
  const side = current.side.filter((id) => seen.has(id));
  const placed = new Set([...main, ...side]);
  const rest = unique.filter((id) => !placed.has(id));
  return { main: [...main, ...rest], side };
}

export default function PickedBoard({
  draftId,
  seatIndex,
  pickedCards,
  perRow = 6,
  className,
}: Props) {
  const ids = React.useMemo(() => pickedCards.map((c) => c.id), [pickedCards]);
  const [board, setBoard] = React.useState<BoardState>(() => {
    if (typeof window === "undefined") return { main: ids, side: [] };
    try {
      const raw = localStorage.getItem(storageKey(draftId, seatIndex));
      const parsed = raw ? (JSON.parse(raw) as BoardState) : null;
      return reconcileState(ids, parsed);
    } catch {
      return { main: ids, side: [] };
    }
  });

  // reconcile when pickedCards change (e.g., after new pick)
  React.useEffect(() => {
    setBoard((prev) => reconcileState(ids, prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join("|")]);

  // persist
  React.useEffect(() => {
    try {
      localStorage.setItem(storageKey(draftId, seatIndex), JSON.stringify(board));
    } catch {}
  }, [board, draftId, seatIndex]);

  const moveTo = React.useCallback((cardId: string, dest: "main" | "side") => {
    setBoard((prev) => {
      if (prev[dest].includes(cardId)) return prev;
      return {
        main: dest === "main" ? [...prev.main, cardId] : prev.main.filter((id) => id !== cardId),
        side: dest === "side" ? [...prev.side, cardId] : prev.side.filter((id) => id !== cardId),
      };
    });
  }, []);

  const onDragStart = (
    e: React.DragEvent<HTMLImageElement>,
    cardId: string,
    from: "main" | "side",
  ) => {
    e.dataTransfer.setData("text/plain", cardId);
    e.dataTransfer.setData("application/x-from", from);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDropTo = (e: React.DragEvent<HTMLDivElement>, dest: "main" | "side") => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData("text/plain");
    if (cardId) moveTo(cardId, dest);
  };

  const renderGrid = (ids: string[]) => {
    const rows: string[][] = [];
    for (let i = 0; i < ids.length; i += perRow) rows.push(ids.slice(i, i + perRow));
    return (
      <div className="flex flex-col">
        {rows.map((row, rIdx) => (
          <div
            key={rIdx}
            className={`flex flex-row flex-wrap items-start gap-2 ${rIdx === 0 ? "" : "-mt-40 sm:-mt-44"}`}
          >
            {row.map((id) => {
              const c = pickedCards.find((x) => x.id === id);
              if (!c) return null;
              return (
                <div key={id} className="relative">
                  <img
                    src={c.normalUrl}
                    alt={`${c.name} (${c.set}) #${c.number}`}
                    loading="lazy"
                    className="w-40 sm:w-48 h-auto rounded shadow-sm border bg-white border-black/10 dark:border-white/10 cursor-move"
                    draggable
                    onDragStart={(e) =>
                      onDragStart(e, id, board.main.includes(id) ? "main" : "side")
                    }
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <div
          className="border border-dashed border-black/20 dark:border-white/20 rounded p-2"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onDropTo(e, "main")}
          aria-label="Mainboard drop area"
          role="list"
        >
          <div className="flex items-center mb-2">
            <div className="font-semibold">Mainboard</div>
            <div className="ml-2 text-sm opacity-70">{board.main.length}</div>
          </div>
          <div className="relative pb-24">{renderGrid(board.main)}</div>
        </div>
        <div
          className="border border-dashed border-black/20 dark:border-white/20 rounded p-2"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onDropTo(e, "side")}
          aria-label="Sideboard drop area"
          role="list"
        >
          <div className="flex items-center mb-2">
            <div className="font-semibold">Sideboard</div>
            <div className="ml-2 text-sm opacity-70">{board.side.length}</div>
          </div>
          <div className="relative pb-24">{renderGrid(board.side)}</div>
        </div>
      </div>
    </div>
  );
}
