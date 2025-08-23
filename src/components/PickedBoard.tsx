"use client";

import React from "react";
import type { GridCard } from "./CardGridWithPreview";

export type BoardState = {
  main: string[]; // flat list kept for backward-compatibility and count
  side: string[]; // card ids in sideboard
  mainGrid?: string[][]; // 7x2 (14 cells) grid of card ids
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

const MAIN_COLS = 7;
const MAIN_ROWS = 2;
const MAIN_CELLS = MAIN_COLS * MAIN_ROWS;

function flatten(cells: string[][]): string[] {
  return cells.flat();
}

function emptyCells(): string[][] {
  return Array.from({ length: MAIN_CELLS }, () => [] as string[]);
}

function normalizeCells(cells: string[][]): string[][] {
  const base = emptyCells();
  for (let i = 0; i < Math.min(cells.length, MAIN_CELLS); i++) base[i] = cells[i];
  return base;
}

function reconcileState(
  ids: string[],
  current: BoardState | null,
  defaultCellIndexForId: (id: string) => number,
): BoardState {
  const unique = Array.from(new Set(ids));
  const seen = new Set(unique);

  // Build from current if exists
  if (current) {
    // Start from existing grid if present, otherwise rebuild from main flat array
    const cells = current.mainGrid
      ? normalizeCells(current.mainGrid.map((cell) => cell.filter((id) => seen.has(id))))
      : (() => {
          const cs = emptyCells();
          const filteredMain = (current.main || []).filter((id) => seen.has(id));
          // Place filteredMain into their default cells for migration
          for (const id of filteredMain) {
            const idx = defaultCellIndexForId(id);
            if (cs[idx]) cs[idx].push(id);
          }
          return cs;
        })();

    const side = (current.side || []).filter((id) => seen.has(id));

    // Place any new ids (not in cells/side) into their default cells
    const placed = new Set([...flatten(cells), ...side]);
    const rest = unique.filter((id) => !placed.has(id));
    if (rest.length) {
      for (const id of rest) {
        const idx = defaultCellIndexForId(id);
        if (cells[idx]) cells[idx].push(id);
      }
    }

    return { main: flatten(cells), side, mainGrid: cells };
  }

  // No current persisted state -> place into default cells
  const cells = emptyCells();
  for (const id of unique) {
    const idx = defaultCellIndexForId(id);
    if (cells[idx]) cells[idx].push(id);
  }
  return { main: flatten(cells), side: [], mainGrid: cells };
}

export default function PickedBoard({
  draftId,
  seatIndex,
  pickedCards,
  perRow = 6,
  className,
}: Props) {
  const ids = React.useMemo(() => pickedCards.map((c) => c.id), [pickedCards]);
  // Initialize with SSR-safe default to avoid hydration mismatch.
  const [board, setBoard] = React.useState<BoardState>({
    main: ids,
    side: [],
    mainGrid: emptyCells(),
  });
  const [hovered, setHovered] = React.useState<GridCard | null>(null);

  // Compute default cell index based on types and mana value
  const defaultCellIndexForId = React.useCallback(
    (id: string) => {
      const c = pickedCards.find((x) => x.id === id);
      const mv = Number.isFinite(c?.manaValue as number)
        ? Math.max(0, Math.floor((c?.manaValue as number) || 0))
        : 0;
      const col = Math.min(MAIN_COLS - 1, mv);
      const types = c?.types ?? [];
      const hasCreature = Array.isArray(types) ? types.includes("Creature") : false;
      const row = hasCreature ? 0 : 1; // 1st row for creatures; 2nd row for non-creatures and lands
      return row * MAIN_COLS + col;
    },
    [pickedCards],
  );

  // After mount, load from localStorage and reconcile with current ids.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(draftId, seatIndex));
      const parsed = raw ? (JSON.parse(raw) as BoardState) : null;
      setBoard((prev) => reconcileState(ids, parsed ?? prev, defaultCellIndexForId));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, seatIndex]);

  // Reconcile when pickedCards change (e.g., after new pick)
  React.useEffect(() => {
    setBoard((prev) => reconcileState(ids, prev, defaultCellIndexForId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join("|"), defaultCellIndexForId]);

  const moveCardToCell = React.useCallback(
    (cardId: string, cellIndex: number) => {
      setBoard((prev) => {
        const cells = normalizeCells(prev.mainGrid || emptyCells()).map((cell) =>
          cell.filter((id) => id !== cardId),
        );
        const side = prev.side.filter((id) => id !== cardId);
        if (!cells[cellIndex]) return prev;
        if (!cells[cellIndex].includes(cardId)) cells[cellIndex] = [...cells[cellIndex], cardId];
        const next = { main: flatten(cells), side, mainGrid: cells } as BoardState;
        try {
          localStorage.setItem(storageKey(draftId, seatIndex), JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [draftId, seatIndex],
  );

  const moveTo = React.useCallback(
    (cardId: string, dest: "main" | "side") => {
      setBoard((prev) => {
        if (dest === "side") {
          const cells = normalizeCells(prev.mainGrid || emptyCells()).map((cell) =>
            cell.filter((id) => id !== cardId),
          );
          if (prev.side.includes(cardId)) {
            const next = { main: flatten(cells), side: prev.side, mainGrid: cells } as BoardState;
            try {
              localStorage.setItem(storageKey(draftId, seatIndex), JSON.stringify(next));
            } catch {}
            return next;
          }
          const side = [...prev.side, cardId];
          const next = { main: flatten(cells), side, mainGrid: cells } as BoardState;
          try {
            localStorage.setItem(storageKey(draftId, seatIndex), JSON.stringify(next));
          } catch {}
          return next;
        } else {
          // default main drop -> put into default cell based on type/mana
          const cells = normalizeCells(prev.mainGrid || emptyCells()).map((cell) =>
            cell.filter((id) => id !== cardId),
          );
          const idx = defaultCellIndexForId(cardId);
          cells[idx] = [...(cells[idx] || []), cardId];
          const side = prev.side.filter((id) => id !== cardId);
          const next = { main: flatten(cells), side, mainGrid: cells } as BoardState;
          try {
            localStorage.setItem(storageKey(draftId, seatIndex), JSON.stringify(next));
          } catch {}
          return next;
        }
      });
    },
    [draftId, seatIndex, defaultCellIndexForId],
  );

  const onDragStart = (
    e: React.DragEvent<HTMLImageElement>,
    cardId: string,
    from: "mainCell" | "side",
    cellIndex?: number,
  ) => {
    e.dataTransfer.setData("text/plain", cardId);
    e.dataTransfer.setData("application/x-from", from);
    if (from === "mainCell" && typeof cellIndex === "number") {
      e.dataTransfer.setData("application/x-cell-index", String(cellIndex));
    }
    e.dataTransfer.effectAllowed = "move";
  };

  const onDropToCell = (e: React.DragEvent<HTMLDivElement>, cellIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const cardId = e.dataTransfer.getData("text/plain");
    if (!cardId) return;
    moveCardToCell(cardId, cellIndex);
  };

  const onDropTo = (e: React.DragEvent<HTMLDivElement>, dest: "main" | "side") => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData("text/plain");
    if (cardId) moveTo(cardId, dest);
  };

  const renderSideGrid = (ids: string[]) => {
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
                    onDragStart={(e) => onDragStart(e, id, "side")}
                    onMouseEnter={() => setHovered(c)}
                    onFocus={() => setHovered(c)}
                    onMouseLeave={() => setHovered((h) => (h?.id === c.id ? null : h))}
                    onBlur={() => setHovered((h) => (h?.id === c.id ? null : h))}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderMainGrid = (cells: string[][]) => {
    return (
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: MAIN_CELLS }).map((_, idx) => {
          const idsInCell = cells[idx] || [];
          return (
            <div
              key={idx}
              className="relative min-h-[6rem] sm:min-h-[8rem] border border-dashed border-black/20 dark:border-white/20 rounded p-1"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => onDropToCell(e, idx)}
              aria-label={`Mainboard cell ${idx + 1}`}
            >
              <div className="flex flex-col">
                {idsInCell.map((id, i) => {
                  const c = pickedCards.find((x) => x.id === id);
                  if (!c) return null;
                  return (
                    <div key={id} className={`${i === 0 ? "" : "-mt-32 sm:-mt-36"} relative`}>
                      <img
                        src={c.normalUrl}
                        alt={`${c.name} (${c.set}) #${c.number}`}
                        loading="lazy"
                        className="w-32 sm:w-40 h-auto rounded shadow-sm border bg-white border-black/10 dark:border-white/10 cursor-move"
                        draggable
                        onDragStart={(e) => onDragStart(e, id, "mainCell", idx)}
                        onMouseEnter={() => setHovered(c)}
                        onFocus={() => setHovered(c)}
                        onMouseLeave={() => setHovered((h) => (h?.id === c.id ? null : h))}
                        onBlur={() => setHovered((h) => (h?.id === c.id ? null : h))}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={(className ? className + " " : "") + "relative pr-64 sm:pr-72"}>
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
          <div className="relative pb-8">{renderMainGrid(board.mainGrid || emptyCells())}</div>
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
          <div className="relative pb-8">{renderSideGrid(board.side)}</div>
        </div>
      </div>
      {/* Right-side preview area */}
      <div
        className="pointer-events-none absolute top-0 right-0 h-full w-60 sm:w-72 flex items-start justify-center"
        aria-hidden={hovered ? "false" : "true"}
      >
        {hovered && (
          <div className="sticky top-2">
            <img
              src={hovered.largeUrl || hovered.normalUrl}
              alt={`${hovered.name} preview`}
              loading="eager"
              className="w-60 sm:w-72 h-auto rounded-lg shadow-lg border border-black/20 dark:border-white/20 bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
}
