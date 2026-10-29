/**
 * Regras de cálculo do Gerador de Estudo de Praça v2 (escopo v1.5, seções 7.2, 7.3, 7.6 e 7.7).
 * Valores em dinheiro são tratados em centavos (inteiros) para que o DRE bata exatamente com a planilha.
 * Arredondamento "arred" = inteiro mais próximo, meio para cima (Math.round), como no site atual.
 */
export type Modelo = "full" | "home_based";
export type Cenario = "conservador" | "provavel" | "otimista";

export const DIAS_UTEIS = 22;

export const PADROES = {
  versao: "1.0",
  cenarios: { conservador: 1.5, provavel: 2, otimista: 2.5 } as Record<Cenario, number>,
  percentualDetran: 90,
  ticketDetran: 147,
  ticketCautelar: 280,
  homeBasedFaixaSugerida: { minimo: 180, maximo: 250 },
  oferta: {
    full: { valorFranquia: 30000, entrada: 10000, parcelamento: true, numeroParcelas: 20, valorParcela: 1000 },
    home_based: { valorFranquia: 15000, entrada: 5000, parcelamento: true, numeroParcelas: 10, valorParcela: 1000 },
  } as Record<Modelo, Oferta>,
  dre: {
    impostosPercentual: 6,
    custoDetranPorVistoria: 0,
    custoPesquisaCautelar: 25,
    marketingPorTransferencia: 8,
    /** Home Based: marketing em R$/mês (não há transferência). Começa zerado; o Otávio preenche (decisão v2.0). */
    marketingMensal: 0,
    parcelaFranquia: 1000,
    royaltiesPorLaudo: 8,
    laudosPorFuncionario: 200,
    salario: 1700,
    encargosPercentual: 50,
    despesasFixas: {
      aluguel: 6000, agua: 60, energia: 250, internetTelefonia: 120, contabilidade: 500,
      manutencaoPredial: 250, materialEscritorio: 100, impressoes: 150, sistemaFilmagem: 180,
      canalOuvidoria: 59, certificacaoIsoSeguros: 390, despesasGerais: 250,
    },
  },
} as const;

/**
 * Despesas do DRE que NÃO se aplicam ao Home Based (atendimento móvel, sem ponto fixo, sem DETRAN/ECV)
 * e começam zeradas — todas continuam editáveis. Lista confirmada pelo Otávio (escopo v2.0).
 */
export const DRE_ZERADAS_HOME_BASED = {
  custoDetranPorVistoria: "custo Detran por vistoria (não há vistoria de transferência)",
  marketingMensal: "marketing mensal (começa zerado; o Otávio preenche em cada estudo)",
  aluguel: "aluguel do ponto (sem ponto fixo)",
  agua: "água (do ponto)",
  energia: "energia (do ponto)",
  manutencaoPredial: "manutenção predial (sem ponto fixo)",
  sistemaFilmagem: "sistema de filmagem (exigência do credenciamento da ECV)",
  canalOuvidoria: "canal de ouvidoria (exigência do credenciamento da ECV)",
  certificacaoIsoSeguros: "certificação ISO + seguros (exigência do credenciamento da ECV)",
} as const;

/** Padrões do DRE por modelo (cópia mutável). */
export function padroesDre(modelo: Modelo): ParametrosDre {
  const p = { ...PADROES.dre, despesasFixas: { ...PADROES.dre.despesasFixas } } as ParametrosDre;
  if (modelo === "home_based") for (const k of Object.keys(DRE_ZERADAS_HOME_BASED)) {
    if (k in p.despesasFixas) (p.despesasFixas as Record<string, number>)[k] = 0; else (p as unknown as Record<string, number>)[k] = 0;
  if (modelo === "home_based") p.marketingPorTransferencia = 0; // sem transferência no Home Based
  }
  return p;
}

export const arred = (x: number) => Math.round(x);
const centavos = (reais: number) => Math.round(reais * 100);

