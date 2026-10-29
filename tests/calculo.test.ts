import { describe, it, expect } from "vitest";
import ref from "../dados/dre-referencia-xlsx.json";
import { calcularPotencial, calcularDre, calcularHomeBased, conferirOferta, laudosDaUnidade, PADROES, gerarCodigoEstudo, formatarPercentual } from "../lib/calculo";

const xlsx = ref as unknown as Record<string, Record<string, number>>;

describe("Potencial da cidade — Joinville do exemplo (frota 498.378)", () => {
  it("compatível com o site atual (2%, 100% Detran, R$ 240)", () => {
    const r = calcularPotencial({ frota: 498378, percentualFrota: 2, percentualDetran: 100, ticketDetran: 240 });
    expect([r.laudosMes, r.laudosDia, r.faturamentoMes, r.faturamentoAno]).toEqual([9968, 453, 2392320, 28707840]);
  });
  it.each([
    [1.5, 7476, 340, 6728, 748, 1198456],
    [2, 9968, 453, 8971, 997, 1597897],
    [2.5, 12459, 566, 11213, 1246, 1997191],
  ])("cenário %s%% (escopo 7.5)", (pct, lm, ld, d, c, fb) => {
    const r = calcularPotencial({ frota: 498378, percentualFrota: pct });
    expect([r.laudosMes, r.laudosDia, r.detran, r.cautelar, r.faturamentoMes]).toEqual([lm, ld, d, c, fb]);
  });
  it("indicadores por ECV só com ECVs > 0", () => {
    expect(calcularPotencial({ frota: 498378, percentualFrota: 2, ecvs: 0 }).frotaPorEcv).toBeNull();
    const r = calcularPotencial({ frota: 498378, percentualFrota: 2, ecvs: 4 });
    expect([r.frotaPorEcv, r.laudosPorEcv]).toEqual([124595, 2492]);
  });
  it("recusa percentual fora da faixa", () => {
    expect(() => calcularPotencial({ frota: 1000, percentualFrota: 120 })).toThrow();
  });
});

describe("DRE — reprodução do xlsx (teste A, royalties 0, ticket cautelar 250, pessoas do xlsx)", () => {
  for (const col of ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"]) {
    it(`coluna ${col}`, () => {
      const x = xlsx[col];
      const r = calcularDre({ transferencias: x["9"], cautelares: x["10"], ticketDetran: x["11"], ticketCautelar: x["12"], pessoasFixas: x["24"], parametros: { royaltiesPorLaudo: 0 } });
      expect(r.receitaBruta).toBeCloseTo(x["13"], 2);
      expect(r.impostos).toBeCloseTo(x["14"], 2);
      expect(r.receitaLiquida).toBeCloseTo(x["15"], 2);
      expect(r.cvTotal).toBeCloseTo(x["22"], 2);
      expect(r.cpTotal).toBeCloseTo(x["27"], 2);
      expect(r.totalDespesas).toBeCloseTo(x["41"], 2);
      expect(r.ebitda).toBeCloseTo(x["43"], 2);
      expect(r.margem).toBeCloseTo(x["44"], 10);
    });
  }
});

describe("DRE — regra de pessoal (teste B) e royalties (teste C)", () => {
  it.each([
    ["D", 1, 3259, 0.2016, 2379, 0.1471],
    ["H", 2, 35145, 0.6606, 32345, 0.6079],
    ["M", 4, 73090, 0.7346, 67890, 0.6823],
  ])("coluna %s", (col, pessoas, ebB, mB, ebC, mC) => {
    const x = xlsx[col as string];
    const base = { transferencias: x["9"], cautelares: x["10"], ticketDetran: 147, ticketCautelar: 250 };
    const b = calcularDre({ ...base, parametros: { royaltiesPorLaudo: 0 } });
    expect([b.pessoas, b.ebitda]).toEqual([pessoas, ebB]);
    expect(b.margem).toBeCloseTo(mB as number, 4);
    const c = calcularDre(base);
    expect(c.ebitda).toBe(ebC);
    expect(c.margem).toBeCloseTo(mC as number, 4);
  });
});

describe("DRE — exemplo de Joinville com 400 laudos (aceite)", () => {
  const u = laudosDaUnidade(400);
  const r = calcularDre({ ...u, ticketDetran: PADROES.ticketDetran, ticketCautelar: PADROES.ticketCautelar });
  it("divide 360/40", () => expect(u).toEqual({ transferencias: 360, cautelares: 40 }));
  it("receita bruta R$ 64.120,00", () => expect(r.receitaBruta).toBe(64120));
  it("impostos e receita líquida", () => { expect(r.impostos).toBe(-3847.2); expect(r.receitaLiquida).toBe(60272.8); });
  it("CV total, pessoal e despesas", () => { expect(r.cvTotal).toBe(-8080); expect(r.cpTotal).toBe(-5100); expect(r.totalDespesas).toBe(-8309); });
  it("EBITDA R$ 38.783,80 e margem 64,35% sobre a receita líquida", () => {
    expect(r.ebitda).toBe(38783.8);
    expect(formatarPercentual(r.margem)).toBe("64,35%");
  });
  it("tem as linhas do modelo mais royalties", () => {
    expect(r.linhas.length).toBe(32);
    expect(r.linhas.at(-1)!.linha).toBe("44");
  });
});

