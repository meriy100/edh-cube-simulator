import adminDb from "@/lib/firebase/admin";
import z from "zod";
import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;
import { Pool, PoolId } from "@/domain/entity/pool";

const timestampDecodeSchema = z.preprocess((arg) => {
  if (arg instanceof Timestamp) {
    return arg.toDate();
  }
  return arg;
}, z.date());

export const fetchPools = async (): Promise<Pool[]> => {
  const snapshot = await adminDb().collection("pools").limit(10).get();
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