// ---------- Potencial da cidade (Full) ----------
export interface EntradaPotencial {
  frota: number;
  percentualFrota: number; // % mensal do cenário escolhido
  percentualDetran?: number;
  ticketDetran?: number;
  ticketCautelar?: number;
  ecvs?: number | null;
}
export function calcularPotencial(e: EntradaPotencial) {
  validarFaixa(e.percentualFrota, 0, 100, "percentual da frota");
  const pd = e.percentualDetran ?? PADROES.percentualDetran;
  validarFaixa(pd, 0, 100, "percentual Detran");
  const tD = e.ticketDetran ?? PADROES.ticketDetran;
  const tC = e.ticketCautelar ?? PADROES.ticketCautelar;
  if (tD < 0 || tC < 0) throw new Error("Ticket não pode ser negativo");
  const laudosMes = arred((e.frota * e.percentualFrota) / 100);
  const detran = arred((laudosMes * pd) / 100);
  const cautelar = laudosMes - detran; // proposta do escopo: cautelar = total − Detran
  const laudosDia = arred(laudosMes / DIAS_UTEIS);
  const detranDia = arred(detran / DIAS_UTEIS);
  const faturamentoMesCent = detran * centavos(tD) + cautelar * centavos(tC);
  const ecvs = e.ecvs && e.ecvs > 0 ? e.ecvs : null;
  return {
    laudosMes, laudosDia, detran, cautelar, detranDia, cautelarDia: laudosDia - detranDia,
    faturamentoDetran: (detran * centavos(tD)) / 100,
    faturamentoCautelar: (cautelar * centavos(tC)) / 100,
    faturamentoMes: faturamentoMesCent / 100,
    faturamentoAno: (faturamentoMesCent * 12) / 100,
    frotaPorEcv: ecvs ? arred(e.frota / ecvs) : null,
    laudosPorEcv: ecvs ? arred(laudosMes / ecvs) : null,
  };
}

// ---------- Home Based (volume digitado, nunca pela frota) ----------
export function calcularHomeBased(e: { laudosMes: number | null | undefined; ticketCautelar?: number }) {
  if (e.laudosMes == null || !Number.isFinite(e.laudosMes) || e.laudosMes <= 0)
    return { pronto: false as const, alerta: "Preencha os laudos/mês (sugestão: 180 a 250)." };
  const laudosMes = arred(e.laudosMes);
  const t = centavos(e.ticketCautelar ?? PADROES.ticketCautelar);
  const { minimo, maximo } = PADROES.homeBasedFaixaSugerida;
  return {
    pronto: true as const,
    laudosMes,
    laudosDia: arred(laudosMes / DIAS_UTEIS),
    faturamentoMes: (laudosMes * t) / 100,
    faturamentoAno: (laudosMes * t * 12) / 100,
    foraDaFaixaSugerida: laudosMes < minimo || laudosMes > maximo,
  };
}

// ---------- Oferta ----------
export interface Oferta { valorFranquia: number; entrada: number; parcelamento: boolean; numeroParcelas: number; valorParcela: number; texto?: string }
export function conferirOferta(o: Oferta): { fecha: boolean; alerta: string | null } {
  const brl = (v: number) => formatarMoeda(v, false);
  const taxa = centavos(o.valorFranquia), ent = centavos(o.entrada);
  if (o.parcelamento) {
    const parc = o.numeroParcelas * centavos(o.valorParcela);
    if (ent + parc === taxa) return { fecha: true, alerta: null };
    return { fecha: false, alerta: `A entrada (${brl(o.entrada)}) mais as parcelas (${brl(parc / 100)}) somam ${brl((ent + parc) / 100)}, mas o valor da franquia é ${brl(o.valorFranquia)}.` };
  }
  if (ent === taxa) return { fecha: true, alerta: null };
  return { fecha: false, alerta: `Sem parcelamento, a entrada (${brl(o.entrada)}) é diferente do valor da franquia (${brl(o.valorFranquia)}).` };
}

