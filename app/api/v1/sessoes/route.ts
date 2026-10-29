import { NextResponse } from "next/server";
import { z } from "zod";
import { entrar, criarSessao, sair, ACESSO } from "@/lib/auth";
import { problema, ipCliente } from "@/lib/http";
const Corpo = z.object({ identificador: z.string().min(1).max(254), senha: z.string().min(1).max(128) });
export async function POST(req: Request) {
  const c = Corpo.safeParse(await req.json().catch(() => null));
  if (!c.success) return problema(422, "Dados inválidos");
  const r = await entrar(c.data.identificador, c.data.senha, await ipCliente());
  if (!r.ok) return r.motivo === "bloqueado"
    ? problema(429, "Acesso bloqueado", `Acesso bloqueado temporariamente por excesso de tentativas. Tente novamente em ${ACESSO.bloqueioMin} minutos.`)
    : problema(401, "Usuário ou senha inválidos.");
  await criarSessao(r.usuarioId);
  return NextResponse.json({ ok: true }, { status: 201 });
}
export async function DELETE() { await sair(); return new NextResponse(null, { status: 204 }); }
