import { ulid } from "ulid";

declare const poolIdCommonality: unique symbol;
export type PoolId = string & { [poolIdCommonality]: never };

export const PoolId = (id: string): PoolId => id as PoolId;

export type PoolStatus = 'processing' | 'ready' | 'error';

export interface Pool {
  id: PoolId;
  version: string;
  count: number;
  status: PoolStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const newPool = ({ count }: { count: number }): Pool => ({
  id: PoolId(ulid()),
  version: "unknown",
  count,
  status: 'processing',
  createdAt: new Date(),
  updatedAt: new Date(),
});
