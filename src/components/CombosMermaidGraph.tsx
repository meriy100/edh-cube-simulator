"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import mermaid from "mermaid";
import { getCardImageUrl } from "@/lib/cardImage";

export type ComboCard = {
  id: string;
  name: string;
  scryfallJson?: unknown;
  cubeCobra?: unknown;
};

export type ComboItem = {
  id: string;
  sourceId: string;
  cards: ComboCard[];
};

/**
 * Renders a Mermaid.js flowchart where each unique card is a node with its image.
 * For each combo, edges connect cards sequentially (card1 --> card2 --> card3 ...).
 */
export function CombosMermaidGraph({ combos }: { combos: ComboItem[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [svg, setSvg] = useState<string>("");
  const renderId = useId().replace(/[:]/g, "");

  // Prepare Mermaid definition based on combos
  const definition = useMemo(() => {
    if (!combos || combos.length === 0) return "";

    // Map unique cardId -> nodeName (mermaid-safe id)
    const nodeIdByCardId = new Map<string, string>();
    let counter = 0;
    const nodeLines: string[] = [];

    // Helper to sanitize string for HTML label
    const escapeHtml = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");

    // Build nodes
    for (const combo of combos) {
      for (const card of combo.cards) {
        if (!nodeIdByCardId.has(card.id)) {
          const nodeId = `N${counter++}`;
          nodeIdByCardId.set(card.id, nodeId);
          const url =
            getCardImageUrl({ scryfallJson: card.scryfallJson, cubeCobra: card.cubeCobra }) || "";
          const labelHtml = `<img src='${escapeHtml(url)}' alt='${escapeHtml(card.name)}' style='display:block;width:56px;height:auto;border-radius:4px;margin:0;padding:0;'/>`;
          nodeLines.push(`${nodeId}["${labelHtml}"]:::n`);
        }
      }
    }

    // Build edges for each combo
    const edgeLines: string[] = [];
    for (const combo of combos) {
      const cards = combo.cards;
      for (let i = 0; i < cards.length - 1; i++) {
        const a = nodeIdByCardId.get(cards[i].id)!;
        const b = nodeIdByCardId.get(cards[i + 1].id)!;
        edgeLines.push(`${a} --> ${b}`);
      }
    }

    const init = `%%{init: { "securityLevel": "loose", "flowchart": { "htmlLabels": true, "curve": "linear", "nodeSpacing": 24, "rankSpacing": 30 } }}%%`;
    const header = `flowchart LR`;
    const classDef = `classDef n fill:transparent,stroke:transparent;`;
    const lines = [init, header, classDef, ...nodeLines, ...edgeLines];
    return lines.join("\n");
  }, [combos]);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      flowchart: { htmlLabels: true, curve: "linear" },
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function doRender() {
      if (!definition) {
        setSvg("");
        return;
      }
      try {
        const { svg } = await mermaid.render(`graph-${renderId}`, definition);
        if (!cancelled) setSvg(svg);
      } catch (e) {
        // If rendering fails, show a minimal error message
        if (!cancelled)
          setSvg(`<div style='color:#b00;font-size:12px'>Mermaid の描画に失敗しました</div>`);
        console.error(e);
      }
    }
    void doRender();
    return () => {
      cancelled = true;
    };
  }, [definition, renderId]);

  return (
    <div className="border border-black/10 dark:border-white/15 rounded p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">カード関係グラフ</h2>
      <div
        ref={containerRef}
        className="w-full overflow-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {!svg && <div className="text-sm opacity-70">表示するデータがありません</div>}
    </div>
  );
}

export default CombosMermaidGraph;
