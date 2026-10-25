"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { clearSession, createSession, getCurrentUser } from "@/lib/auth";
import { createToken, hashPassword, hashToken, verifyPassword } from "@/lib/security";
import { emailSchema, passwordSchema } from "@/lib/validation";
import { ActionState, text } from "@/lib/forms";

export async function register(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = emailSchema.safeParse(text(form, "email")); const password = passwordSchema.safeParse(text(form, "password"));
  if (!parsed.success || !password.success) return { error: parsed.error?.issues[0]?.message || password.error?.issues[0]?.message };
  if (await db.user.findUnique({ where: { email: parsed.data } })) return { error: "该邮箱已注册" };
  const user = await db.user.create({ data: { email: parsed.data, name: text(form, "name").trim().slice(0, 50) || null, passwordHash: await hashPassword(password.data) } });
  await createSession(user.id); redirect("/");
}

export async function login(_: ActionState, form: FormData): Promise<ActionState> {
  const email = emailSchema.safeParse(text(form, "email"));
  if (!email.success) return { error: "邮箱或密码不正确" };
  const user = await db.user.findUnique({ where: { email: email.data } });
  if (!user || !(await verifyPassword(text(form, "password"), user.passwordHash))) return { error: "邮箱或密码不正确" };
  await createSession(user.id); const next = text(form, "next"); redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() { await clearSession(); redirect("/"); }

export async function updateProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await getCurrentUser(); if (!user) return { error: "请先登录" };
  await db.user.update({ where: { id: user.id }, data: { name: text(form, "name").trim().slice(0, 50) || null } });
  return { ok: true };
}

export async function requestPasswordReset(_: ActionState, form: FormData): Promise<ActionState> {
  const email = emailSchema.safeParse(text(form, "email")); if (!email.success) return { ok: true };
  const user = await db.user.findUnique({ where: { email: email.data } }); if (!user) return { ok: true };
  const token = createToken(); await db.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
  const resetUrl = `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;
  if (process.env.NODE_ENV !== "production") return { ok: true, resetUrl };
  console.info("Password reset requested; configure an email provider to deliver reset links."); return { ok: true };
}

export async function resetPassword(_: ActionState, form: FormData): Promise<ActionState> {
  const password = passwordSchema.safeParse(text(form, "password")); if (!password.success) return { error: password.error.issues[0].message };
  const tokenHash = hashToken(text(form, "token")); const record = await db.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return { error: "重置链接无效或已过期" };
  await db.$transaction([db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(password.data) } }), db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } })]);
  return { ok: true };
}
