import { NextResponse } from "next/server";
import { z } from "zod";
import { pedirRedefinicao } from "@/lib/auth";
import { problema } from "@/lib/http";
export async function POST(req: Request) {
  const c = z.object({ email: z.string().min(3).max(254) }).safeParse(await req.json().catch(() => null));
  if (!c.success) return problema(422, "Dados inválidos");
  await pedirRedefinicao(c.data.email).catch((e) => console.error(JSON.stringify({ evento: "erro_pedido_redefinicao", msg: String(e?.message) })));
  // Resposta sempre igual: não revela se o e-mail existe.
  return NextResponse.json({ mensagem: "Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha." }, { status: 202 });
}
