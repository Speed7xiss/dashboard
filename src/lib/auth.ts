import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "development-only-secret-change-this-please-123456");
export async function createSession(user: { id: string; email: string; role: string }) {
  const token = await new SignJWT({ email: user.email, role: user.role }).setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setExpirationTime("7d").sign(secret);
  const jar = await cookies(); jar.set("session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
}
export async function getSession() {
  const token = (await cookies()).get("session")?.value;
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, secret); if (!payload.sub) return null; return await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, name: true, email: true, role: true, status: true, plan: true } }); } catch { return null; }
}
export async function requireAdmin() { const user = await getSession(); if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") return null; return user; }
