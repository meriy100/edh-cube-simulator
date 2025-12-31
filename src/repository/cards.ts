import { Card, newCardId } from "@/domain/entity/card";
import adminDb from "@/lib/firebase/admin";
import z from "zod";
import { chunk } from "lodash";

const collectionPath = "cards";

const cardDecodeSchema = z.object({
  name: z.string(),
  cmc: z.number(),
  type: z.string(),
  set: z.string(),
  collectorNumber: z.string(),
  originalImageUrl: z.string().optional(),
  originalImageBackUrl: z.string().optional(),
});

export const fetchCards = async (query: { names?: string[] } = {}): Promise<Card[]> => {
  try {
    const db = adminDb();
    const cardsRef = db.collection(collectionPath);

    if (!query.names || query.names.length === 0) {
      const snapshot = await cardsRef.get();
      const result = z.array(cardDecodeSchema).safeParse(snapshot.docs.map((doc) => doc.data()));
      if (!result.success) {
        throw new Error(
          `Error parsing cards ${result.error.issues.map((issue) => issue.message).join(", ")}`,
        );
      }
      return result.data;
    }

    const batches = chunk(query.names, 30);

    const batchPromises = batches.map(async (nameBatch) => {
      const snapshot = await cardsRef.where("name", "in", nameBatch).get();
      const result = z.array(cardDecodeSchema).safeParse(snapshot.docs.map((doc) => doc.data()));
      if (!result.success) {
        throw new Error(
          `Error parsing cards ${result.error.issues.map((issue) => issue.message).join(", ")}`,
        );
      }
      return result.data;
    });

    const batchResults = await Promise.all(batchPromises);

    const allCards = batchResults.flat();

    console.log(`Successfully fetched ${allCards.length} cards`);
    return allCards;
  } catch (error) {
    console.error("Error fetching cards:", error);
    throw error;
  }
};

export const fetchCard = async (id: string): Promise<Card> => {
  const doc = await adminDb().collection(collectionPath).doc(id).get();
  if (!doc.exists) {
    throw new Error(`Not Found`);
  }
  const result = cardDecodeSchema.safeParse(doc.data());
  if (!result.success) {
    throw new Error(
      `Error parsing card ${result.error.issues.map((issue) => issue.message).join(", ")}`,
    );
  }
  return result.data;
};

export const createCards = async (cards: Card[]): Promise<void> => {
  try {
    const db = adminDb();
    const batch = db.batch();

    // Add each card to the batch operation
    cards.forEach((card) => {
      const docRef = db.collection(collectionPath).doc(newCardId(card.name));
      batch.set(docRef, card, { merge: true });
    });

    // Commit all operations at once
    await batch.commit();

    console.log(`Successfully created ${cards.length} cards`);
  } catch (error) {
    console.error("Error creating cards:", error);
    throw error;
  }
};
