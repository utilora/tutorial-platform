"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { checked, text } from "@/lib/forms";
import { taxonomySchema, tutorialSchema } from "@/lib/validation";

function tutorialInput(form: FormData) {
  return tutorialSchema.safeParse({ title: text(form,"title"), slug: text(form,"slug"), summary: text(form,"summary"), coverUrl: text(form,"coverUrl"), externalUrl: text(form,"externalUrl"), articleContent: text(form,"articleContent"), type: text(form,"type"), categoryId: text(form,"categoryId"), tagIds: form.getAll("tagIds").map(String), isPromoted: checked(form,"isPromoted"), promotionDisclosure: text(form,"promotionDisclosure"), notice: text(form,"notice"), status: text(form,"status"), featured: checked(form,"featured"), sortOrder: text(form,"sortOrder") });
}

export async function saveTutorial(form: FormData) {
  await requireAdmin(); const parsed = tutorialInput(form); if (!parsed.success) redirect(`/admin/tutorials/new?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const { tagIds, ...data } = parsed.data; const id = text(form,"id"); const publishedAt = data.status === "PUBLISHED" ? new Date() : null;
  try {
    if (id) await db.tutorial.update({ where:{id}, data:{...data, publishedAt, tags:{deleteMany:{},create:tagIds.map((tagId: string)=>({tagId}))}} });
    else await db.tutorial.create({ data:{...data, publishedAt, tags:{create:tagIds.map((tagId: string)=>({tagId}))}} });
  } catch { redirect(`/admin/tutorials/${id || "new"}?error=${encodeURIComponent("保存失败，请检查 Slug 是否重复")}`); }
  revalidatePath("/"); revalidatePath("/admin"); redirect("/admin/tutorials");
}

export async function deleteTutorial(form: FormData) { await requireAdmin(); const id=text(form,"id"); await db.tutorial.delete({where:{id}}); revalidatePath("/"); redirect("/admin/tutorials"); }
export async function setTutorialStatus(form: FormData) { await requireAdmin(); const id=text(form,"id"); const status=text(form,"status"); if(!["DRAFT","PUBLISHED","ARCHIVED"].includes(status)) return; await db.tutorial.update({where:{id},data:{status:status as "DRAFT"|"PUBLISHED"|"ARCHIVED",publishedAt:status==="PUBLISHED"?new Date():null}}); revalidatePath("/"); revalidatePath("/admin/tutorials"); }

export async function createCategory(form: FormData) { await requireAdmin(); const p=taxonomySchema.safeParse({name:text(form,"name"),slug:text(form,"slug"),description:text(form,"description"),sortOrder:text(form,"sortOrder")}); if(!p.success) return; await db.category.create({data:p.data}); revalidatePath("/admin/taxonomies"); }
export async function deleteCategory(form: FormData) { await requireAdmin(); try { await db.category.delete({where:{id:text(form,"id")}}); } catch {} revalidatePath("/admin/taxonomies"); }
export async function createTag(form: FormData) { await requireAdmin(); const p=taxonomySchema.pick({name:true,slug:true}).safeParse({name:text(form,"name"),slug:text(form,"slug")}); if(!p.success)return; await db.tag.create({data:p.data}); revalidatePath("/admin/taxonomies"); }
export async function deleteTag(form: FormData) { await requireAdmin(); await db.tag.delete({where:{id:text(form,"id")}}); revalidatePath("/admin/taxonomies"); }
