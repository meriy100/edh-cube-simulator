"use server";

import { updateCard } from "@/repository/cards";
import { revalidatePath } from "next/cache";

export const updateCardAction: typeof updateCard = async (id, card) => {
  await updateCard(id, card);

  revalidatePath(`/admin/cards/${id}`);
};
