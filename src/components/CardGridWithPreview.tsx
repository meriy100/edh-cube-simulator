"use client";

import React from "react";

export type GridCard = {
  id: string;
  name: string;
  set: string;
  number: string;
  normalUrl: string;
  largeUrl: string;
  // Optional metadata to help board layout and exports
  types?: string[]; // e.g., ["Creature"], ["Artifact"], ["Land"]
  manaValue?: number; // Scryfall cmc/mana_value rounded down to integer >= 0
};

type Props = {
  cards: GridCard[];
  perRow?: number;
  className?: string;
  selectable?: boolean;
  maxSelected?: number; // 最大選択数（シートごと）
  initialSelectedIds?: string[]; // 初期選択
  onSelectedChange?: (ids: string[]) => void; // 選択変更通知
  highlightedIds?: string[]; // 選択不可時でも視覚的にハイライトするカードID
};

export default function CardGridWithPreview({
  cards,
  perRow = 6,
  className,
  selectable = false,
  maxSelected = 2,
  initialSelectedIds,
  onSelectedChange,
  highlightedIds,
}: Props) {
  const [hovered, setHovered] = React.useState<GridCard | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    new Set(initialSelectedIds ?? []),
  );

  // notify parent when selection changes (avoid effect loops on callback identity changes)
  const onChangeRef = React.useRef<typeof onSelectedChange>(onSelectedChange);
  React.useEffect(() => {
    onChangeRef.current = onSelectedChange;
  }, [onSelectedChange]);
  React.useEffect(() => {
    onChangeRef.current?.(Array.from(selectedIds));
  }, [selectedIds]);

  // if initialSelectedIds changes, sync once
  React.useEffect(() => {
    if (initialSelectedIds) {
      setSelectedIds(new Set(initialSelectedIds));
    }
  }, [initialSelectedIds]);

  const rows: GridCard[][] = React.useMemo(() => {
    const res: GridCard[][] = [];
    for (let i = 0; i < cards.length; i += perRow) {
      res.push(cards.slice(i, i + perRow));
    }
    return res;
  }, [cards, perRow]);

  const toggleSelect = React.useCallback(
    (card: GridCard) => {
      if (!selectable) return;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(card.id)) {
          next.delete(card.id);
          return next;
        }
        if (next.size >= maxSelected) {
          // 最大選択数に達している場合はそれ以上選択しない
          return next;
        }
        next.add(card.id);
        return next;
      });
    },
    [selectable, maxSelected],
  );

  const isSelected = React.useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  return (
    <div className={"relative pr-64 sm:pr-72 " + (className ?? "")}>
      {" "}
      {/* reserve right area for preview */}
      <div className="flex flex-col">
        {rows.map((row, rIdx) => (
          <div
            key={`row-${rIdx}`}
            className={`flex flex-row flex-wrap items-start gap-2 ${rIdx === 0 ? "" : "-mt-40 sm:-mt-44"}`}
          >
            {row.map((c) => {
              const isVisuallyHighlighted =
                (highlightedIds?.includes(c.id) ?? false) || (selectable && isSelected(c.id));
              return (
                <div key={c.id} className="relative">
                  <img
                    src={c.normalUrl}
                    alt={`${c.name} (${c.set}) #${c.number}`}
                    loading="lazy"
                    className={
                      "w-40 sm:w-48 h-auto rounded shadow-sm border bg-white " +
                      (isVisuallyHighlighted
                        ? "border-4 border-emerald-500 shadow-emerald-500/40"
                        : "border-black/10 dark:border-white/10") +
                      (selectable ? " cursor-pointer" : "")
                    }
                    onMouseEnter={() => setHovered(c)}
                    onFocus={() => setHovered(c)}
                    onMouseLeave={() => setHovered((h) => (h?.id === c.id ? null : h))}
                    onBlur={() => setHovered((h) => (h?.id === c.id ? null : h))}
                    onClick={() => (selectable ? toggleSelect(c) : undefined)}
                    role={selectable ? "button" : undefined}
                    aria-pressed={
                      selectable ? (isVisuallyHighlighted ? "true" : "false") : undefined
                    }
                    tabIndex={selectable ? 0 : -1}
                  />
                </div>
              );
            })}
          </div>
        ))}
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
