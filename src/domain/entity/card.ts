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
