"use server";

import { Pool, PoolId } from "@/domain/entity/pool";
import { updatePool } from "@/repository/pools";
import { revalidatePath } from "next/cache";

export const updatePoolAction = async (id: PoolId, args: Partial<Pool>) => {
  await updatePool(id, args);
  revalidatePath("/admin/pools");
  revalidatePath(`/admin/pools/${id}`);
};
