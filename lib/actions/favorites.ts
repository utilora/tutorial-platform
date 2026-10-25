"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function toggleFavorite(tutorialId: string) {
  const user = await requireUser(); const key = { userId_tutorialId: { userId: user.id, tutorialId } };
  const existing = await db.favorite.findUnique({ where: key });
  if (existing) await db.favorite.delete({ where: key }); else await db.favorite.create({ data: { userId: user.id, tutorialId } });
  revalidatePath("/"); revalidatePath("/favorites"); revalidatePath(`/tutorials/${tutorialId}`);
}
