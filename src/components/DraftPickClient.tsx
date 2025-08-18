"use client";

import React from "react";
import { useRouter } from "next/navigation";
import CardGridWithPreview, { type GridCard } from "./CardGridWithPreview";

export type SeatPack = {
  seatIndex: number;
  packId: string;
  cards: GridCard[]; // current pack remaining cards
  pickedCards?: GridCard[]; // already picked cards up to previous pick
  pickedThisPickIds?: string[]; // このピックで実際に選択されたカードID（完了表示用）
};

type Props = {
  poolId: string; // kept for potential future use
  draftId: string;
  pickNumber: number;
  seatPacks: SeatPack[]; // length === seat for current pick
  isPickCompleted?: boolean; // when true, show Next instead of Submit
};

export default function DraftPickClient({
  draftId,
  pickNumber,
  seatPacks,
  isPickCompleted,
}: Props) {
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
        `/api/drafts/${encodeURIComponent(draftId)}/picks/${encodeURIComponent(String(pickNumber))}`,
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
      const data = (await res.json()) as { nextPickNumber: number; isComplete?: boolean };
      const next = data?.nextPickNumber ?? pickNumber + 1;
      if (data?.isComplete) {
        router.push(`/drafts/${encodeURIComponent(draftId)}/picks`);
      } else {
        // Go to the next pick; the server/page will clamp the visible slice as needed
        router.push(
          `/drafts/${encodeURIComponent(draftId)}/picks/${encodeURIComponent(String(next))}`,
        );
      }
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Top bar with Prev + Submit/Next (sticky) */}
      <div className="sticky top-0 z-20 mb-4 -mx-2 px-2 py-2 bg-white/90 dark:bg-gray-900/80 backdrop-blur border-b border-black/10 dark:border-white/10 flex items-center gap-3">
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/drafts/${encodeURIComponent(draftId)}/picks/${encodeURIComponent(String(Math.max(1, pickNumber - 1)))}`,
              )
            }
            disabled={pickNumber <= 1}
            className={
              "px-4 py-2 rounded font-semibold border " +
              (pickNumber > 1
                ? "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
                : "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed")
            }
            aria-disabled={pickNumber <= 1}
          >
            Prev
          </button>

          {isPickCompleted ? (
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/drafts/${encodeURIComponent(draftId)}/picks/${encodeURIComponent(String(pickNumber + 1))}`,
                )
              }
              className="px-4 py-2 rounded font-semibold border bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700"
            >
              Next
            </button>
          ) : (
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
          )}
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
                selectable={!isPickCompleted}
                maxSelected={2}
                onSelectedChange={
                  isPickCompleted ? undefined : (ids) => onChangeForSeat(sp.seatIndex, ids)
                }
                highlightedIds={isPickCompleted ? sp.pickedThisPickIds : undefined}
              />
            </div>
            {sp.pickedCards && sp.pickedCards.length > 0 && (
              <div className="mt-6">
                <h3 className="text-base font-semibold mb-2">Picked so far</h3>
                <div className="relative pb-24">
                  <CardGridWithPreview cards={sp.pickedCards} perRow={6} />
                </div>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
