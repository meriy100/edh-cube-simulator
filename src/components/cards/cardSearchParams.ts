import z from "zod";
import { colorSchema, FULL_COLORS } from "@/domain/entity/card";
import { reduce, uniq } from "lodash";

export const cardSearchParamsSchema = z.object({
  c: z
    .preprocess((v) => (typeof v !== "string" ? undefined : v.split("")), z.array(colorSchema))
    .transform((vs) => vs.filter((v) => v !== "C")),
});

const powerSet = <T>(xs: T[]): T[][] => {
  const arr = uniq(xs);
  return reduce(arr, (acc, x) => acc.concat(acc.map((subset) => subset.concat(x))), [[]] as T[][]);
};

export const colorPathList = () => {
  return ["C", ...powerSet(FULL_COLORS).map((cs) => cs.join("").toLowerCase())];
};