describe("Home Based", () => {
  it("volume vem do campo, não da frota", () => {
    const r = calcularHomeBased({ laudosMes: 200 });
    expect(r.pronto && [r.laudosMes, r.laudosDia, r.faturamentoMes, r.faturamentoAno, r.foraDaFaixaSugerida]).toEqual([200, 9, 56000, 672000, false]);
  });
  it("campo vazio gera alerta", () => expect(calcularHomeBased({ laudosMes: null }).pronto).toBe(false));
  it("fora da faixa 180–250 só sinaliza", () => {
    const r = calcularHomeBased({ laudosMes: 400 });
    expect(r.pronto && r.foraDaFaixaSugerida).toBe(true);
  });
});

describe("Oferta", () => {
  it("padrões fecham nos dois modelos", () => {
    expect(conferirOferta(PADROES.oferta.full).fecha).toBe(true);
    expect(conferirOferta(PADROES.oferta.home_based).fecha).toBe(true);
  });
  it("alerta quando a conta não fecha (18 parcelas)", () => {
    const r = conferirOferta({ ...PADROES.oferta.full, numeroParcelas: 18 });
    expect(r.fecha).toBe(false);
    expect(r.alerta).toBe("A entrada (R$ 10.000) mais as parcelas (R$ 18.000) somam R$ 28.000, mas o valor da franquia é R$ 30.000.");
  });
  it("sem parcelamento compara entrada e valor", () => {
    expect(conferirOferta({ ...PADROES.oferta.home_based, parcelamento: false }).alerta).toBe("Sem parcelamento, a entrada (R$ 5.000) é diferente do valor da franquia (R$ 15.000).");
  });
});

describe("Código do estudo", () => {
  it("formato e horário de Brasília", () => {
    const c = gerarCodigoEstudo("auto-visao", new Date("2026-10-29T02:28:00Z"), () => new Uint8Array([0, 1, 2, 3]));
    expect(c).toBe("AV-20261028-2328-2345");
    expect(gerarCodigoEstudo("royal")).toMatch(/^RV-\d{8}-\d{4}-[2-9A-Z]{4}$/);
  });
});

import { padroesDre, DRE_ZERADAS_HOME_BASED } from "../lib/calculo";
describe("DRE do Home Based", () => {
  it("despesas que não se aplicam começam zeradas; as demais seguem a planilha", () => {
    const p = padroesDre("home_based");
    expect([p.custoDetranPorVistoria, p.marketingPorTransferencia, p.despesasFixas.aluguel, p.despesasFixas.agua, p.despesasFixas.energia, p.despesasFixas.manutencaoPredial, p.despesasFixas.sistemaFilmagem, p.despesasFixas.canalOuvidoria, p.despesasFixas.certificacaoIsoSeguros]).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect([p.despesasFixas.internetTelefonia, p.despesasFixas.contabilidade, p.despesasFixas.materialEscritorio, p.despesasFixas.impressoes, p.despesasFixas.despesasGerais, p.custoPesquisaCautelar, p.royaltiesPorLaudo, p.salario]).toEqual([120, 500, 100, 150, 250, 25, 8, 1700]);
    expect(Object.keys(DRE_ZERADAS_HOME_BASED)).toHaveLength(9);
    expect(padroesDre("full").despesasFixas.aluguel).toBe(6000); // o Full não muda
  });
  it("200 laudos × R$ 280 com os padrões do Home Based", () => {
    const r = calcularDre({ transferencias: 0, cautelares: 200, ticketDetran: 147, ticketCautelar: 280, parametros: padroesDre("home_based"), modelo: "home_based" });
    // RB 56.000; impostos 3.360; RL 52.640; CV = 5.000 + 1.000 + 1.600 = 7.600; pessoal 2.550; fixas 120+500+100+150+250 = 1.120
    expect([r.receitaBruta, r.receitaLiquida, r.cvTotal, r.cpTotal, r.totalDespesas, r.ebitda]).toEqual([56000, 52640, -7600, -2550, -1120, 41370]);
    expect(r.margem).toBeCloseTo(41370 / 52640, 10);
    expect(r.linhas.some((l) => /detran|transfer/i.test(l.rotulo))).toBe(false);
  });
  it("todas as despesas são editáveis no estudo", () => {
    const r = calcularDre({ transferencias: 0, cautelares: 200, ticketDetran: 0, ticketCautelar: 300, parametros: { ...padroesDre("home_based"), despesasFixas: { ...padroesDre("home_based").despesasFixas, aluguel: 1500 } }, modelo: "home_based" });
    expect(r.receitaBruta).toBe(60000); expect(r.totalDespesas).toBe(-2620);
  });
});

