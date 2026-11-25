import { after } from "next/server";
import z from "zod";
import { createPool, updatePoolStatus } from "@/repository/pools";
import { newPool, PoolId } from "@/domain/entity/pool";
import { createCards, fetchCards } from "@/repository/cards";
import { createPoolXCards } from "@/repository/poolXCards";
import { PoolXCard } from "@/domain/entity/poolXCard";
import { fetchScryfall } from "@/lib/scryfall";
import { newCardId } from "@/domain/entity/card";
import { publishMessage } from "@/lib/pubsub";

const tagsSchema = z.preprocess(
  (v) => (typeof v === "string" ? v.split(";") : v),
  z.array(z.string()).transform((tags) => tags.map((tag) => tag.trim())),
);

/** One card row of a pool source (CubeCobra CSV or CubeCobra API). */
export const poolImportRowSchema = z.object({
  name: z.string(),
  cmc: z.coerce.number().int(),
  type: z.string(),
  set: z.string(),
  collectorNumber: z.string(),
  originalImageUrl: z.string().optional(),
  originalImageBackUrl: z.string().optional(),
  tags: tagsSchema,
});

export type PoolImportRow = z.infer<typeof poolImportRowSchema>;

/**
 * Creates a new pool from card rows.
 * Cards, the pool and its poolXCards are saved (status `ready`) before returning;
 * the worker jobs (Scryfall data, combos) are published after the response via `after()`.
 */
export const importPool = async (rows: PoolImportRow[], version: string): Promise<PoolId> => {
  // One request at a time: Scryfall rate-limits bursts with 429.
  const fixedNames = new Map<string, string>();
  for (const d of rows.filter((d) => d.tags.includes("x-edh-cube-discover:fixed-name"))) {
    const { en } = await fetchScryfall(d.name, { onlyEn: true });
    fixedNames.set(d.name, en.name);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const nameOf = (d: PoolImportRow) => fixedNames.get(d.name) ?? d.name;

  await createCards(
    rows.map((d) => ({
      name: nameOf(d),
      cmc: d.cmc,
      type: d.type,
      set: d.set,
      collectorNumber: d.collectorNumber,
      originalImageUrl: d.originalImageUrl,
      originalImageBackUrl: d.originalImageBackUrl,
    })),
  );

  const pool = newPool({ count: rows.length, version });
  await createPool(pool);

  // poolXCards are written before returning so the pool is ready by the time the
  // admin opens it; only the worker messages are sent after the response.
  try {
    await createPoolXCards(
      pool.id,
      rows.map(
        (d): Omit<PoolXCard, "card"> => ({
          name: nameOf(d),
          commander: d.tags.includes("0-commander"),
          outside: d.tags.some((tag) => tag.startsWith("9-")),
          tags: d.tags,
        }),
      ),
    );
    await updatePoolStatus(pool.id, "ready");
  } catch (error) {
    await updatePoolStatus(
      pool.id,
      "error",
      error instanceof Error ? error.message : "Unknown error occurred",
    );
    throw error;
  }

  after(async () => {
    try {
      const cards = await fetchCards({ names: rows.map(nameOf) });
      const attachScryfallMessage = {
        cards: cards
          .filter((c) => c.scryfall === undefined)
          .map((card) => ({ id: newCardId(card.name), name: card.name })),
      };

      const saveCombosMessage = {
        poolId: pool.id,
        cards: rows
          .filter((d) => !d.tags.includes("x-edh-cube-discover:exclude-combos"))
          .map(nameOf)
          .map((name) => ({ id: newCardId(name), name: name })),
      };

      await Promise.all([
        publishMessage("worker-topic", attachScryfallMessage, { eventType: "attachScryfall" }),
        publishMessage("worker-topic", saveCombosMessage, { eventType: "saveCombos" }),
      ]);
    } catch (error) {
      console.error("Error publishing worker messages:", error);
    }
  });

  return pool.id;
};
