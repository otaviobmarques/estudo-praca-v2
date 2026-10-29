// Gera os PDFs de EXEMPLO (Joinville) nas 2 marcas × Full sem DRE, Full com DRE, Home Based sem e com DRE.
// Uso: npx tsx scripts/gerar-exemplos.ts <pasta-saida>
import fs from "node:fs";
import { montarHtml, TEXTO_OFERTA, type DadosRelatorio, type Marca } from "../lib/relatorio";
import { PADROES, type Modelo } from "../lib/calculo";
import { htmlParaPdf } from "../lib/pdf";
const saida = process.argv[2] ?? "docs/exemplos"; fs.mkdirSync(saida, { recursive: true });
const REDE = {
  "auto-visao": { destaque: "Maior Rede de Vistorias do Brasil", lojas: "+240", estados: "+18", laudos_mes: "+80.000", frase_full: "Confie em uma rede com +15 anos, credenciada pelo DETRAN.", frase_home_based: "Confie em uma rede com + de 15 anos" },
  royal: { destaque: null, lojas: "+70", estados: "+10", laudos_mes: "+30.000", frase_full: "Confie em uma rede com +15 anos, credenciada pelo DETRAN.", frase_home_based: "Confie em uma rede com + de 15 anos" },
};
export function exemplo(marca: Marca, modelo: Modelo, dre: boolean): DadosRelatorio {
  return { marca, modelo, cidade: "Joinville", uf: "SC", populacao: 664541, frota: 498378, cenario: "provavel", percentuais: { ...PADROES.cenarios },
    percentualDetran: 90, ticketDetran: 147, ticketCautelar: 280, ecvs: null, laudosHomeBased: modelo === "home_based" ? 200 : null, incluirDre: dre,
    mesesDre: null, oferta: { ...PADROES.oferta[modelo], texto: TEXTO_OFERTA[modelo] }, exemplo: true, rede: REDE[marca],
    codigo: `${marca === "royal" ? "RV" : "AV"}-20261029-0100-EXMP`, geradoEm: "29/10/2026 01:00", usuario: "exemplo" };
}
if (process.argv[1]?.endsWith("gerar-exemplos.ts")) (async () => {
  for (const m of ["auto-visao", "royal"] as Marca[]) for (const [mod, dre, nome] of [["full", false, "full_sem-dre"], ["full", true, "full_com-dre"], ["home_based", false, "home-based_sem-dre"], ["home_based", true, "home-based_com-dre"]] as const) {
    const html = montarHtml(exemplo(m, mod, dre));
    fs.writeFileSync(`${saida}/relatorio_${m}_${nome}.html`, html);
    fs.writeFileSync(`${saida}/relatorio_${m}_${nome}.pdf`, await htmlParaPdf(html));
    console.log("ok", m, nome);
  }
})();
