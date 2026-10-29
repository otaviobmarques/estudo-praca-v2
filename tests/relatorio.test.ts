import { describe, it, expect } from "vitest";
import { montarHtml, motivoBloqueio, AVISO_FIXO, type DadosRelatorio } from "../lib/relatorio";
import { avaliarSenha } from "../lib/senha";
import { exemplo } from "../scripts/gerar-exemplos";
import { CorpoRede } from "../app/api/v1/rede/[marca]/route";

const texto = (h: string) => h.replace(/<style[\s\S]*?<\/style>/, "").replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const paginas = (h: string) => h.match(/<section class="pag[ "]/g)!.length;
const D = (m: DadosRelatorio["marca"], mod: DadosRelatorio["modelo"], dre: boolean, o: Partial<DadosRelatorio> = {}) => ({ ...exemplo(m, mod, dre), ...o });

describe.each(["auto-visao", "royal"] as const)("Relatório %s (modelos da Julia)", (m) => {
  const outra = m === "royal" ? /Auto Visão/ : /\bRoyal\b/;
  it("Full sem DRE: 2 páginas, números do exemplo", () => {
    const h = montarHtml(D(m, "full", false)); const t = texto(h);
    expect(paginas(h)).toBe(2);
    for (const x of ["9.968", "8.971", "R$ 1.597.897", "R$ 19.174.764", "Cenário provável (2%)", "Página 2 de 2"]) expect(t).toContain(x);
    expect(t).not.toMatch(/DRE mensal simulado/); expect(t).not.toMatch(outra);
  });
  it("Full com DRE: 3 páginas, DRE de 10 meses (planilha D–M) em página deitada", () => {
    const h = montarHtml(D(m, "full", true)); const t = texto(h);
    expect(paginas(h)).toBe(3);
    expect(h.match(/<section class="pag pag-h">/g)).toHaveLength(1); expect(h).toContain("@page horizontal{size:A4 landscape");
    for (let i = 1; i <= 10; i++) expect(t).toContain(`Mês ${i}`);
    // mês 1 = 100 Detran + 10 cautelar; mês 10 = 550 + 100; total de 10 meses R$ 369.405,00 e margem 62,21%
    for (const x of ["DRE simulado em 10 meses", "Total 10 meses", "2.661", "70.710", "R$ 369.405,00", "62,21%", "R$ 70.710,00", "Página 3 de 3"]) expect(t).toContain(x);
    expect(t).not.toMatch(outra);
  });
  it("Full com DRE: volumes de cada mês editáveis", () => {
    const meses = Array.from({ length: 10 }, () => ({ transferencias: 360, cautelares: 40 }));
    const t = texto(montarHtml(D(m, "full", true, { mesesDre: meses })));
    expect(t).toContain("R$ 387.838,00"); // 10 × R$ 38.783,80 (exemplo de 400 laudos/mês)
    expect(t).toContain("64,35%");
  });
  it("Home Based sem DRE: 2 páginas, sem DETRAN/credenciamento/ECV", () => {
    const h = montarHtml(D(m, "home_based", false)); const t = texto(h);
    expect(paginas(h)).toBe(2); expect(t).not.toMatch(/detran|credenci|\bECV/i);
    for (const x of ["R$ 56.000", "R$ 672.000", "Confie em uma rede com + de 15 anos"]) expect(t).toContain(x);
  });
  it("Home Based com DRE: 3 páginas, receita = laudos × preço, sem DETRAN/ECV", () => {
    const h = montarHtml(D(m, "home_based", true)); const t = texto(h);
    expect(paginas(h)).toBe(3); expect(t).not.toMatch(/detran|credenci|\bECV/i);
    expect(t).toContain("56.000"); // 200 × R$ 280 por mês
    expect(t).toContain("R$ 413.700,00"); // 10 × R$ 41.370,00
    expect(t).toContain("DRE simulado em 10 meses");
    expect(h.match(/<div class="sec"><span>(\d)<\/span>/g)!.map((x) => x.match(/\d/)![0])).toEqual(["1", "2", "3", "4", "5"]);
  });
  it("aviso fixo (mesmo texto nos dois modelos) em todas as páginas", () => {
    for (const [mod, dre] of [["full", true], ["home_based", true], ["home_based", false]] as const) {
      const h = montarHtml(D(m, mod, dre)); expect(h.split(AVISO_FIXO).length - 1).toBe(paginas(h));
    }
  });
  it("sem parcelamento a linha de parcelas some e a grade vira de 2", () => {
    const h = montarHtml(D(m, "full", false, { oferta: { valorFranquia: 30000, entrada: 30000, parcelamento: false, numeroParcelas: 0, valorParcela: 0 } }));
    expect(h).toContain('class="of of-2"'); expect(texto(h)).not.toMatch(/Parcelas \d/);
  });
  it("cidade real: sem marcas de EXEMPLO e com escape de HTML", () => {
    const h = montarHtml(D(m, "full", false, { exemplo: false, cidade: "Sant'Ana <b>", uf: "RS" }));
    expect(texto(h)).not.toMatch(/EXEMPLO/); expect(h).not.toContain("<b>, RS"); expect(h).toContain("Sant&#39;Ana &lt;b&gt; / RS");
  });
  it("identificador lateral com código e usuário em todas as páginas", () => {
    const h = montarHtml(D(m, "full", true)); expect(h.match(/<div class="lateral">Estudo [A-Z]{2}-\d{8}-\d{4}-\w{4} · gerado em/g)!.length).toBe(3);
  });
});

