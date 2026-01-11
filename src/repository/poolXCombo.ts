import z from "zod";
import { PoolId } from "@/domain/entity/pool";
import adminDb from "@/lib/firebase/admin";
import { fetchCombos } from "@/repository/combos";
import { PoolXCombo } from "@/domain/entity/poolXCombo";

const poolXComboSchema = z.object({
  id: z.string(),
  cardNames: z.array(z.string()),
  unlisted: z.boolean().optional().default(false),
});

export const fetchPoolXCombos = async (
  poolId: PoolId,
  query: { cardName?: string } = {},
): Promise<PoolXCombo[]> => {
  const poolXCombosRef = adminDb().collection("pools").doc(poolId).collection("poolXCombos");
  let q: typeof poolXCombosRef | ReturnType<typeof poolXCombosRef.where> = poolXCombosRef;

  if (query.cardName) {
    q = q.where("cardNames", "array-contains", query.cardName);
  }

  const snapshot = await q.get();
  const poolXCombos = z.array(poolXComboSchema).parse(snapshot.docs.map((doc) => doc.data()));

  if (poolXCombos.length === 0) {
    return [];
  }

  const combos = await fetchCombos({ ids: poolXCombos.map((poolXCombo) => poolXCombo.id) });

  return poolXCombos.map((poolXCombo) => {
    const combo = combos.find((c) => poolXCombo.id === c.id);
    if (combo === undefined) {
      throw new Error(`Combo not found: ${poolXCombo.id}`);
    }

    return {
      ...poolXCombo,
      relation: combo,
    };
  });
};

export const fetchPoolXComboCount = async (id: PoolId) => {
  const snapshot = await adminDb()
    .collection("pools")
    .doc(id)
    .collection("poolXCombos")
    .count()
    .get();

  return z.object({ count: z.number() }).parse(snapshot.data()).count;
};

export const fetchPoolXCombosByPage = async (id: PoolId, limit: number, page: number) => {
  const offset = page * 50;
  const snapshot = await adminDb()
    .collection("pools")
    .doc(id)
    .collection("poolXCombos")
    .orderBy("id", "asc")
    .limit(limit)
    .offset(offset)
    .get();

  const poolXCombos = z.array(poolXComboSchema).parse(snapshot.docs.map((doc) => doc.data()));

  if (poolXCombos.length === 0) {
    return [];
  }

  const combos = await fetchCombos({ ids: poolXCombos.map((poolXCombo) => poolXCombo.id) });

  return poolXCombos.map((poolXCombo) => {
    const combo = combos.find((c) => poolXCombo.id === c.id);
    if (combo === undefined) {
      throw new Error(`Combo not found: ${poolXCombo.id}`);
    }

    return {
      ...poolXCombo,
      relation: combo,
      unlisted: poolXCombo.unlisted ?? false,
    };
  });
};
export const updatePoolXCombo = async (poolId: PoolId, poolXCombo: Partial<PoolXCombo>) => {
  if (!poolXCombo.id) {
    throw new Error("PoolXCombo ID is required");
  }
  const updates: Partial<PoolXCombo> = {
    ...poolXCombo,
  };
  delete updates.relation; // Don't save the relation object to DB

  await adminDb()
    .collection("pools")
    .doc(poolId)
    .collection("poolXCombos")
    .doc(poolXCombo.id)
    .update(updates);
};
