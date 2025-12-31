import { Card } from "@/domain/entity/card";

export interface PoolXCard {
  name: string;
  commander: boolean;
  tags: string[];
  card: Card;
}
