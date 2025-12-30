import { Card } from "@/domain/entity/card";
import adminDb from "@/lib/firebase/admin";

const collectionPath = "cards";

export const createCards = async (cards: Card[]): Promise<void> => {
  try {
    const db = adminDb();
    const batch = db.batch();

    // Add each card to the batch operation
    cards.forEach((card) => {
      const docRef = db.collection(collectionPath).doc(Buffer.from(card.name).toString("base64"));
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
