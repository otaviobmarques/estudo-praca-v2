import { z } from "zod";
import { usuarioAtual } from "@/lib/auth";
import { pool } from "@/lib/db";
import { problema } from "@/lib/http";
import { montarHtml, motivoBloqueio } from "@/lib/relatorio";
import { gerarCodigoEstudo, MESES_DRE } from "@/lib/calculo";
import { htmlParaPdf, htmlParaPng } from "@/lib/pdf";
export const runtime = "nodejs";
const num = z.number().finite().nonnegative();
const Corpo = z.object({
  marca: z.enum(["auto-visao", "royal"]), modelo: z.enum(["full", "home_based"]),
  cidade: z.string().min(1).max(80), uf: z.string().length(2), populacao: num, frota: num,
  cenario: z.enum(["conservador", "provavel", "otimista"]),
  percentuais: z.object({ conservador: num.max(100), provavel: num.max(100), otimista: num.max(100) }),
  percentualDetran: num.max(100), ticketDetran: num, ticketCautelar: num,
  ecvs: num.nullable(), laudosHomeBased: num.nullable(), incluirDre: z.boolean(),
  // DRE em 10 meses: volumes de cada mês; ausente ou nulo = padrões (Full: colunas D–M da planilha; Home Based: laudos/mês)
  mesesDre: z.array(z.object({ transferencias: num.max(100000), cautelares: num.max(100000) })).length(MESES_DRE).nullable().default(null),
  oferta: z.object({ valorFranquia: num, entrada: num, parcelamento: z.boolean(), numeroParcelas: z.number().int().min(0).max(120), valorParcela: num, texto: z.string().max(400).optional() }),
  exemplo: z.boolean(),
  dre: z.object({
    impostosPercentual: num.max(100), custoDetranPorVistoria: num, custoPesquisaCautelar: num, marketingPorTransferencia: num, marketingMensal: num.optional(),
    parcelaFranquia: num, royaltiesPorLaudo: num, laudosPorFuncionario: num.min(1), salario: num, encargosPercentual: num.max(1000),
    despesasFixas: z.object({ aluguel: num, agua: num, energia: num, internetTelefonia: num, contabilidade: num, manutencaoPredial: num,
      materialEscritorio: num, impressoes: num, sistemaFilmagem: num, canalOuvidoria: num, certificacaoIsoSeguros: num, despesasGerais: num }),
  }).optional(),
});
export type CorpoRelatorio = z.infer<typeof Corpo>;
export async function prepararHtml(req: Request, previa: boolean) {
  const u = await usuarioAtual(); if (!u) return { erro: problema(401, "Não autenticado") };
  const c = Corpo.safeParse(await req.json().catch(() => null));
  if (!c.success) return { erro: problema(422, "Dados inválidos") };
  const bloq = motivoBloqueio(c.data); if (bloq) return { erro: problema(422, "PDF bloqueado", bloq) };
  const { rows } = await pool.query("select destaque,lojas,estados,laudos_mes,frase_full,frase_home_based from config_marca where marca=$1", [c.data.marca]);
  const agora = new Date();
  const geradoEm = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(agora);
  const codigo = previa ? `${c.data.marca === "royal" ? "RV" : "AV"}-PREVIA` : gerarCodigoEstudo(c.data.marca, agora);
  return { codigo, html: montarHtml({ ...c.data, rede: rows[0], codigo, geradoEm, usuario: u.usuario }) };
}
export async function POST(req: Request) {
  const r = await prepararHtml(req, false); if (r.erro) return r.erro;
  const png = new URL(req.url).searchParams.get("formato") === "png";
  const arq = png ? await htmlParaPng(r.html!) : await htmlParaPdf(r.html!);
  return new Response(Buffer.from(arq), { headers: { "content-type": png ? "image/png" : "application/pdf", "content-disposition": `attachment; filename="estudo-${r.codigo}.${png ? "png" : "pdf"}"`, "cache-control": "no-store" } });
}
