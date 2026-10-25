import { z } from "zod";
import { safeHttpUrl } from "@/lib/security";

export const emailSchema = z.string().trim().toLowerCase().email("请输入有效邮箱").max(254);
export const passwordSchema = z.string().min(10, "密码至少 10 位").max(128).regex(/[A-Za-z]/, "密码需包含字母").regex(/\d/, "密码需包含数字");
export const slugSchema = z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug 只能包含小写字母、数字和连字符");
const optionalUrl = z.string().trim().max(2048).refine((v: string) => !v || safeHttpUrl(v), "只允许安全的 HTTP(S) 链接");

export const tutorialSchema = z.object({
  title: z.string().trim().min(2).max(120), slug: slugSchema, summary: z.string().trim().min(10).max(500),
  coverUrl: optionalUrl, externalUrl: optionalUrl, articleContent: z.string().trim().max(50000),
  type: z.enum(["EXTERNAL", "ARTICLE"]), categoryId: z.string().min(1), tagIds: z.array(z.string()).max(12),
  isPromoted: z.boolean(), promotionDisclosure: z.string().trim().max(300), notice: z.string().trim().max(500),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]), featured: z.boolean(), sortOrder: z.coerce.number().int().min(-9999).max(9999),
}).superRefine((v: { type: string; externalUrl: string; articleContent: string; isPromoted: boolean; promotionDisclosure: string }, ctx: z.RefinementCtx) => {
  if (v.type === "EXTERNAL" && !v.externalUrl) ctx.addIssue({ code: "custom", path: ["externalUrl"], message: "外链教程必须填写链接" });
  if (v.type === "ARTICLE" && !v.articleContent) ctx.addIssue({ code: "custom", path: ["articleContent"], message: "站内教程必须填写正文" });
  if (v.isPromoted && !v.promotionDisclosure) ctx.addIssue({ code: "custom", path: ["promotionDisclosure"], message: "推广教程必须填写推广声明" });
});

export const taxonomySchema = z.object({ name: z.string().trim().min(1).max(40), slug: slugSchema, description: z.string().trim().max(200).optional(), sortOrder: z.coerce.number().int().min(-999).max(999).default(0) });
