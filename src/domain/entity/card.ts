type Color = "w" | "u" | "b" | "r" | "g";

export interface Card {
  name: string;
  cmc: number;
  type: string;
  set: string;
  colorIdentity: Color[];
  imageUrl: string;
  imageBackUrl?: string;
  tags: string[];
}
