import { NextResponse } from "next/server";
import { z } from "zod";
import { usuarioAtual, gerarHash } from "@/lib/auth";
import { avaliarSenha } from "@/lib/senha";
import { pool } from "@/lib/db";
import { problema } from "@/lib/http";
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await usuarioAtual(); if (u?.papel !== "administrador") return problema(403, "Acesso restrito ao administrador");
  const { id } = await ctx.params;
  const c = z.object({ ativo: z.boolean().optional(), senha: z.string().max(128).optional() }).safeParse(await req.json().catch(() => null));
  if (!c.success || !z.string().uuid().safeParse(id).success) return problema(422, "Dados inválidos");
  if (c.data.senha !== undefined) {
    if (!avaliarSenha(c.data.senha, c.data.senha).valida) return problema(422, "A senha não atende às regras.");
    await pool.query("update usuarios set senha_hash=$2, falhas_login=0, bloqueado_ate=null where id=$1", [id, await gerarHash(c.data.senha)]);
    await pool.query("delete from sessoes where usuario_id=$1", [id]);
  }
  if (c.data.ativo !== undefined) {
    if (id === u.id && !c.data.ativo) return problema(409, "Você não pode desativar a própria conta");
    await pool.query("update usuarios set ativo=$2 where id=$1", [id, c.data.ativo]);
    if (!c.data.ativo) await pool.query("delete from sessoes where usuario_id=$1", [id]);
  }
  return NextResponse.json({ ok: true });
}
