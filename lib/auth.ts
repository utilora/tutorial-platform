import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";

const COOKIE = "tutorial_session";
const secret = () => {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET 必须至少 32 个字符");
  return new TextEncoder().encode(value);
};

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 604800 });
}

export async function clearSession() { (await cookies()).delete(COOKIE); }

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.userId !== "string") return null;
    return db.user.findUnique({ where: { id: payload.userId }, select: { id: true, email: true, name: true, role: true } });
  } catch { return null; }
}

export async function requireUser() { const user = await getCurrentUser(); if (!user) redirect("/login?next=/favorites"); return user; }
export async function requireAdmin() { const user = await getCurrentUser(); if (!user) redirect("/login?next=/admin"); if (user.role !== "ADMIN") redirect("/?error=forbidden"); return user; }
