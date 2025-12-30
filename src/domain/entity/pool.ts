declare const poolIdCommonality: unique symbol;
type PoolId = string & { [poolIdCommonality]: never };

export const PoolId = (id: string): PoolId => id as PoolId;

export interface Pool {
  id: PoolId;
  version: string;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}
