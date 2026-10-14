import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
const schema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(128) });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Informe um e-mail e senha válidos." }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || user.status !== "ACTIVE" || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  await createSession(user);
  await prisma.auditLog.create({ data: { userId: user.id, action: "LOGIN", details: "Login realizado" } });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan } });
}
