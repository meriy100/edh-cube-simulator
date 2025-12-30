import { ulid } from "ulid";

declare const poolIdCommonality: unique symbol;
export type PoolId = string & { [poolIdCommonality]: never };

export const PoolId = (id: string): PoolId => id as PoolId;

export interface Pool {
  id: PoolId;
  version: string;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

export const newPool = ({ count }: { count: number }): Pool => ({
  id: PoolId(ulid()),
  version: "unknown",
  count,
  createdAt: new Date(),
  updatedAt: new Date(),
});