describe("Marketing do Home Based (decisão v2.0)", () => {
  it("começa zerado e, preenchido, entra como valor mensal", () => {
    expect(padroesDre("home_based").marketingMensal).toBe(0);
    const base = { transferencias: 0, cautelares: 200, ticketDetran: 0, ticketCautelar: 280, modelo: "home_based" as const };
    const r0 = calcularDre({ ...base, parametros: padroesDre("home_based") });
    const r1 = calcularDre({ ...base, parametros: { ...padroesDre("home_based"), marketingMensal: 500 } });
    expect(r1.marketing).toBe(-500); expect(r0.ebitda - r1.ebitda).toBe(500);
    expect(r1.linhas.find((l) => l.linha === "20")!.rotulo).toBe("Investimento em marketing (mensal)");
  });
  it("no Full o marketing continua por vistoria Detran e ignora o valor mensal", () => {
    const r = calcularDre({ transferencias: 360, cautelares: 40, ticketDetran: 147, ticketCautelar: 280, parametros: { ...padroesDre("full"), marketingMensal: 999 } });
    expect(r.marketing).toBe(-2880); expect(r.ebitda).toBe(38783.8);
  });
});

import { calcularDreMeses, volumesPadraoMeses, MESES_DRE } from "../lib/calculo";
describe("DRE em 10 meses (decisão de 29/10/2026: as colunas D–M da planilha viram os meses 1 a 10)", () => {
  const COLS = ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
  it("volumes padrão do Full = colunas D–M da planilha (transferência 100 → 550, cautelar 10 → 100)", () => {
    const v = volumesPadraoMeses("full");
    expect(v).toHaveLength(MESES_DRE);
    expect(v).toEqual(COLS.map((c) => ({ transferencias: xlsx[c]["9"], cautelares: xlsx[c]["10"] })));
  });
  it("Home Based: começa com os laudos/mês informados em todos os meses (sem curva inventada)", () => {
    expect(volumesPadraoMeses("home_based", 200)).toEqual(Array(10).fill({ transferencias: 0, cautelares: 200 }));
    expect(volumesPadraoMeses("home_based", null)).toEqual(Array(10).fill({ transferencias: 0, cautelares: 0 }));
  });
  it("reproduz o xlsx mês a mês (ticket 250, royalties 0, pessoas do xlsx) e soma o total", () => {
    const r = calcularDreMeses({ meses: COLS.map((c) => ({ transferencias: xlsx[c]["9"], cautelares: xlsx[c]["10"], pessoasFixas: xlsx[c]["24"] })), ticketDetran: 147, ticketCautelar: 250, parametros: { royaltiesPorLaudo: 0 } });
    expect(r.meses.map((m) => m.ebitda)).toEqual(COLS.map((c) => xlsx[c]["43"]));
    expect(r.total.ebitda).toBe(404695);
    expect(r.total.receitaBruta).toBe(COLS.reduce((s, c) => s + xlsx[c]["13"], 0));
  });
  it("padrões do sistema (R$ 147/280, royalties R$ 8, pessoal TETO(laudos ÷ 200))", () => {
    const r = calcularDreMeses({ meses: volumesPadraoMeses("full"), ticketDetran: 147, ticketCautelar: 280 });
    expect(r.meses.map((m) => m.ebitda)).toEqual([2661, 11072, 16933, 25344, 33755, 39616, 48027, 56438, 64849, 70710]);
    expect(r.meses.map((m) => m.pessoas)).toEqual([1, 1, 2, 2, 2, 3, 3, 3, 3, 4]);
    expect([r.total.receitaBruta, r.total.impostos, r.total.receitaLiquida, r.total.cvTotal, r.total.cpTotal, r.total.totalDespesas, r.total.ebitda])
      .toEqual([631750, -37905, 593845, -80150, -61200, -83090, 369405]);
    expect(formatarPercentual(r.total.margem)).toBe("62,21%");
    expect([r.total.transferencias, r.total.cautelares]).toEqual([3250, 550]);
  });
  it("cada mês é o DRE mensal de sempre (mesmo resultado de calcularDre)", () => {
    const r = calcularDreMeses({ meses: [...Array(9).fill({ transferencias: 0, cautelares: 0 }), { transferencias: 360, cautelares: 40 }], ticketDetran: 147, ticketCautelar: 280 });
    expect(r.meses[9].ebitda).toBe(38783.8);
  });
  it("Home Based: 10 × R$ 41.370,00 com 200 laudos e os padrões do Home Based", () => {
    const r = calcularDreMeses({ meses: volumesPadraoMeses("home_based", 200), ticketDetran: 147, ticketCautelar: 280, parametros: padroesDre("home_based"), modelo: "home_based" });
    expect(r.meses.every((m) => m.ebitda === 41370)).toBe(true);
    expect([r.total.receitaBruta, r.total.ebitda]).toEqual([560000, 413700]);
  });
  it("exige exatamente 10 meses", () => {
    expect(() => calcularDreMeses({ meses: volumesPadraoMeses("full").slice(0, 9), ticketDetran: 147, ticketCautelar: 280 })).toThrow(/10 meses/);
  });
});
