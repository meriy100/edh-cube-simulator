export interface PoolXCard {
  name: string;
  cmc: number;
  type: string;
  imageUrl: string;
  imageBackUrl?: string;

  commander: boolean;
  tags: string[];
}
