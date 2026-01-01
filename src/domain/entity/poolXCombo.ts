import { Combo } from "@/domain/entity/combo";

export interface PoolXCombo {
  id: string;
  cardNames: string[];
  relation: Combo;
}
