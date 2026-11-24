import z from "zod";
import { PoolImportRow, poolImportRowSchema } from "@/lib/poolImport";

/** https://cubecobra.com/cube/list/53660c07-bc7d-42f8-bcba-35b030d22a4c */
export const CUBECOBRA_CUBE_ID = "53660c07-bc7d-42f8-bcba-35b030d22a4c";

export const cubeCobraCubeUrl = (cubeId: string = CUBECOBRA_CUBE_ID) =>
  `https://cubecobra.com/cube/list/${cubeId}`;

const cubeCardSchema = z.object({
  tags: z.array(z.string()).optional(),
  imgUrl: z.string().optional(),
  imgBackUrl: z.string().optional(),
  // Per-cube overrides; fall back to the card details when absent.
  cmc: z.coerce.number().optional(),
  type_line: z.string().optional(),
  details: z.object({
    name: z.string(),
    cmc: z.number(),
    type: z.string(),
    set: z.string(),
    collector_number: z.string(),
  }),
});

const cubeJsonSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.number(),
  cards: z.object({
    mainboard: z.array(cubeCardSchema),
  }),
});

export interface CubeCobraCube {
  id: string;
  name: string;
  /** CubeCobra's own revision number, incremented on every cube edit. */
  version: number;
  rows: PoolImportRow[];
}

/** Fetches the mainboard of a cube from CubeCobra's cubeJSON endpoint. */
export const fetchCubeCobraCube = async (
  cubeId: string = CUBECOBRA_CUBE_ID,
): Promise<CubeCobraCube> => {
  const res = await fetch(`https://cubecobra.com/cube/api/cubeJSON/${cubeId}`, {
    headers: {
      "User-Agent": "EDHCubeSimulator/1.0 (contact: meriy100)",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`CubeCobra API error: ${res.status}`);
  }

  const cube = cubeJsonSchema.parse(await res.json());

  const rows = cube.cards.mainboard.map((card) =>
    poolImportRowSchema.parse({
      name: card.details.name,
      cmc: card.cmc ?? card.details.cmc,
      // CubeCobra's CSV export writes "-" instead of "—"; keep the stored type lines the same.
      type: (card.type_line ?? card.details.type).replaceAll("—", "-"),
      set: card.details.set,
      collectorNumber: card.details.collector_number,
      originalImageUrl: card.imgUrl || undefined,
      originalImageBackUrl: card.imgBackUrl || undefined,
      tags: card.tags ?? [],
    }),
  );

  return { id: cube.id, name: cube.name, version: cube.version, rows };
};
