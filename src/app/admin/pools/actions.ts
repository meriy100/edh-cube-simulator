"use server";
import { PoolId } from "@/domain/entity/pool";
import { deletePool } from "@/repository/pools";
import { revalidatePath } from "next/cache";

export const deletePoolAction = async (id: PoolId) => {
  await deletePool(id);
  revalidatePath("/admin/pools");
};
