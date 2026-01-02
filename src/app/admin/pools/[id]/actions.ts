"use server";

import { Pool, PoolId } from "@/domain/entity/pool";
import { fetchPools, updatePool } from "@/repository/pools";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

export const updatePoolAction = async (id: PoolId, args: Partial<Pool>) => {
  await updatePool(id, args);
  revalidatePath("/admin/pools");
  revalidatePath(`/admin/pools/${id}`);
};

export const publishPoolAction = async (id: PoolId) => {
  const prev = await fetchPools({ published: true });
  for (const p of prev) {
    await updatePool(p.id, { published: false });
  }
  await updatePool(id, { published: true });

  revalidateTag("published-pool");
  redirect(`/admin/pools/${id}`);
};

export const revalidatePublishedPoolAction = async (id: PoolId) => {
  revalidateTag("published-pool");
  redirect(`/admin/pools/${id}`);
};
