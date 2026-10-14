import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";

const bodySchema = z.object({ message: z.string().trim().min(1).max(2000) });
const help = "Posso ajudar com o painel Nexus. Para criar licenças, cadastre um produto e abra Licenças. Você pode escolher duração diária, semanal, mensal ou lifetime e ativar a exigência de HWID. Para excluir, use o botão Excluir na lista. O tema pode ser alterado em Configurações. Problemas de acesso devem ser encaminhados ao administrador.";

export async function POST(request: Request) {
  const user = await getSession();
  if (!user || user.status !== "ACTIVE") return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Digite uma pergunta de até 2.000 caracteres." }, { status: 400 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ reply: help, mode: "help-center" });
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4.1-mini", input: [
        { role: "system", content: "Você é o suporte virtual da plataforma Nexus Dashboard. Responda em português brasileiro, de forma objetiva e segura. Ajude com gerenciamento de usuários, produtos, licenças e configurações. Nunca peça senhas, tokens secretos ou chaves privadas. Não afirme que realizou ações; explique como o usuário pode realizá-las." },
        { role: "user", content: parsed.data.message }
      ], max_output_tokens: 400 })
    });
    if (!response.ok) return NextResponse.json({ reply: help, mode: "help-center" });
    const data = await response.json();
    const reply = (data.output || []).flatMap((item: { content?: { type?: string; text?: string }[] }) => item.content || []).filter((part: { type?: string }) => part.type === "output_text").map((part: { text?: string }) => part.text || "").join("\n").trim();
    return NextResponse.json({ reply: reply || help, mode: "ai" });
  } catch {
    return NextResponse.json({ reply: help, mode: "help-center" });
  }
}
