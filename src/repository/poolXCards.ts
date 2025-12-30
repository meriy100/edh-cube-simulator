import { PoolXCard } from "@/domain/entity/poolXCard";
import { PoolId } from "@/domain/entity/pool";
import adminDb from "@/lib/firebase/admin";

export const createPoolXCards = async (poolId: PoolId, poolXCards: PoolXCard[]): Promise<void> => {
  try {
    const db = adminDb();
    const batch = db.batch();

    // Add each poolXCard to the batch operation
    poolXCards.forEach((poolXCard) => {
      // Use base64 encoded name as document ID (same as cards)
      const docId = Buffer.from(poolXCard.name).toString("base64");
      const docRef = db.collection("pools").doc(poolId).collection("poolXCards").doc(docId);
      batch.set(docRef, poolXCard, { merge: true });
    });

    // Commit all operations at once
    await batch.commit();

    console.log(`Successfully created ${poolXCards.length} poolXCards for pool ${poolId}`);
  } catch (error) {
    console.error("Error creating poolXCards:", error);
    throw error;
  }
};
