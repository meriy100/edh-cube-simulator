import z from "zod";
import { PoolId } from "@/domain/entity/pool";
import adminDb from "@/lib/firebase/admin";
import { fetchCombos } from "@/repository/combos";
import { PoolXCombo } from "@/domain/entity/poolXCombo";

const poolXComboSchema = z.object({
  id: z.string(),
  cardNames: z.array(z.string()),
});

export const fetchPoolXCombos = async (poolId: PoolId): Promise<PoolXCombo[]> => {
  const snapshot = await adminDb().collection("pools").doc(poolId).collection("poolXCombos").get();
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
