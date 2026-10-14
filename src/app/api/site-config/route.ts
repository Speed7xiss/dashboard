import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSession();
  if (!user || user.status !== "ACTIVE") return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const config = await prisma.siteConfig.upsert({ where: { id: "main" }, update: {}, create: { id: "main", siteName: "NEXUS PLATFORM", announcement: "", supportEmail: "" } });
  return NextResponse.json({ config });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const parsed = z.object({
    siteName: z.string().trim().min(2).max(80),
    announcement: z.string().trim().max(500),
    supportEmail: z.string().trim().max(254).refine(v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "E-mail inválido")
  }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Confira os campos. O nome deve ter 2 a 80 caracteres." }, { status: 400 });
  const config = await prisma.siteConfig.upsert({ where: { id: "main" }, update: parsed.data, create: { id: "main", ...parsed.data } });
  await prisma.auditLog.create({ data: { userId: admin.id, action: "SITE_CONFIG_UPDATED", details: "Configurações públicas atualizadas" } });
  return NextResponse.json({ config });
}
