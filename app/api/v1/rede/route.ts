import { NextResponse } from "next/server";
import { usuarioAtual } from "@/lib/auth";
import { pool } from "@/lib/db";
import { problema } from "@/lib/http";
export async function GET() {
  if (!(await usuarioAtual())) return problema(401, "Não autenticado");
  const { rows } = await pool.query("select marca,destaque,lojas,estados,laudos_mes,frase_full,frase_home_based from config_marca");
  return NextResponse.json({ itens: rows });
}
