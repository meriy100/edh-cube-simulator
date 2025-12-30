import adminDb from "@/lib/firebase/admin";
import z from "zod";
import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;
import { Pool, PoolId } from "@/domain/entity/pool";

const collectionPath = "pools";

const timestampDecodeSchema = z.preprocess((arg) => {
  if (arg instanceof Timestamp) {
    return arg.toDate();
  }
  return arg;
}, z.date());

export const fetchPools = async (): Promise<Pool[]> => {
  const snapshot = await adminDb().collection(collectionPath).limit(10).get();
  const decodeSchema = z.array(
    z.object({
      id: z.string().transform(PoolId),
      version: z.string(),
      count: z.number(),
      createdAt: timestampDecodeSchema,
      updatedAt: timestampDecodeSchema,
    }),
  );

  return decodeSchema.parse(snapshot.docs.map((doc) => doc.data()));
};

export const createPool = async (pool: Pool): Promise<void> => {
  try {
    // Convert Pool dates to Firestore Timestamps
    const poolData = {
      id: pool.id,
      version: pool.version,
      count: pool.count,
      createdAt: Timestamp.fromDate(pool.createdAt),
      updatedAt: Timestamp.fromDate(pool.updatedAt),
    };

    // Save to Firestore
    await adminDb().collection(collectionPath).doc(pool.id).set(poolData);
  } catch (error) {
    console.error("Error creating pool:", error);
    throw error;
  }
};
