import { NextRequest, NextResponse } from "next/server";
import adminDb from "@/lib/firebase/admin";

// 使用例
async function getPools() {
  const snapshot = await adminDb().collection("pools").limit(5).get();
  snapshot.forEach((doc) => {
    console.log(doc.id, "=>", doc.data());
  });
}
export async function GET(req: NextRequest) {
  console.log(await getPools());
  return NextResponse.json({});
}
