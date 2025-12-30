import { NextRequest, NextResponse } from "next/server";
import adminDb from "@/lib/firebase/admin";
import z from "zod";
import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;

const timestampDecodeSchema = z.preprocess((arg) => {
  if (arg instanceof Timestamp) {
    return arg.toDate();
  }
  return arg;
}, z.date());

async function getPools() {
  const snapshot = await adminDb().collection("pools").limit(5).get();
  const decodeSchema = z.array(
    z.object({
      createdAt: timestampDecodeSchema,
    }),
  );

  return decodeSchema.safeParse(snapshot.docs.map((doc) => doc.data()));
}
export async function GET(req: NextRequest) {
  const result = await getPools();

  if (result.success) {
    return NextResponse.json({ pools: result.data });
  }
  return NextResponse.json({ error: result.error.message }, { status: 500 });
}
