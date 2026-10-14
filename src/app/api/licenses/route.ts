import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  productId: z.string().min(1),
  duration: z.enum(["DAILY", "WEEKLY", "MONTHLY", "LIFETIME"]),
  hwidRequired: z.boolean().default(false),
  quantity: z.number().int().min(1).max(50).default(1)
});

export async function GET() {
  const user = await getSession();
  if (!user || user.status !== "ACTIVE") return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const licenses = await prisma.license.findMany({
    where: user.role === "ADMIN" ? {} : { ownerId: user.id },
    include: { product: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" }, take: 500
  });
  return NextResponse.json({ licenses });
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user || user.status !== "ACTIVE") return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Confira o produto, a duração e a quantidade (máximo 50 por vez)." }, { status: 400 });
  const product = await prisma.product.findFirst({ where: { id: parsed.data.productId, ...(user.role === "ADMIN" ? {} : { ownerId: user.id }) }, select: { id: true, name: true } });
  if (!product) return NextResponse.json({ error: "Produto não encontrado ou sem permissão." }, { status: 404 });
  const expiresAt = parsed.data.duration === "LIFETIME" ? null : new Date(Date.now() + ({ DAILY: 1, WEEKLY: 7, MONTHLY: 30 }[parsed.data.duration] * 24 * 60 * 60 * 1000));
  const created = await prisma.$transaction(Array.from({ length: parsed.data.quantity }, () => prisma.license.create({
    data: { key: `NX-${randomBytes(4).toString("hex").toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`, duration: parsed.data.duration, hwidRequired: parsed.data.hwidRequired, expiresAt, productId: product.id, ownerId: user.id },
    include: { product: { select: { id: true, name: true } } }
  })));
  await prisma.auditLog.create({ data: { userId: user.id, action: "LICENSES_CREATED", details: `${created.length} licença(s) criada(s) para ${product.name}` } });
  return NextResponse.json({ licenses: created }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getSession();
  if (!user || user.status !== "ACTIVE") return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Licença inválida." }, { status: 400 });
  const license = await prisma.license.findFirst({ where: { id: parsed.data.id, ...(user.role === "ADMIN" ? {} : { ownerId: user.id }) }, select: { id: true, key: true } });
  if (!license) return NextResponse.json({ error: "Licença não encontrada ou sem permissão." }, { status: 404 });
  await prisma.license.delete({ where: { id: license.id } });
  await prisma.auditLog.create({ data: { userId: user.id, action: "LICENSE_DELETED", details: `Licença excluída: ${license.key}` } });
  return NextResponse.json({ ok: true });
}
