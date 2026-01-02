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
  published: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const timestampDecodeSchema = z.preprocess((arg) => {
  if (arg instanceof Timestamp) {
    return arg.toDate();
  }
  return arg;
}, z.date());

const poolDecodeSchema = z.object({
  id: z.string().transform(PoolId),
  version: z.string(),
  count: z.number(),
  status: z.enum(["processing", "ready", "error"]).default("ready"),
  errorMessage: z.string().optional(),
  published: z.boolean(),
  createdAt: timestampDecodeSchema,
  updatedAt: timestampDecodeSchema,
});

interface FirestorePoolStatusUpdateData {
  status: PoolStatus;
  updatedAt: Timestamp;
  errorMessage?: string;
}

export const fetchPools = async (query: { published?: boolean } = {}): Promise<Pool[]> => {
  const poolsRef = adminDb().collection(collectionPath);

  if (query.published !== undefined) {
    const snapshot = await poolsRef.where("published", "==", query.published).get();

    return z.array(poolDecodeSchema).parse(snapshot.docs.map((doc) => doc.data()));
  }

  const snapshot = await poolsRef.orderBy("id", "desc").limit(10).get();

  return z.array(poolDecodeSchema).parse(snapshot.docs.map((doc) => doc.data()));
};

export const createPool = async (pool: Pool): Promise<void> => {
  try {
    const poolData: FirestorePoolData = {
      id: pool.id,
      version: pool.version,
      count: pool.count,
      status: pool.status,
      published: pool.published,
      createdAt: Timestamp.fromDate(pool.createdAt),
      updatedAt: Timestamp.fromDate(pool.updatedAt),
    };

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
    const updateData: Partial<FirestorePoolStatusUpdateData> = {
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

    return poolDecodeSchema.parse(doc.data());
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
