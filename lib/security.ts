import { createHash, randomBytes } from "crypto";
import { hash, compare } from "bcryptjs";

export const hashPassword = (password: string) => hash(password, 12);
export const verifyPassword = (password: string, passwordHash: string) => compare(password, passwordHash);
export const createToken = () => randomBytes(32).toString("base64url");
export const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");
export const hashIp = (value: string) => createHash("sha256").update(`${process.env.AUTH_SECRET}:${value}`).digest("hex");

export function safeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (process.env.NODE_ENV !== "production" && url.protocol === "http:");
  } catch { return false; }
}
