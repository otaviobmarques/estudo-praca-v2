import { NextResponse } from "next/server";
import { z } from "zod";
import { usuarioAtual, gerarHash } from "@/lib/auth";
import { avaliarSenha } from "@/lib/senha";
import { pool } from "@/lib/db";
import { problema } from "@/lib/http";
export async function GET() {
  const u = await usuarioAtual(); if (u?.papel !== "administrador") return problema(403, "Acesso restrito ao administrador");
  const { rows } = await pool.query("select id,nome,usuario,email,papel,ativo,criado_em from usuarios order by nome");
  return NextResponse.json({ itens: rows });
}
export async function POST(req: Request) {
  const u = await usuarioAtual(); if (u?.papel !== "administrador") return problema(403, "Acesso restrito ao administrador");
  const c = z.object({ nome: z.string().min(1).max(120), usuario: z.string().regex(/^[a-z0-9._-]{3,40}$/), email: z.string().email().max(254), senha: z.string().max(128) }).safeParse(await req.json().catch(() => null));
  if (!c.success) return problema(422, "Dados inválidos");
  if (!avaliarSenha(c.data.senha, c.data.senha).valida) return problema(422, "A senha não atende às regras.");
  try {
    const { rows } = await pool.query("insert into usuarios(nome,usuario,email,senha_hash) values($1,$2,$3,$4) returning id", [c.data.nome, c.data.usuario, c.data.email.toLowerCase(), await gerarHash(c.data.senha)]);
    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  } catch { return problema(409, "Usuário ou e-mail já cadastrado"); }
}
