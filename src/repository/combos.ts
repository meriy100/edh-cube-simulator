import { Combo } from "@/domain/entity/combo";
import z from "zod";
import adminDb from "@/lib/firebase/admin";
import { Color } from "@/domain/entity/card";
import { fetchCards } from "@/repository/cards";

const featureProducedByVariantSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const comboSchema = z.object({
  id: z.string(),
  uses: z.array(
    z.object({
      card: z.object({ id: z.number(), name: z.string() }),
      quantity: z.number(),
      zoneLocations: z.array(z.string()),
    }),
  ),
  manaNeeded: z.string(),
  identity: z.string().transform((identity) => identity.toUpperCase().split("") as Color[]),
  produces: z.array(z.object({ feature: featureProducedByVariantSchema })),
  easyPrerequisites: z.string(),
  notablePrerequisites: z.string(),
  description: z.string(),
  popularity: z.number(),
  cardNames: z.array(z.string()),
});

const collectionPath = "combos";

export const fetchCombos = async (query: { cardName?: string }): Promise<Combo[]> => {
  const combosRef = adminDb().collection(collectionPath);
  let q: typeof combosRef | ReturnType<typeof combosRef.where> = combosRef;

  if (query.cardName) {
    q = q.where("cardNames", "array-contains", query.cardName);
  }

  // 3. 最後に一度だけ実行
  const snapshot = await q.get();

  const combos = z.array(comboSchema).parse(snapshot.docs.map((doc) => doc.data()));

  const cardNames = combos.flatMap((combo) => combo.cardNames);
  const uniqueCardNames = new Set(cardNames);
  const cards = await fetchCards({ names: Array.from(uniqueCardNames) });

  return combos.map((combo) => {
    return {
      ...combo,
      uses: combo.uses.map((use) => {
        const card = cards.find((c) => c.name === use.card.name);
        if (card === undefined) {
          throw new Error(`Card not found: ${use.card.name}`);
        }
        return {
          ...use,
          card: {
            ...use.card,
            relation: card,
          },
        };
      }),
    };
  });
};
