import { Combo } from "@/domain/entity/combo";
import z from "zod";
import adminDb from "@/lib/firebase/admin";
import { cardNameJa, Color } from "@/domain/entity/card";
import { fetchCards } from "@/repository/cards";
import { chunk } from "lodash";
import { publishMessage } from "@/lib/pubsub";

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

  descriptionJa: z.string().optional(),
  notablePrerequisitesJa: z.string().optional(),
});

const collectionPath = "combos";

export const fetchCombos = async (query: {
  ids?: string[];
  cardName?: string;
}): Promise<Combo[]> => {
  const combosRef = adminDb().collection(collectionPath);
  let q: typeof combosRef | ReturnType<typeof combosRef.where> = combosRef;

  if (query.cardName) {
    q = q.where("cardNames", "array-contains", query.cardName);
  }

  if (query.ids) {
    const batches = chunk(query.ids, 30);

    const batchPromises = batches.map(async (idBatch) => {
      const snapshot = await q.where("id", "in", idBatch).get();
      return z.array(comboSchema).parse(snapshot.docs.map((doc) => doc.data()));
    });

    const batchResults = await Promise.all(batchPromises);

    return await assignRelation(batchResults.flat());
  }

  const snapshot = await q.get();

  const combos = z.array(comboSchema).parse(snapshot.docs.map((doc) => doc.data()));
  return assignRelation(combos);
};

const assignRelation = async (combos: z.infer<typeof comboSchema>[]): Promise<Combo[]> => {
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

export const translateCombos = async (combos: Combo[]) => {
  const batches = chunk(combos, 50);
  await Promise.all(
    batches.map(async (batch) => {
      const message = {
        combos: batch.map((combo) => ({
          id: combo.id,
          description: combo.description,
          notablePrerequisites: combo.notablePrerequisites,
          nameDictionary: combo.uses.map((use) => ({
            en: use.card.name,
            ja: cardNameJa(use.card.relation),
          })),
        })),
      };

      return await publishMessage("worker-topic", message, { eventType: "translateCombos" });
    }),
  );
};
