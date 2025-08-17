"use client";

import React from "react";

export type GridCard = {
  id: string;
  name: string;
  set: string;
  number: string;
  normalUrl: string;
  largeUrl: string;
};

type Props = {
  cards: GridCard[];
  perRow?: number;
  className?: string;
};

export default function CardGridWithPreview({ cards, perRow = 6, className }: Props) {
  const [hovered, setHovered] = React.useState<GridCard | null>(null);

  const rows: GridCard[][] = React.useMemo(() => {
    const res: GridCard[][] = [];
    for (let i = 0; i < cards.length; i += perRow) {
      res.push(cards.slice(i, i + perRow));
    }
    return res;
  }, [cards, perRow]);

  return (
    <div className={"relative pr-64 sm:pr-72 " + (className ?? "")}>
      {" "}
      {/* reserve right area for preview */}
      <div className="flex flex-col">
        {rows.map((row, rIdx) => (
          <div
            key={`row-${rIdx}`}
            className={`flex flex-row flex-wrap items-start gap-2 ${rIdx === 0 ? "" : "-mt-24 sm:-mt-28"}`}
          >
            {row.map((c) => (
              <div key={c.id} className="relative">
                <img
                  src={c.normalUrl}
                  alt={`${c.name} (${c.set}) #${c.number}`}
                  loading="lazy"
                  className="w-40 sm:w-48 h-auto rounded shadow-sm border border-black/10 dark:border-white/10 bg-white"
                  onMouseEnter={() => setHovered(c)}
                  onFocus={() => setHovered(c)}
                  onMouseLeave={() => setHovered((h) => (h?.id === c.id ? null : h))}
                  onBlur={() => setHovered((h) => (h?.id === c.id ? null : h))}
                />
              </div>
            ))}
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
