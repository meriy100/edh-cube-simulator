import { PoolXCard } from "@/domain/entity/poolXCard";
import { PoolId } from "@/domain/entity/pool";
import adminDb from "@/lib/firebase/admin";
import z, { ZodType } from "zod";
import { fetchPool } from "@/repository/pools";
import { fetchCard, fetchCards } from "@/repository/cards";
import { newCardId } from "@/domain/entity/card";

const poolXDecodeSchema: ZodType<Omit<PoolXCard, "card">> = z.object({
  name: z.string(),
  commander: z.boolean(),
  tags: z.array(z.string()),
});

const attemptFetchPoolXCards = async (
  poolId: PoolId,
  query: { commander?: boolean },
): Promise<PoolXCard[]> => {
  const db = adminDb();
  const collectionRef = db.collection("pools").doc(poolId).collection("poolXCards");

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

  const cards = await fetchCards({ names: result.data.map((p) => p.name) });

  return result.data.map((p, i) => {
    const card = cards.find((c) => c.name === p.name);
    if (card === undefined) {
      throw new Error(`Card ${p.name} not found`);
    }
    return { ...p, card };
  });
};

const pollForPoolXCards = async (
  poolId: PoolId,
  query: { commander?: boolean },
  timeoutMs: number = 60000,
  intervalMs: number = 1500,
): Promise<PoolXCard[]> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const pool = await fetchPool(poolId);
    if (!pool) {
      throw new Error("Pool not found");
    }

    console.log("pool.status", pool.status, "pool.errorMessage", pool.errorMessage);
    if (pool.status === "ready") {
      return await attemptFetchPoolXCards(poolId, query);
    }

    if (pool.status === "error") {
      throw new Error(pool.errorMessage || "Pool processing failed");
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Timeout waiting for pool processing to complete");
};

export const fetchPoolXCards = async (
  poolId: PoolId,
  query: { commander?: boolean },
): Promise<PoolXCard[]> => {
  try {
    const initialCards = await attemptFetchPoolXCards(poolId, query);
    if (initialCards.length > 0) {
      return initialCards;
    }

    const pool = await fetchPool(poolId);
    if (!pool) {
      throw new Error("Pool not found");
    }

    if (pool.status === "processing") {
      return await pollForPoolXCards(poolId, query);
    }

    if (pool.status === "error") {
      throw new Error(pool.errorMessage ?? "Pool processing failed");
    }

    return [];
  } catch (error) {
    console.error("Error fetching poolXCards:", error);
    throw error;
  }
};

export const fetchPoolXCard = async (
  poolId: PoolId,
  cardName: string,
): Promise<PoolXCard | null> => {
  const snapshot = await adminDb()
    .collection("pools")
    .doc(poolId)
    .collection("poolXCards")
    .doc(cardName)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  const poolXCard = poolXDecodeSchema.parse(snapshot.data());

  const card = await fetchCard(newCardId(poolXCard.name));

  return { ...poolXCard, card };
};

export const createPoolXCards = async (
  poolId: PoolId,
  poolXCards: Omit<PoolXCard, "card">[],
): Promise<void> => {
  try {
    const db = adminDb();
    const batch = db.batch();

    poolXCards.forEach((poolXCard) => {
      const docId = newCardId(poolXCard.name);
      const docRef = db.collection("pools").doc(poolId).collection("poolXCards").doc(docId);
      batch.set(docRef, poolXCard, { merge: true });
    });

    await batch.commit();

    console.log(`Successfully created ${poolXCards.length} poolXCards for pool ${poolId}`);
  } catch (error) {
    console.error("Error creating poolXCards:", error);
    throw error;
  }
};
