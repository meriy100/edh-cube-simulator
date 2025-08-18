"use client";

import React from "react";
import type { GridCard } from "./CardGridWithPreview";

type Props = {
  cards: GridCard[];
  seatIndex?: number; // optional, for label only
};

function buildExportText(cards: GridCard[]): string {
  // Export format: "1 Name (SET) NUMBER" per line, matching root page pool input format (without tags)
  // Keep order as provided. Ensure numbers/sets exist.
  return cards.map((c) => `1 ${c.name} (${c.set}) ${c.number}`).join("\n");
}

export default function ExportPickedList({ cards, seatIndex }: Props) {
  const [open, setOpen] = React.useState(false);
  const text = React.useMemo(() => buildExportText(cards), [cards]);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [copied, setCopied] = React.useState(false);

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm underline cursor-pointer"
        aria-haspopup="dialog"
        aria-controls={open ? `export-modal-${seatIndex ?? "x"}` : undefined}
      >
        Export
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          id={`export-modal-${seatIndex ?? "x"}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* modal content */}
          <div className="relative z-10 w-full max-w-2xl rounded-lg bg-background text-foreground border border-black/20 dark:border-white/20 shadow-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold flex-1">
                Export Seat{(seatIndex ?? 0) + 1} Picks
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-2 py-1 text-sm rounded border border-black/20 dark:border-white/20 hover:bg-foreground hover:text-background"
                aria-label="Close"
              >
                Close
              </button>
            </div>
            <textarea
              ref={textareaRef}
              className="w-full h-72 p-2 rounded border border-black/10 dark:border-white/20 bg-transparent font-mono text-sm"
              readOnly
              value={text}
            />
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={onCopy}
                className="rounded bg-foreground text-background px-3 py-1.5 text-sm font-semibold hover:opacity-90 cursor-pointer"
              >
                {copied ? "Copied!" : "Copy Clipboard"}
              </button>
              <div className="opacity-70 text-xs">Moxfield 形式: 1 Name (SET) NUMBER</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
