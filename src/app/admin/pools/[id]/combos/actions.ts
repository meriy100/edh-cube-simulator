"use server";

import { Combo } from "@/domain/entity/combo";
import { translateCombos } from "@/repository/combos";

export const translateCombosAction = async (combos: Combo[]) => {
  return translateCombos(combos);
};
