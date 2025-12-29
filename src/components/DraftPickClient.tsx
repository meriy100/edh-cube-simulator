"use client";

import React from "react";
import { useRouter } from "next/navigation";
import CardGridWithPreview, { type GridCard } from "./CardGridWithPreview";
import PickedBoard from "./PickedBoard";
import Button from "./ui/Button";
import Card from "./ui/Card";

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
          <Button
            type="button"
            onClick={() =>
              router.push(
                `/drafts/${encodeURIComponent(draftId)}/picks/${encodeURIComponent(String(Math.max(1, pickNumber - 1)))}`,
              )
            }
            disabled={pickNumber <= 1}
            variant="outline"
            aria-disabled={pickNumber <= 1}
          >
            Prev
          </Button>

          {isPickCompleted ? (
            <Button
              type="button"
              onClick={() =>
                router.push(
                  `/drafts/${encodeURIComponent(draftId)}/picks/${encodeURIComponent(String(pickNumber + 1))}`,
                )
              }
              variant="secondary"
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!allSelected || submitting}
              onClick={handleSubmit}
              variant="primary"
              aria-disabled={!allSelected || submitting}
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {seatPacks.map((sp) => (
          <Card key={`seat-${sp.seatIndex}`} as="section">
            <h2 className="text-lg font-semibold mb-3">Seat{sp.seatIndex + 1}</h2>
            <div className="relative pb-8">
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
                <div className="flex items-center mb-2">
                  <h3 className="text-base font-semibold">Picked so far</h3>
                </div>
                <PickedBoard
                  draftId={draftId}
                  seatIndex={sp.seatIndex}
                  pickedCards={sp.pickedCards}
                />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
