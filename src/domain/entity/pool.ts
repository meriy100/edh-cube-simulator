import { ulid } from "ulid";
import semver from "semver/preload";

declare const poolIdCommonality: unique symbol;
export type PoolId = string & { [poolIdCommonality]: never };

export const PoolId = (id: string): PoolId => id as PoolId;

export type PoolStatus = "processing" | "ready" | "error";

export interface Pool {
  id: PoolId;
  version: string;
  count: number;
  status: PoolStatus;
  errorMessage?: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Next version after the latest pool, e.g. "1.2.0" → "1.2.1-rc.0", "1.2.1-rc.0" → "1.2.1-rc.1". */
export const nextPoolVersion = (latestVersion: string | undefined): string =>
  semver.inc(semver.valid(latestVersion) ?? "0.0.1", "prerelease", "rc") ?? "0.0.1";

export const newPool = ({ count, version }: { count: number; version: string }): Pool => ({
  id: PoolId(ulid()),
  version,
  count,
  status: "processing",
  published: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});
