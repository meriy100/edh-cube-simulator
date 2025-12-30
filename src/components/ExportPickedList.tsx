"use client";

import React from "react";
import type { GridCard } from "./CardGridWithPreview";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import Textarea from "./ui/Textarea";

type Props = {
  draftId: string;
  cards: GridCard[];
  seatIndex: number; // used for label and storage key
};

// keep single-line format per card as-is
function buildLine(c: GridCard): string {
  return `1 ${c.name} (${c.set}) ${c.number}`;
}

function storageKey(draftId: string, seatIndex: number) {
  return `draft:${draftId}:seat:${seatIndex}:board`;
}

type BoardState = {
  main: string[];
  side: string[];
  mainGrid?: string[][];
};

export default function ExportPickedList({ draftId, cards, seatIndex }: Props) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [copied, setCopied] = React.useState(false);

  const rebuildText = React.useCallback(() => {
    try {
      const idToCard = new Map(cards.map((c) => [c.id, c] as const));
      const raw =
        typeof window !== "undefined" ? localStorage.getItem(storageKey(draftId, seatIndex)) : null;
      const parsed: BoardState | null = raw ? JSON.parse(raw) : null;
      const grid = parsed?.mainGrid;
      const mainIds =
        Array.isArray(grid) && grid.length
          ? grid.flat()
          : Array.isArray(parsed?.main)
            ? parsed!.main
            : cards.map((c) => c.id);
      const sideIds = Array.isArray(parsed?.side) ? parsed!.side : [];

      // Filter to picked cards only and keep order, also ensure no duplicates
      const seen = new Set<string>();
      const mainList: GridCard[] = [];
      for (const id of mainIds) {
        if (seen.has(id)) continue;
        const c = idToCard.get(id);
        if (c) {
          mainList.push(c);
          seen.add(id);
        }
      }
      const sideList: GridCard[] = [];
      for (const id of sideIds) {
        if (seen.has(id)) continue;
        const c = idToCard.get(id);
        if (c) {
          sideList.push(c);
          seen.add(id);
        }
      }
      // Any remaining picked cards (not present in saved state) -> default to mainboard at end
      for (const c of cards) {
        if (!seen.has(c.id)) mainList.push(c);
      }

      const mainText = mainList.map(buildLine).join("\n");
      const sideText = sideList.map(buildLine).join("\n");
      const headerMain = "mainboard";
      const headerSide = "sideboard";
      const finalText = `${headerMain}\n\n${mainText}\n\n${headerSide}\n\n${sideText}`.trimEnd();
      setText(finalText);
    } catch (e) {
      console.error("failed to build export text", e);
      // fallback: single list
      setText(cards.map(buildLine).join("\n"));
    }
  }, [cards, draftId, seatIndex]);

  React.useEffect(() => {
    if (open) rebuildText();
  }, [open, rebuildText]);

  const onCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback: select the textarea and execCommand
        const ta = textareaRef.current;
        if (ta) {
          ta.focus();
          ta.select();
          document.execCommand("copy");
          ta.setSelectionRange(0, 0);
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("copy failed", e);
      alert("コピーに失敗しました");
    }
  };

  return (
    <div className="inline-block">
      <Button
        type="button"
        onClick={() => setOpen(true)}
        variant="primary"
        aria-haspopup="dialog"
        aria-controls={open ? `export-modal-${seatIndex ?? "x"}` : undefined}
      >
        Export
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Export Seat${(seatIndex ?? 0) + 1} Picks`}
        size="xl"
        id={`export-modal-${seatIndex ?? "x"}`}
      >
        <Textarea ref={textareaRef} size="xl" monospace readOnly value={text} className="mb-3" />
        <div className="flex items-center gap-2">
          <Button type="button" onClick={onCopy} variant="primary" size="sm">
            {copied ? "Copied!" : "Copy Clipboard"}
          </Button>
          <div className="opacity-70 text-xs">Moxfield 形式: 1 Name (SET) NUMBER</div>
        </div>
      </Modal>
    </div>
  );
}