describe("Bloqueios", () => {
  it("Home Based sem laudos bloqueia (com ou sem DRE)", () => {
    for (const dre of [false, true]) expect(motivoBloqueio({ modelo: "home_based", laudosHomeBased: null, incluirDre: dre, mesesDre: null })).toMatch(/Sem esse número/);
  });
  it("Full com DRE e os 10 meses zerados bloqueia", () => expect(() => montarHtml(D("royal", "full", true, { mesesDre: Array(10).fill({ transferencias: 0, cautelares: 0 }) }))).toThrow(/desligue o DRE/));
  it("Full com DRE sem volumes usa os da planilha", () => expect(motivoBloqueio({ modelo: "full", laudosHomeBased: null, incluirDre: true, mesesDre: null })).toBeNull());
});

describe("Sobre a rede (validação do administrador)", () => {
  const ok = { destaque: "", lojas: "+70", estados: "+10", laudos_mes: "+30.000", frase_full: "a", frase_home_based: "b" };
  it("destaque vazio vira nulo", () => expect(CorpoRede.parse(ok).destaque).toBeNull());
  it("recusa campos vazios e textos longos", () => {
    expect(CorpoRede.safeParse({ ...ok, lojas: "" }).success).toBe(false);
    expect(CorpoRede.safeParse({ ...ok, frase_full: "x".repeat(141) }).success).toBe(false);
  });
});

describe("Regras da nova senha", () => {
  it.each([["Expansao", "Expansao", false], ["expansao1", "expansao1", false], ["Expansao1", "Expansao2", false], ["Exp1", "Exp1", false], ["Expansao1", "Expansao1", true]])
  ("%s / %s → %s", (a, b, ok) => expect(avaliarSenha(a, b).valida).toBe(ok));
});

describe("Sem marcações de revisão (decisão do Otávio: remover os textos [REVISAR])", () => {
  it.each(["auto-visao", "royal"] as const)("PDFs da %s", (m) => {
    for (const [mod, dre] of [["full", false], ["full", true], ["home_based", false], ["home_based", true]] as const)
      expect(texto(montarHtml(D(m, mod, dre)))).not.toMatch(/\[(REVISAR|VERIFICAR)/);
  });
  it("tela", async () => {
    const fs = await import("node:fs");
    expect(fs.readFileSync("modelos/tela/painel.html", "utf8")).not.toMatch(/\[(REVISAR|VERIFICAR)/);
  });
});
