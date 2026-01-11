"use server";

import { Combo } from "@/domain/entity/combo";
import { translateCombos } from "@/repository/combos";
import { updatePoolXCombo } from "@/repository/poolXCombo";
import { PoolId } from "@/domain/entity/pool";
import { revalidatePath } from "next/cache";

export const translateCombosAction = async (combos: Combo[]) => {
  return translateCombos(combos);
};

export const toggleUnlistedAction = async (
  poolId: string,
  poolXComboId: string,
  currentUnlisted: boolean,
) => {
  await updatePoolXCombo(PoolId(poolId), {
    id: poolXComboId,
    unlisted: !currentUnlisted,
  });

  revalidatePath(`/admin/pools/${poolId}/combos`);
};
