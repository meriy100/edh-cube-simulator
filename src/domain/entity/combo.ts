import { Card, Color } from "@/domain/entity/card";

export interface Combo {
  id: string;
  cardNames: string[];
  uses: {
    card: {
      id: number;
      name: string;
      relation: Card;
    };
    quantity: number;
    zoneLocations: string[];
  }[];
  manaNeeded: string;
  identity: Color[];
  produces: { feature: { id: number; name: string } }[];
  easyPrerequisites: string;
  notablePrerequisites: string;
  description: string;
  popularity: number;
}
