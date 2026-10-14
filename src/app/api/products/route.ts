import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSession();
  if (!user || user.status !== "ACTIVE") return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const products = await prisma.product.findMany({
    where: user.role === "ADMIN" ? {} : { ownerId: user.id },
    include: { owner: { select: { name: true, email: true } }, _count: { select: { licenses: true } } },
    orderBy: { createdAt: "desc" }, take: 200
  });
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user || user.status !== "ACTIVE") return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const parsed = z.object({ name: z.string().trim().min(2).max(100), description: z.string().trim().max(500).optional() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Informe um nome de produto válido (2 a 100 caracteres)." }, { status: 400 });
  const product = await prisma.product.create({ data: { ...parsed.data, ownerId: user.id } });
  await prisma.auditLog.create({ data: { userId: user.id, action: "PRODUCT_CREATED", details: `Produto criado: ${product.name}` } });
  return NextResponse.json({ product }, { status: 201 });
}
