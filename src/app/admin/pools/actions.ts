"use server";
import NextAuth from "next-auth";
import { nextPoolVersion, PoolId } from "@/domain/entity/pool";
import { deletePool, fetchPools } from "@/repository/pools";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { config } from "@/lib/auth";
import { fetchCubeCobraCube } from "@/lib/cubecobra";
import { importPool } from "@/lib/poolImport";

const { auth } = NextAuth(config);

export const deletePoolAction = async (id: PoolId) => {
  await deletePool(id);
  revalidatePath("/admin/pools");
};

/** Fetches the cube from CubeCobra and creates a new pool version from it. */
export const syncCubeCobraAction = async (): Promise<{ error: string }> => {
  const session = await auth();
  if (!session?.user) {
    return { error: "ログインが必要です" };
  }

  let poolId: PoolId;
  try {
    const [cube, pools] = await Promise.all([fetchCubeCobraCube(), fetchPools()]);
    if (cube.rows.length === 0) {
      return { error: "CubeCobra の mainboard にカードがありません" };
    }
    poolId = await importPool(cube.rows, nextPoolVersion(pools[0]?.version));
  } catch (error) {
    console.error("Error syncing from CubeCobra:", error);
    return {
      error: `CubeCobra からの同期に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }

  revalidatePath("/admin/pools");
  redirect(`/admin/pools/${poolId}`);
};
