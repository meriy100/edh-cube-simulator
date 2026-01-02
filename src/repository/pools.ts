import adminDb from "@/lib/firebase/admin";
import z from "zod";
import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;
import { Pool, PoolId, PoolStatus } from "@/domain/entity/pool";

const collectionPath = "pools";

interface FirestorePoolData {
  id: string;
  version: string;
  count: number;
  status: PoolStatus;
  errorMessage?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface FirestorePoolUpdateData {
  status: PoolStatus;
  updatedAt: Timestamp;
  errorMessage?: string;
}

const timestampDecodeSchema = z.preprocess((arg) => {
  if (arg instanceof Timestamp) {
    return arg.toDate();
  }
  return arg;
}, z.date());

export const fetchPools = async (): Promise<Pool[]> => {
  const snapshot = await adminDb().collection(collectionPath).get();
  const decodeSchema = z.array(
    z.object({
      id: z.string().transform(PoolId),
      version: z.string(),
      count: z.number(),
      status: z.enum(["processing", "ready", "error"]).default("ready"),
      errorMessage: z.string().optional(),
      createdAt: timestampDecodeSchema,
      updatedAt: timestampDecodeSchema,
    }),
  );

  return decodeSchema.parse(snapshot.docs.map((doc) => doc.data()));
};

export const createPool = async (pool: Pool): Promise<void> => {
  try {
    const poolData: FirestorePoolData = {
      id: pool.id,
      version: pool.version,
      count: pool.count,
      status: pool.status,
      createdAt: Timestamp.fromDate(pool.createdAt),
      updatedAt: Timestamp.fromDate(pool.updatedAt),
    };

    if (pool.errorMessage !== undefined) {
      poolData.errorMessage = pool.errorMessage;
    }

    await adminDb().collection(collectionPath).doc(pool.id).set(poolData);
  } catch (error) {
    console.error("Error creating pool:", error);
    throw error;
  }
};

export const updatePoolStatus = async (
  poolId: PoolId,
  status: PoolStatus,
  errorMessage?: string,
): Promise<void> => {
  try {
    const updateData: Partial<FirestorePoolUpdateData> = {
      status,
      updatedAt: Timestamp.now(),
    };

    if (errorMessage !== undefined) {
      updateData.errorMessage = errorMessage;
    }

    await adminDb().collection(collectionPath).doc(poolId).update(updateData);
  } catch (error) {
    console.error("Error updating pool status:", error);
    throw error;
  }
};

export const fetchPool = async (poolId: PoolId): Promise<Pool | null> => {
  try {
    const doc = await adminDb().collection(collectionPath).doc(poolId).get();

    if (!doc.exists) {
      return null;
    }

    const singlePoolSchema = z.object({
      id: z.string().transform(PoolId),
      version: z.string(),
      count: z.number(),
      status: z.enum(["processing", "ready", "error"]).default("ready"),
      errorMessage: z.string().optional(),
      createdAt: timestampDecodeSchema,
      updatedAt: timestampDecodeSchema,
    });

    return singlePoolSchema.parse(doc.data());
  } catch (error) {
    console.error("Error fetching pool:", error);
    throw error;
  }
};

export const updatePool = async (id: PoolId, pool: Partial<Pool>): Promise<void> => {
  await adminDb().collection(collectionPath).doc(id).update(pool);
};

export const deletePool = async (poolId: PoolId): Promise<void> => {
  await adminDb().collection(collectionPath).doc(poolId).delete();
};
