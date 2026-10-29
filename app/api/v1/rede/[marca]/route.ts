import { NextResponse } from "next/server";
import { z } from "zod";
import { usuarioAtual } from "@/lib/auth";
import { pool } from "@/lib/db";
import { problema } from "@/lib/http";
const texto = (max: number) => z.string().trim().min(1).max(max);
export const CorpoRede = z.object({
  destaque: z.string().trim().max(80).nullable().transform((v) => (v ? v : null)),
  lojas: texto(12), estados: texto(12), laudos_mes: texto(16),
  frase_full: texto(140), frase_home_based: texto(140),
});
/** Atualiza "Sobre a rede" de uma marca (só administrador). Vale para os próximos PDFs. */
export async function PUT(req: Request, ctx: { params: Promise<{ marca: string }> }) {
  const u = await usuarioAtual(); if (!u) return problema(401, "Sessão ausente ou expirada"); if (u.papel !== "administrador") return problema(403, "Acesso restrito ao administrador");
  const { marca } = await ctx.params;
  if (marca !== "auto-visao" && marca !== "royal") return problema(404, "Marca não encontrada");
  const c = CorpoRede.safeParse(await req.json().catch(() => null));
  if (!c.success) return problema(422, "Dados inválidos", c.error.issues.map((i) => i.path.join(".")).join(", "));
  const d = c.data;
  await pool.query("update config_marca set destaque=$2,lojas=$3,estados=$4,laudos_mes=$5,frase_full=$6,frase_home_based=$7,atualizado_em=now() where marca=$1",
    [marca, d.destaque, d.lojas, d.estados, d.laudos_mes, d.frase_full, d.frase_home_based]);
  return NextResponse.json({ ok: true });
}
