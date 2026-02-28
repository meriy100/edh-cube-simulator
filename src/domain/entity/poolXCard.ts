import { Card } from "@/domain/entity/card";

export interface PoolXCard {
  name: string;
  commander: boolean;
  outside: boolean;
  tags: string[];
  card: Card;
}
