import { NextResponse } from "next/server";
import { z } from "zod";
import { redefinirSenha } from "@/lib/auth";
import { problema } from "@/lib/http";
export async function POST(req: Request) {
  const c = z.object({ token: z.string().min(20).max(100), senha: z.string().max(128), confirmacao: z.string().max(128) }).safeParse(await req.json().catch(() => null));
  if (!c.success) return problema(422, "Dados inválidos");
  const r = await redefinirSenha(c.data.token, c.data.senha, c.data.confirmacao);
  if (r === "senha_fraca") return problema(422, "A senha não atende às regras.");
  if (r === "link_invalido") return problema(410, "Link inválido ou expirado.", "Peça um novo link em \"Esqueci a senha\".");
  return NextResponse.json({ ok: true });
}
