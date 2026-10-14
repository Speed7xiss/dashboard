import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ key: z.string().trim().min(8).max(100), hwid: z.string().trim().max(200).optional() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ valid: false, error: "Chave inválida." }, { status: 400 });
  const license = await prisma.license.findUnique({ where: { key: parsed.data.key.toUpperCase() }, include: { product: { select: { name: true } } } });
  if (!license || license.status !== "ACTIVE") return NextResponse.json({ valid: false, error: "Licença inválida ou revogada." }, { status: 404 });
  if (license.expiresAt && license.expiresAt.getTime() <= Date.now()) return NextResponse.json({ valid: false, error: "Licença expirada." }, { status: 403 });
  if (license.hwidRequired) {
    const hwid = parsed.data.hwid;
    if (!hwid) return NextResponse.json({ valid: false, error: "Este produto exige um HWID." }, { status: 400 });
    if (license.hwid && license.hwid !== hwid) return NextResponse.json({ valid: false, error: "Esta licença já está vinculada a outro HWID." }, { status: 403 });
    if (!license.hwid) await prisma.license.updateMany({ where: { id: license.id, hwid: null, status: "ACTIVE" }, data: { hwid } });
    const current = await prisma.license.findUnique({ where: { id: license.id }, select: { hwid: true } });
    if (current?.hwid !== hwid) return NextResponse.json({ valid: false, error: "Não foi possível vincular o HWID." }, { status: 409 });
  }
  return NextResponse.json({ valid: true, product: license.product.name, duration: license.duration, expiresAt: license.expiresAt });
}
