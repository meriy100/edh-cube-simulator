import { v5 as uuidv5 } from "uuid";

const NAMESPACE_MTG = "44869818-5a23-4709-906d-669528d229f3";

type Color = "w" | "u" | "b" | "r" | "g";

export interface Card {
  name: string;
  cmc: number;
  type: string;
  set: string;
  collectorNumber: string;
  colorIdentity?: Color[];
  originalImageUrl?: string;
  originalImageBackUrl?: string;
}

export const newCardId = (name: string) => {
  const normalizedName = name.trim().toLowerCase();
  return uuidv5(normalizedName, NAMESPACE_MTG);
};
