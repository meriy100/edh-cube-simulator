import z from "zod";
import { colorSchema } from "@/domain/entity/card";

export const cardSearchParamsSchema = z.object({
  c: z
    .preprocess((v) => (typeof v !== "string" ? undefined : v.split("")), z.array(colorSchema))
    .optional(),
});
