import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
 const email=(process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
 const password=process.env.ADMIN_PASSWORD || "ChangeMe123!";
 if (password === "ChangeMe123!" && process.env.NODE_ENV === "production") throw new Error("Defina ADMIN_PASSWORD antes de criar o administrador em produção.");
 await prisma.user.upsert({ where: { email }, update: {}, create: { name: "Administrador", email, passwordHash: await bcrypt.hash(password, 12), role: "ADMIN", plan: "Enterprise" } });
 console.log(`Administrador inicial verificado: ${email}`);
}
main().finally(() => prisma.$disconnect());
