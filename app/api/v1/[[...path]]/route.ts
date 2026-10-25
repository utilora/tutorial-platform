import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";
import { createToken, hashPassword, hashToken, verifyPassword } from "@/lib/security";
import { emailSchema, passwordSchema, taxonomySchema, tutorialSchema } from "@/lib/validation";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "https://utilora.github.io";
const secret = () => {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET 必须至少 32 个字符");
  return new TextEncoder().encode(value);
};
const cors = {
  "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Vary": "Origin",
};
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: cors });
const error = (message: string, status = 400) => json({ error: message }, status);
const body = async (req: NextRequest) => {
  try { return await req.json() as Record<string, unknown>; } catch { return {}; }
};
async function currentUser(req: NextRequest) {
  const value = req.headers.get("authorization");
  if (!value?.startsWith("Bearer ")) return null;
  try {
    const { payload } = await jwtVerify(value.slice(7), secret());
    if (typeof payload.userId !== "string") return null;
    return db.user.findUnique({ where: { id: payload.userId }, select: { id: true, email: true, name: true, role: true } });
  } catch { return null; }
}
async function requireUser(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) throw new Response("unauthorized", { status: 401 });
  return user;
}
async function requireAdmin(req: NextRequest) {
  const user = await requireUser(req);
  if (user.role !== "ADMIN") throw new Response("forbidden", { status: 403 });
  return user;
}
async function token(userId: string) {
  return new SignJWT({ userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("12h").sign(secret());
}
const tutorialSelect = {
  id: true, slug: true, title: true, summary: true, coverUrl: true, type: true,
  externalUrl: true, articleContent: true, isPromoted: true, promotionDisclosure: true,
  notice: true, status: true, featured: true, sortOrder: true, publishedAt: true,
  categoryId: true, category: { select: { id: true, name: true, slug: true } },
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
  _count: { select: { favorites: true, clicks: true } },
} as const;
function routeParts(params: { path?: string[] }) { return params.path || []; }
function handleThrown(e: unknown) {
  if (e instanceof Response) return error(e.status === 401 ? "请先登录" : "没有权限", e.status);
  console.error(e);
  return error("服务器处理失败", 500);
}
export function OPTIONS() { return new NextResponse(null, { status: 204, headers: cors }); }

export async function GET(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  try {
    const p = routeParts(await ctx.params);
    if (p[0] === "health") return json({ ok: true });
    if (p[0] === "catalog") {
      const url = new URL(req.url);
      const q = (url.searchParams.get("q") || "").trim();
      const category = url.searchParams.get("category") || "";
      const tag = url.searchParams.get("tag") || "";
      const [tutorials, categories, tags] = await Promise.all([
        db.tutorial.findMany({
          where: {
            status: "PUBLISHED",
            ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { summary: { contains: q, mode: "insensitive" } }] } : {}),
            ...(category ? { category: { slug: category } } : {}),
            ...(tag ? { tags: { some: { tag: { slug: tag } } } } : {}),
          },
          select: tutorialSelect,
          orderBy: [{ featured: "desc" }, { sortOrder: "desc" }, { publishedAt: "desc" }],
        }),
        db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
        db.tag.findMany({ orderBy: { name: "asc" } }),
      ]);
      return json({ tutorials, categories, tags });
    }
    if (p[0] === "tutorials" && p[1]) {
      const tutorial = await db.tutorial.findFirst({ where: { slug: p[1], status: "PUBLISHED" }, select: tutorialSelect });
      return tutorial ? json(tutorial) : error("教程不存在", 404);
    }
    if (p[0] === "me") {
      const user = await requireUser(req);
      return json({ user });
    }
    if (p[0] === "favorites") {
      const user = await requireUser(req);
      const favorites = await db.favorite.findMany({ where: { userId: user.id }, select: { createdAt: true, tutorial: { select: tutorialSelect } }, orderBy: { createdAt: "desc" } });
      return json({ favorites });
    }
    if (p[0] === "admin" && p[1] === "dashboard") {
      await requireAdmin(req);
      const [users, tutorials, clicks, favorites] = await Promise.all([db.user.count(), db.tutorial.count(), db.tutorialClick.count(), db.favorite.count()]);
      return json({ users, tutorials, clicks, favorites });
    }
    if (p[0] === "admin" && p[1] === "tutorials") {
      await requireAdmin(req);
      const tutorials = await db.tutorial.findMany({ select: tutorialSelect, orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }] });
      const [categories, tags] = await Promise.all([db.category.findMany({ orderBy: { sortOrder: "asc" } }), db.tag.findMany({ orderBy: { name: "asc" } })]);
      return json({ tutorials, categories, tags });
    }
    if (p[0] === "admin" && p[1] === "taxonomies") {
      await requireAdmin(req);
      const [categories, tags] = await Promise.all([db.category.findMany({ orderBy: { sortOrder: "asc" } }), db.tag.findMany({ orderBy: { name: "asc" } })]);
      return json({ categories, tags });
    }
    return error("接口不存在", 404);
  } catch (e) { return handleThrown(e); }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  try {
    const p = routeParts(await ctx.params);
    const data = await body(req);
    if (p[0] === "auth" && p[1] === "register") {
      const email = emailSchema.safeParse(data.email);
      const password = passwordSchema.safeParse(data.password);
      if (!email.success || !password.success) return error(email.error?.issues[0]?.message || password.error?.issues[0]?.message || "输入无效");
      if (await db.user.findUnique({ where: { email: email.data } })) return error("该邮箱已注册", 409);
      const user = await db.user.create({ data: { email: email.data, name: String(data.name || "").trim().slice(0, 50) || null, passwordHash: await hashPassword(password.data) }, select: { id: true, email: true, name: true, role: true } });
      return json({ token: await token(user.id), user }, 201);
    }
    if (p[0] === "auth" && p[1] === "login") {
      const email = emailSchema.safeParse(data.email);
      if (!email.success) return error("邮箱或密码不正确", 401);
      const user = await db.user.findUnique({ where: { email: email.data } });
      if (!user || !(await verifyPassword(String(data.password || ""), user.passwordHash))) return error("邮箱或密码不正确", 401);
      return json({ token: await token(user.id), user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }
    if (p[0] === "auth" && p[1] === "forgot-password") {
      const email = emailSchema.safeParse(data.email);
      if (email.success) {
        const user = await db.user.findUnique({ where: { email: email.data } });
        if (user) {
          const raw = createToken();
          await db.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
          console.info("Password reset requested; configure email delivery before production use.");
        }
      }
      return json({ ok: true });
    }
    if (p[0] === "auth" && p[1] === "reset-password") {
      const password = passwordSchema.safeParse(data.password);
      if (!password.success) return error(password.error.issues[0].message);
      const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(String(data.token || "")) } });
      if (!record || record.usedAt || record.expiresAt < new Date()) return error("重置链接无效或已过期");
      await db.$transaction([
        db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(password.data) } }),
        db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      ]);
      return json({ ok: true });
    }
    if (p[0] === "favorites" && p[1]) {
      const user = await requireUser(req);
      const key = { userId_tutorialId: { userId: user.id, tutorialId: p[1] } };
      const existing = await db.favorite.findUnique({ where: key });
      if (existing) await db.favorite.delete({ where: key });
      else await db.favorite.create({ data: { userId: user.id, tutorialId: p[1] } });
      return json({ favorite: !existing });
    }
    if (p[0] === "clicks" && p[1]) {
      const user = await currentUser(req);
      await db.tutorialClick.create({ data: { tutorialId: p[1], userId: user?.id || null } });
      return json({ ok: true }, 201);
    }
    if (p[0] === "admin" && p[1] === "tutorials") {
      await requireAdmin(req);
      const parsed = tutorialSchema.safeParse(data);
      if (!parsed.success) return error(parsed.error.issues[0].message);
      const { tagIds, ...input } = parsed.data;
      const tutorial = await db.tutorial.create({ data: { ...input, publishedAt: input.status === "PUBLISHED" ? new Date() : null, tags: { create: tagIds.map(tagId => ({ tagId })) } }, select: tutorialSelect });
      return json(tutorial, 201);
    }
    if (p[0] === "admin" && p[1] === "categories") {
      await requireAdmin(req);
      const parsed = taxonomySchema.safeParse(data);
      if (!parsed.success) return error(parsed.error.issues[0].message);
      return json(await db.category.create({ data: parsed.data }), 201);
    }
    if (p[0] === "admin" && p[1] === "tags") {
      await requireAdmin(req);
      const parsed = taxonomySchema.pick({ name: true, slug: true }).safeParse(data);
      if (!parsed.success) return error(parsed.error.issues[0].message);
      return json(await db.tag.create({ data: parsed.data }), 201);
    }
    return error("接口不存在", 404);
  } catch (e) { return handleThrown(e); }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  try {
    const p = routeParts(await ctx.params);
    const data = await body(req);
    if (p[0] === "me") {
      const user = await requireUser(req);
      const name = String(data.name || "").trim().slice(0, 50) || null;
      return json({ user: await db.user.update({ where: { id: user.id }, data: { name }, select: { id: true, email: true, name: true, role: true } }) });
    }
    if (p[0] === "admin" && p[1] === "tutorials" && p[2]) {
      await requireAdmin(req);
      const parsed = tutorialSchema.safeParse(data);
      if (!parsed.success) return error(parsed.error.issues[0].message);
      const { tagIds, ...input } = parsed.data;
      const tutorial = await db.tutorial.update({ where: { id: p[2] }, data: { ...input, publishedAt: input.status === "PUBLISHED" ? new Date() : null, tags: { deleteMany: {}, create: tagIds.map(tagId => ({ tagId })) } }, select: tutorialSelect });
      return json(tutorial);
    }
    return error("接口不存在", 404);
  } catch (e) { return handleThrown(e); }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  try {
    const p = routeParts(await ctx.params);
    await requireAdmin(req);
    if (p[0] === "admin" && p[1] === "tutorials" && p[2]) await db.tutorial.delete({ where: { id: p[2] } });
    else if (p[0] === "admin" && p[1] === "categories" && p[2]) await db.category.delete({ where: { id: p[2] } });
    else if (p[0] === "admin" && p[1] === "tags" && p[2]) await db.tag.delete({ where: { id: p[2] } });
    else return error("接口不存在", 404);
    return json({ ok: true });
  } catch (e) { return handleThrown(e); }
}
