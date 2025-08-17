"use client";

import React from "react";
import { useRouter } from "next/navigation";
import CardGridWithPreview, { type GridCard } from "./CardGridWithPreview";

export type SeatPack = {
  seatIndex: number;
  packId: string;
  cards: GridCard[];
};

type Props = {
  poolId: string;
  draftId: string;
  pickNumber: number;
  seatPacks: SeatPack[]; // length === seat for current pick
};

export default function DraftPickClient({ poolId, draftId, pickNumber, seatPacks }: Props) {
  const router = useRouter();
  const [selections, setSelections] = React.useState<Record<number, string[]>>(() => ({}));
  const [submitting, setSubmitting] = React.useState(false);
  const allSelected = React.useMemo(() => {
    // must have exactly 2 selections for each seat index present in seatPacks
    if (!seatPacks || seatPacks.length === 0) return false;
    const ok = seatPacks.every((sp) => (selections[sp.seatIndex]?.length ?? 0) === 2);
    return ok;
  }, [seatPacks, selections]);

  const onChangeForSeat = React.useCallback((seatIndex: number, ids: string[]) => {
    setSelections((prev) => ({ ...prev, [seatIndex]: ids.slice(0, 2) }));
  }, []);

  const handleSubmit = async () => {
    if (!allSelected || submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        picks: seatPacks.map((sp) => ({
          seatIndex: sp.seatIndex,
          packId: sp.packId,
          cardIds: (selections[sp.seatIndex] ?? []).slice(0, 2),
        })),
      };
      const res = await fetch(
        `/api/pools/${encodeURIComponent(poolId)}/drafts/${encodeURIComponent(draftId)}/picks/${encodeURIComponent(String(pickNumber))}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed to submit picks: ${res.status}`);
      }
      const data = (await res.json()) as { nextPickNumber: number };
      const next = data?.nextPickNumber ?? pickNumber + 1;
      // Always go to the next pick; the server/page will clamp the visible slice as needed
      router.push(
        `/pools/${encodeURIComponent(poolId)}/drafts/${encodeURIComponent(draftId)}/picks/${encodeURIComponent(String(next))}`,
      );
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Top bar with Submit */}
      <div className="flex items-center gap-3 mb-4">
        <div className="ml-auto">
          <button
            type="button"
            disabled={!allSelected || submitting}
            onClick={handleSubmit}
            className={
              "px-4 py-2 rounded font-semibold border " +
              (allSelected && !submitting
                ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
                : "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed")
            }
            aria-disabled={!allSelected || submitting}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {seatPacks.map((sp) => (
          <section
            key={`seat-${sp.seatIndex}`}
            className="border border-black/10 dark:border-white/15 rounded p-3"
          >
            <h2 className="text-lg font-semibold mb-3">Seat{sp.seatIndex + 1}</h2>
            <div className="relative pb-24">
              <CardGridWithPreview
                cards={sp.cards}
                perRow={6}
                selectable
                maxSelected={2}
                onSelectedChange={(ids) => onChangeForSeat(sp.seatIndex, ids)}
              />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
