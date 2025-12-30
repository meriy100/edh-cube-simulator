import { PoolXCard } from "@/domain/entity/poolXCard";
import { PoolId } from "@/domain/entity/pool";
import adminDb from "@/lib/firebase/admin";
import z, { ZodType } from "zod";

const poolXDecodeSchema: ZodType<PoolXCard> = z.object({
  name: z.string(),
  cmc: z.number(),
  type: z.string(),
  imageUrl: z.string(),
  imageBackUrl: z.string().optional(),
  commander: z.boolean(),
  tags: z.array(z.string()),
});

export const fetchPoolXCards = async (
  poolId: PoolId,
  query: { commander?: boolean },
): Promise<PoolXCard[]> => {
  try {
    const db = adminDb();
    const collectionRef = db.collection("pools").doc(poolId).collection("poolXCards");

    // Build query with optional commander filter
    let queryRef = collectionRef as FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;
    if (query.commander !== undefined) {
      queryRef = queryRef.where("commander", "==", query.commander);
    }

    const snapshot = await queryRef.get();
    const result = z.array(poolXDecodeSchema).safeParse(snapshot.docs.map((doc) => doc.data()));
    if (!result.success) {
      throw new Error(
        `Error parsing poolXCards ${result.error.issues.map((issue) => issue.message).join(", ")}`,
      );
    }
    return result.data;
  } catch (error) {
    console.error("Error fetching poolXCards:", error);
    throw error;
  }
};

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