// ---------- DRE mensal (Full) — mesmas linhas e fórmulas de dre-auto-visao.xlsx ----------
export type ParametrosDre = typeof PADROES.dre extends infer T ? { -readonly [K in keyof T]: T[K] extends object ? { -readonly [J in keyof T[K]]: number } : number } : never;
export interface EntradaDre {
  transferencias: number; cautelares: number; ticketDetran: number; ticketCautelar: number;
  parametros?: Partial<ParametrosDre>;
  /** Para reproduzir o xlsx (pessoas digitadas). Se ausente, usa a regra TETO(laudos ÷ 200), mínimo 1. */
  pessoasFixas?: number;
  /** Home Based: só laudos cautelares; as linhas ligadas a transferência/Detran saem do demonstrativo. */
  modelo?: Modelo;
}
export interface LinhaDre { linha: string; rotulo: string; valor: number; tipo: "quantidade" | "moeda" | "percentual" | "subtotal" | "titulo" }

export function laudosDaUnidade(laudosMes: number, percentualDetran: number = PADROES.percentualDetran) {
  const transferencias = arred((laudosMes * percentualDetran) / 100);
  return { transferencias, cautelares: laudosMes - transferencias };
}

export function calcularDre(e: EntradaDre) {
  const p = { ...PADROES.dre, ...e.parametros, despesasFixas: { ...PADROES.dre.despesasFixas, ...(e.parametros?.despesasFixas ?? {}) } };
  const T = e.transferencias, C = e.cautelares, laudos = T + C;
  const rb = T * centavos(e.ticketDetran) + C * centavos(e.ticketCautelar);
  const impostos = -Math.round((rb * p.impostosPercentual) / 100);
  const rl = rb + impostos;
  const custoDetran = -T * centavos(p.custoDetranPorVistoria);
  const custoPesquisa = -C * centavos(p.custoPesquisaCautelar);
  const marketing = e.modelo === "home_based" ? -centavos(p.marketingMensal ?? 0) : -T * centavos(p.marketingPorTransferencia);
  const parcela = -centavos(p.parcelaFranquia);
  const royalties = -laudos * centavos(p.royaltiesPorLaudo);
  const cvTotal = custoDetran + custoPesquisa + marketing + parcela + royalties;
  const pessoas = e.pessoasFixas ?? Math.max(1, Math.ceil(laudos / p.laudosPorFuncionario));
  const salarios = -centavos(p.salario) * pessoas;
  const custoSocial = Math.round((salarios * p.encargosPercentual) / 100);
  const cpTotal = salarios + custoSocial;
  const d = p.despesasFixas;
  const despesas = ([
    ["29", "Aluguel", d.aluguel], ["30", "Água", d.agua], ["31", "Energia", d.energia],
    ["32", "Internet / Telefonia", d.internetTelefonia], ["33", "Contabilidade", d.contabilidade],
    ["34", "Manutenção Predial", d.manutencaoPredial], ["35", "Material de Escritório", d.materialEscritorio],
    ["36", "Impressões", d.impressoes], ["37", "Sistema de Filmagem", d.sistemaFilmagem],
    ["38", "Canal de Ouvidoria", d.canalOuvidoria], ["39", "Certificação ISO + Seguros", d.certificacaoIsoSeguros],
    ["40", "Despesas Gerais", d.despesasGerais],
  ] as const).map(([l, r, v]) => [l, r, -centavos(v)] as const);
  const totalDespesas = despesas.reduce((s, x) => s + x[2], 0);
  const ebitda = rl + cvTotal + cpTotal + totalDespesas;
  // Margem do EBITDA sobre a receita líquida (decisão 38); zero se a receita líquida for zero (IFERROR da planilha).
  const margem = rl === 0 ? 0 : ebitda / rl;
  const m = (c: number) => c / 100;
  const linhas: LinhaDre[] = [
    { linha: "9", rotulo: "Vistorias de transferência (Detran)", valor: T, tipo: "quantidade" },
    { linha: "10", rotulo: "Laudos cautelares", valor: C, tipo: "quantidade" },
    { linha: "11", rotulo: "Ticket médio transferência", valor: e.ticketDetran, tipo: "moeda" },
    { linha: "12", rotulo: "Ticket médio cautelar", valor: e.ticketCautelar, tipo: "moeda" },
    { linha: "13", rotulo: "Receita bruta operacional", valor: m(rb), tipo: "subtotal" },
    { linha: "14", rotulo: "Impostos", valor: m(impostos), tipo: "moeda" },
    { linha: "15", rotulo: "Receita líquida operacional", valor: m(rl), tipo: "subtotal" },
    { linha: "18", rotulo: "Custo Detran por vistoria", valor: m(custoDetran), tipo: "moeda" },
    { linha: "19", rotulo: "Custo da pesquisa (laudo cautelar)", valor: m(custoPesquisa), tipo: "moeda" },
    { linha: "20", rotulo: "Investimento em marketing", valor: m(marketing), tipo: "moeda" },
    { linha: "21", rotulo: "Parcela da franquia", valor: m(parcela), tipo: "moeda" },
    { linha: "R", rotulo: "Royalties", valor: m(royalties), tipo: "moeda" },
    { linha: "22", rotulo: "Custos variáveis — total", valor: m(cvTotal), tipo: "subtotal" },
    { linha: "24", rotulo: "Funcionários", valor: pessoas, tipo: "quantidade" },
    { linha: "25", rotulo: "Salários", valor: m(salarios), tipo: "moeda" },
    { linha: "26", rotulo: "Encargos sociais", valor: m(custoSocial), tipo: "moeda" },
    { linha: "27", rotulo: "Custo de pessoal — total", valor: m(cpTotal), tipo: "subtotal" },
    ...despesas.map(([l, r, v]) => ({ linha: l, rotulo: r, valor: m(v), tipo: "moeda" as const })),
    { linha: "41", rotulo: "Despesas fixas — total", valor: m(totalDespesas), tipo: "subtotal" },
    { linha: "43", rotulo: "Resultado operacional (EBITDA)", valor: m(ebitda), tipo: "subtotal" },
    { linha: "44", rotulo: "Margem EBITDA (sobre a receita líquida)", valor: margem, tipo: "percentual" },
  ];
  const SO_FULL = new Set(["9", "11", "18"]);
  const linhasFinais = e.modelo === "home_based"
    ? linhas.filter((l) => !SO_FULL.has(l.linha)).map((l) => l.linha === "10" ? { ...l, rotulo: "Laudos de vistoria cautelar" } : l.linha === "12" ? { ...l, rotulo: "Preço do laudo" } : l.linha === "20" ? { ...l, rotulo: "Investimento em marketing (mensal)" } : l)
    : linhas;
  return {
    transferencias: T, cautelares: C, receitaTransferencia: m(T * centavos(e.ticketDetran)), receitaCautelar: m(C * centavos(e.ticketCautelar)),
    custoDetran: m(custoDetran), custoPesquisa: m(custoPesquisa), marketing: m(marketing), parcela: m(parcela), salarios: m(salarios), custoSocial: m(custoSocial),
    despesas: despesas.map(([l, r, v]) => ({ linha: l, rotulo: r, valor: m(v) })), parametros: p,
    receitaBruta: m(rb), impostos: m(impostos), receitaLiquida: m(rl), cvTotal: m(cvTotal), royalties: m(royalties),
    pessoas, cpTotal: m(cpTotal), totalDespesas: m(totalDespesas), ebitda: m(ebitda), margem, linhas: linhasFinais,
  };
}

// ---------- utilidades ----------
function validarFaixa(v: number, min: number, max: number, nome: string) {
  if (!Number.isFinite(v) || v < min || v > max) throw new Error(`${nome} fora da faixa (${min} a ${max})`);
}
export function formatarMoeda(v: number, comCentavos = true) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: comCentavos ? 2 : 0, maximumFractionDigits: comCentavos ? 2 : 0 }).replace(/\u00a0/g, " ");
}
export function formatarNumero(v: number) { return v.toLocaleString("pt-BR"); }
export function formatarPercentual(fracao: number) { return (fracao * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%"; }

const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
/** Código do estudo <AV|RV>-AAAAMMDD-HHMM-XXXX (horário de Brasília). Não é salvo. */
export function gerarCodigoEstudo(marca: "auto-visao" | "royal", agora = new Date(), aleatorio: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))) {
  const f = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(agora);
  const g = (t: string) => f.find((x) => x.type === t)!.value;
  let sufixo = "";
  for (const b of aleatorio(4)) sufixo += ALFABETO[b % ALFABETO.length];
  return `${marca === "royal" ? "RV" : "AV"}-${g("year")}${g("month")}${g("day")}-${g("hour")}${g("minute")}-${sufixo}`;
}
