"use server";
import NextAuth from "next-auth";
import { nextPoolVersion, PoolId } from "@/domain/entity/pool";
import { deletePool, fetchPools } from "@/repository/pools";
import { revalidatePath } from "next/cache";
import { config } from "@/lib/auth";
import { fetchCubeCobraCube } from "@/lib/cubecobra";
import { importPool } from "@/lib/poolImport";

const { auth } = NextAuth(config);

export const deletePoolAction = async (id: PoolId) => {
  await deletePool(id);
  revalidatePath("/admin/pools");
};

/**
 * Fetches the cube from CubeCobra and creates a new pool version from it.
 *
 * Returns the pool ID instead of calling `redirect()`: a redirect would render
 * `/admin/pools/[id]` inside this same request, and that page waits for the pool
 * to become ready, which only happens in `importPool`'s `after()` once this
 * response has finished. The client navigates after the action returns.
 */
export const syncCubeCobraAction = async (): Promise<
  { poolId: PoolId; error?: undefined } | { poolId?: undefined; error: string }
> => {
  const session = await auth();
  if (!session?.user) {
    return { error: "ログインが必要です" };
  }

  try {
    const [cube, pools] = await Promise.all([fetchCubeCobraCube(), fetchPools()]);
    if (cube.rows.length === 0) {
      return { error: "CubeCobra の mainboard にカードがありません" };
    }
    const poolId = await importPool(cube.rows, nextPoolVersion(pools[0]?.version));
    revalidatePath("/admin/pools");
    return { poolId };
  } catch (error) {
    console.error("Error syncing from CubeCobra:", error);
    return {
      error: `CubeCobra からの同期に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};
