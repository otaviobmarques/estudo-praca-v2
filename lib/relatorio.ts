/**
 * Relatório A4 a partir dos modelos HTML aprovados da Julia (design/relatorio/guia-<marca>/fonte, especificação v1.7),
 * copiados para modelos/relatorio/<marca>/. O HTML dela é preservado (SVG, CSS, ordem dos blocos);
 * aqui só trocamos os valores de EXEMPLO pelos dados do estudo, por trechos bem delimitados.
 * - full.html: páginas Relatório, DRE e Contatos (Full sem DRE = sem a página do DRE).
 *   A página do DRE sai em A4 deitada, com os 10 meses lado a lado (decisão de 29/10/2026); o visual é o da Julia,
 *   só com tamanhos ajustados em CSS_DRE_MESES.
 * - home-based.html: páginas Estudo da cidade e Entregáveis/Contatos (com DRE = entra a página do DRE do full.html).
 * Avisos e textos legais da Julia ficam como estão (decisão pendente do Otávio).
 */
import fs from "node:fs";
import path from "node:path";
import {
  calcularPotencial, calcularHomeBased, calcularDreMeses, volumesPadraoMeses, PADROES, padroesDre, MESES_DRE,
  formatarMoeda, formatarNumero as N, formatarPercentual, type Modelo, type Cenario, type Oferta, type ParametrosDre, type VolumeMes,
} from "./calculo";

export type Marca = "auto-visao" | "royal";
export const AVISO_FIXO = "Aviso importante: as projeções, estimativas de demanda e o DRE apresentados neste estudo são apenas referenciais. Eles foram calculados com dados públicos (Senatran e IBGE) e com premissas médias, que podem variar de cidade para cidade e conforme a gestão, o ponto comercial, a concorrência e as condições de mercado. Este material não é promessa nem garantia de faturamento, lucro ou retorno do investimento, e não substitui a análise própria do candidato a franqueado.";
export const ENTREGAVEIS_BASE = ["Suporte na abertura do CNPJ", "Treinamento", "Marketing", "Jurídico", "Sistema de montagem de laudos", "Suporte técnico", "Back office comercial"];
export const ENTREGAVEIS_FULL_EXTRA = ["Todo o processo de credenciamento no DETRAN", "Sistema ECV Vistoria DETRAN", "Câmeras e leitores de biometria em comodato, quando o DETRAN exigir"];
export const TEXTO_OFERTA: Record<Modelo, string> = {
  full: "Entrada inclui kit de câmeras, biometria, projeto arquitetônico e 2 vagas de curso. Início na etapa posterior do credenciamento/liberação.",
  home_based: "10 parcelas sem juros. Atendimento móvel, sem ponto fixo.",
};
const NOME_MARCA: Record<Marca, string> = { "auto-visao": "Auto Visão", royal: "Royal Vistorias" };
const ROTULO_MODELO: Record<Modelo, string> = { full: "Franquia Full · Completa", home_based: "Franquia Home Based · Atendimento Móvel" };
const NOME_CEN: Record<Cenario, string> = { conservador: "conservador", provavel: "provável", otimista: "otimista" };

export interface Rede { destaque: string | null; lojas: string; estados: string; laudos_mes: string; frase_full: string; frase_home_based: string }
export interface DadosRelatorio {
  marca: Marca; modelo: Modelo; cidade: string; uf: string; populacao: number; frota: number;
  cenario: Cenario; percentuais: Record<Cenario, number>; percentualDetran: number; ticketDetran: number; ticketCautelar: number;
  ecvs: number | null; laudosHomeBased: number | null; incluirDre: boolean;
  /** Volumes dos 10 meses do DRE; null = padrões (Full: planilha; Home Based: laudos/mês em todos os meses). */
  mesesDre: VolumeMes[] | null;
  dre?: Partial<ParametrosDre>;
  oferta: Oferta; exemplo: boolean; rede: Rede; codigo: string; geradoEm: string; usuario: string;
}

/** O que impede a geração do PDF (null = pode gerar). */
export function motivoBloqueio(d: Pick<DadosRelatorio, "modelo" | "laudosHomeBased" | "incluirDre" | "mesesDre">): string | null {
  if (d.modelo === "home_based" && !(d.laudosHomeBased && d.laudosHomeBased > 0)) return "Informe os laudos/mês para gerar o estudo Home Based. Sem esse número, o PDF não é gerado.";
  if (d.incluirDre && d.mesesDre && !d.mesesDre.some((v) => v.transferencias + v.cautelares > 0)) return "Preencha os laudos dos 10 meses ou desligue o DRE.";
  return null;
}

/** Ajustes da página deitada do DRE (10 meses + total). Usa as cores e fontes de cada marca (estilo.css da Julia). */
const CSS_DRE_MESES = `@page horizontal{size:A4 landscape;margin:0}
.pag.pag-h{page:horizontal;width:297mm;height:210mm}
.pag-h .lateral{width:210mm}
.pag-h .corpo{padding-top:3mm;gap:2.2mm}
.pag-h .dre-cab .ilu,.pag-h .dre-cab>svg{width:10mm}
.pag-h .prem{font-size:7.2pt;line-height:1.3}
.pag-h table.dre{font-size:6.8pt;table-layout:fixed;width:100%}
.pag-h table.dre th:first-child,.pag-h table.dre td:first-child{width:62mm;text-align:left}
.pag-h .dre td,.pag-h .dre th{padding:.55mm 1.2mm;white-space:nowrap;font-size:6.8pt;letter-spacing:0;overflow:hidden;text-overflow:ellipsis}
.pag-h .dre thead th{white-space:normal;line-height:1.15;vertical-align:bottom}
.pag-h .dre td+td,.pag-h .dre th+th{text-align:right}
.pag-h .dre td:last-child,.pag-h .dre th:last-child{font-weight:800}
.pag-h .dre tr.s td:first-child{padding-left:3mm}
.pag-h .res{padding:2.6mm 6mm;gap:4mm}.pag-h .res b{font-size:15pt}
.pag-h .aviso{padding:2mm 4mm;font-size:7.5pt}
.pag-h .mlogo{bottom:22mm;width:70mm}`;

// ---------- carga dos modelos ----------
const RAIZ = path.join(process.cwd(), "modelos", "relatorio");
const ASSETS = path.join(process.cwd(), "public");
const cache = new Map<string, string>();
const ler = (p: string, enc: BufferEncoding = "utf8") => { const k = p + enc; if (!cache.has(k)) cache.set(k, fs.readFileSync(p, enc)); return cache.get(k)!; };
const dataUri = (p: string, tipo: string) => `data:${tipo};base64,${ler(p, "base64")}`;
// Fontes embutidas no PDF (as mesmas da tela, public/fontes), para não depender das fontes instaladas no servidor.
const FONTES = () => ([["Inter", "100 900"], ["Nunito", "200 1000"], ["Raleway", "100 900"]] as const)
  .map(([f, p]) => `@font-face{font-family:"${f}";src:url(${dataUri(path.join(ASSETS, "fontes", `${f}.woff2`), "font/woff2")}) format("woff2");font-weight:${p}}`).join("");
function estilo(marca: Marca) {
  return FONTES() + ler(path.join(RAIZ, marca, "estilo.css")).replace(/url\(([\w.-]+\.png)\)/g, (_m, f) => `url(${dataUri(path.join(RAIZ, marca, f), "image/png")})`);
}
function paginas(marca: Marca, arq: "full" | "home-based") {
  const h = ler(path.join(RAIZ, marca, `${arq}.html`))
    .replace(/\.\.\/\.\.\/\.\.\/assets\/([\w.-]+\.svg)/g, (_m, f) => dataUri(path.join(ASSETS, f), "image/svg+xml"));
  const ini = h.indexOf('<section class="pag">');
  const fim = h.lastIndexOf("</body>");
  const sprite = h.slice(h.indexOf("<body>") + 6, ini);
  return { sprite, pags: h.slice(ini, fim).split(/(?=<section class="pag">)/) };
}

// ---------- utilidades de substituição ----------
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const R0 = (v: number) => formatarMoeda(v, false);
const R2 = (v: number) => formatarMoeda(v, true);
const sg = (v: number) => (Math.round(v * 100) < 0 ? "− " + R2(-v) : R2(Math.abs(v)));
const pct = (v: number, b: number) => (b ? ((Math.abs(v / b) < 0.00005 ? 0 : (v / b) * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%") : "—");
function troca(h: string, re: RegExp, novo: string | ((...a: string[]) => string), obrig = true) {
  if (obrig && !re.test(h)) throw new Error(`Modelo do relatório mudou: trecho não encontrado ${re}`);
  re.lastIndex = 0;
  return h.replace(re, novo as never);
}
const cartao = (h: string, rotulo: string, num: string, f: string) =>
  troca(h, new RegExp(`(<div class="r">${rotulo.replace(/[*()]/g, "\\$&")}</div><div class="num">)[^<]*(</div><div class="f">)[^<]*(</div>)`), `$1${num}$2${f}$3`);

export function montarHtml(d: DadosRelatorio): string {
  const bloq = motivoBloqueio(d); if (bloq) throw new Error(bloq);
  const hb = d.modelo === "home_based";
  const comDre = d.incluirDre;
  const ex = d.exemplo ? " · EXEMPLO" : "";
  const cidadeUf = `${esc(d.cidade)} / ${esc(d.uf)}`;
  const full = paginas(d.marca, "full");
  const base = hb ? paginas(d.marca, "home-based") : full;
  // [p1, (DRE), contatos]
  let pags = hb ? [base.pags[0], ...(comDre ? [full.pags[1]] : []), base.pags[1]] : [full.pags[0], ...(comDre ? [full.pags[1]] : []), full.pags[2]];
  const total = pags.length;
  const nomeMarca = NOME_MARCA[d.marca];

  // ---- números ----
  const pot = !hb ? calcularPotencial({ frota: d.frota, percentualFrota: d.percentuais[d.cenario], percentualDetran: d.percentualDetran, ticketDetran: d.ticketDetran, ticketCautelar: d.ticketCautelar, ecvs: d.ecvs }) : null;
  const hbr = hb ? calcularHomeBased({ laudosMes: d.laudosHomeBased, ticketCautelar: d.ticketCautelar }) : null;
  if (hbr && !hbr.pronto) throw new Error(hbr.alerta);
  const meses = (d.mesesDre ?? volumesPadraoMeses(d.modelo, d.laudosHomeBased)).map((v) => (hb ? { transferencias: 0, cautelares: Math.round(v.cautelares) } : { transferencias: Math.round(v.transferencias), cautelares: Math.round(v.cautelares) }));
  const parametros = { ...padroesDre(d.modelo), ...d.dre, despesasFixas: { ...padroesDre(d.modelo).despesasFixas, ...(d.dre?.despesasFixas ?? {}) } };
  const dre = comDre ? calcularDreMeses({ meses, ticketDetran: d.ticketDetran, ticketCautelar: d.ticketCautelar, parametros, modelo: d.modelo }) : null;

  pags = pags.map((p, i) => {
    let h = p;
    // proteção e identificação (todas as páginas)
    h = troca(h, /<div class="lateral">[^<]*<\/div>/, `<div class="lateral">Estudo ${d.codigo} · gerado em ${esc(d.geradoEm)} (horário de Brasília) · ${nomeMarca} · ${esc(d.usuario)}${ex}</div>`);
    if (!d.exemplo) h = h.replace('<div class="mdagua"></div>', "").replace(/<span class="selo-ex">EXEMPLO<\/span>/, "");
    h = troca(h, /<div class="rodape"><span>[^<]*<\/span><span>[^<]*<\/span><\/div>/, `<div class="rodape"><span>${nomeMarca} · Estudo ${d.codigo}${ex}</span><span>Página ${i + 1} de ${total}</span></div>`);
    // mantém o sufixo " · EXEMPLO" só onde o modelo da Julia o tem (no título da Royal ele não existe)
    h = h.replace(/Joinville \/ SC( · EXEMPLO)?/g, (_m, suf) => cidadeUf + (suf ? ex : ""));
    h = h.replace(/(<p class="ref">)[^<]*(<\/p>)/, `$1${AVISO_FIXO}$2`);
    return h;
  });

  // ---- página 1 ----
  let p1 = pags[0];
  p1 = troca(p1, /<div class="meta">[\s\S]*?<\/div>/, `<div class="meta"><b>${ROTULO_MODELO[d.modelo]}</b> · <b>Base: Senatran set/2026 · IBGE Estimativa 2025 · Parâmetros v${PADROES.versao}</b><br>Gerado em ${esc(d.geradoEm)} · Código ${d.codigo} · ${hb ? `Volume informado: ${N(hbr!.pronto ? hbr!.laudosMes : 0)} laudos/mês` : `Cenário ${NOME_CEN[d.cenario]} (${N(d.percentuais[d.cenario])}%)`}${d.exemplo ? " · Números ilustrativos de EXEMPLO" : ""}</div>`);
  // Sobre a rede
  p1 = p1.replace(/<p class="rede-tit">[^<]*<\/p>/, "");
  p1 = troca(p1, /(<h2>Sobre a rede<\/h2>)(?:<p class="rede-tit">[^<]*<\/p>)?<p class="rede-conf">[^<]*<\/p>/, `$1${d.rede.destaque ? `<p class="rede-tit">${esc(d.rede.destaque)}</p>` : ""}<p class="rede-conf">${esc(hb ? d.rede.frase_home_based : d.rede.frase_full)}</p>`);
  const nums = [d.rede.lojas, d.rede.estados, d.rede.laudos_mes]; let k = 0;
  p1 = p1.replace(/(<div class="rn">(?:<svg[\s\S]*?<\/svg>)?<b>)[^<]*(<\/b>)/g, (_m, a, b) => `${a}${esc(nums[k++] ?? "")}${b}`);
  p1 = cartao(p1, "População", N(d.populacao), `IBGE, Estimativa 2025${ex}`);
  p1 = cartao(p1, "Frota de veículos", N(d.frota), `Senatran, set/2026${ex}`);
  if (hb && hbr?.pronto) {
    p1 = troca(p1, /<div class="cen">(<svg[\s\S]*?<\/svg>)?<span>[\s\S]*?<\/span><\/div>/, `<div class="cen">$1<span>Volume informado: <b>${N(hbr.laudosMes)} laudos/mês</b>${ex} · população e frota como contexto da cidade</span></div>`);
    p1 = cartao(p1, "Concorrentes (cautelar)", d.ecvs ? N(d.ecvs) : "—", d.ecvs ? "Informado pelo usuário" : "Não informado · opcional");
    p1 = cartao(p1, "Laudos por mês", N(hbr.laudosMes), `Informado no painel${ex}`);
    p1 = cartao(p1, "Laudos por dia útil", N(hbr.laudosDia), "Mês ÷ 22 dias úteis");
    p1 = cartao(p1, "Faturamento bruto/mês*", R0(hbr.faturamentoMes), `Anual: ${R0(hbr.faturamentoAno)}`);
    p1 = troca(p1, /(<table><thead>[\s\S]*?<\/thead><tbody>)[\s\S]*?(<\/tbody><\/table>)/, `$1<tr><td>Vistoria cautelar · atendimento móvel</td><td>${N(hbr.laudosMes)}</td><td>${N(hbr.laudosDia)}</td><td>${R0(d.ticketCautelar)}</td><td>${R0(hbr.faturamentoMes)}</td></tr><tr class="t"><td>Faturamento bruto anual*</td><td></td><td></td><td></td><td>${R0(hbr.faturamentoAno)}</td></tr>$2`);
    p1 = troca(p1, /<p class="prem">Premissas:[\s\S]*?<\/p>/, `<p class="prem">Premissas: laudos/mês informado no painel (${N(hbr.laudosMes)}${ex}; faixa sugerida 180 a 250); laudos/dia útil = arred(laudos ÷ 22); faturamento = laudos × preço do laudo ${R0(d.ticketCautelar)}; anual = mensal × 12. População e frota são contexto da cidade. *Estimativa de potencial.</p>`);
  } else if (pot) {
    const pc = d.percentuais[d.cenario], pd = d.percentualDetran;
    p1 = troca(p1, /<div class="cen">(<svg[\s\S]*?<\/svg>)?<span>[\s\S]*?<\/span><\/div>/, `<div class="cen">$1<span>Cenário <b>${NOME_CEN[d.cenario]}</b> · <b>${N(pc)}%</b> da frota por mês · único cenário exibido neste relatório</span></div>`);
    p1 = cartao(p1, "ECVs concorrentes", d.ecvs ? N(d.ecvs) : "—", pot.frotaPorEcv ? `${N(pot.frotaPorEcv)} veículos e ${N(pot.laudosPorEcv!)} laudos/mês por ECV` : "Não informado · opcional");
    p1 = cartao(p1, "Laudos por mês", N(pot.laudosMes), `${N(pot.detran)} Detran · ${N(pot.cautelar)} cautelar`);
    p1 = cartao(p1, "Laudos por dia útil", N(pot.laudosDia), "Mês ÷ 22 dias úteis");
    p1 = cartao(p1, "Faturamento bruto/mês*", R0(pot.faturamentoMes), `Anual: ${R0(pot.faturamentoAno)}`);
    p1 = troca(p1, /(<table><thead>[\s\S]*?<\/thead><tbody>)[\s\S]*?(<\/tbody><\/table>)/, `$1
<tr><td>Detran (${N(pd)}%)</td><td>${N(pot.detran)}</td><td>${N(pot.detranDia)}</td><td>${R0(d.ticketDetran)}</td><td>${R0(pot.faturamentoDetran)}</td></tr>
<tr><td>Cautelar (${N(100 - pd)}%)</td><td>${N(pot.cautelar)}</td><td>${N(pot.cautelarDia)}</td><td>${R0(d.ticketCautelar)}</td><td>${R0(pot.faturamentoCautelar)}</td></tr>
<tr class="t"><td>Total por mês</td><td>${N(pot.laudosMes)}</td><td>${N(pot.laudosDia)}</td><td>—</td><td>${R0(pot.faturamentoMes)}</td></tr>
<tr class="t"><td>Faturamento bruto anual*</td><td></td><td></td><td></td><td>${R0(pot.faturamentoAno)}</td></tr>$2`);
    // premissas: mesmo texto de cada modelo da Julia (a Royal tem a versão curta), só com os números do estudo
    p1 = d.marca === "royal"
      ? troca(p1, /(<p class="prem">Premissas:)[\s\S]*?(\*Estimativa de potencial\.)/, `$1 laudos/mês = arred(frota × ${N(pc)}%); ${N(pd)}% Detran e ${N(100 - pd)}% cautelar; tickets ${R0(d.ticketDetran)} e ${R0(d.ticketCautelar)}; anual = mensal × 12; dia útil = arred(mês ÷ 22). $2`)
      : troca(p1, /(<p class="prem">Premissas:)[\s\S]*?(\*Estimativa de potencial\.)/, `$1 laudos/mês = arred(frota × ${N(pc)}%); ${N(pd)}% vistoria Detran e ${N(100 - pd)}% vistoria cautelar; ticket Detran ${R0(d.ticketDetran)} e cautelar ${R0(d.ticketCautelar)}; faturamento = laudos Detran × ticket Detran + laudos cautelar × ticket cautelar; anual = mensal × 12; dia útil = arred(mês ÷ 22). $2`);
  }
  pags[0] = p1;

  // ---- página do DRE (10 meses, A4 deitada) ----
  if (dre) {
    let p = pags[1].replace('<section class="pag">', '<section class="pag pag-h">');
    const P = dre.parametros, T = dre.total, M = dre.meses, ult = M[MESES_DRE - 1];
    // valores sem centavos nas colunas dos meses (cabem 11 colunas); o resumo abaixo da tabela mostra os centavos
    const v0 = (x: number) => (Math.round(x) < 0 ? "−" : "") + N(Math.abs(Math.round(x)));
    const L = (t: string, f: (m: (typeof M)[number] | typeof T) => number, c: "s" | "t" = "s", q = false) =>
      `<tr class="${c}"><td>${t}</td>${[...M, T].map((m) => `<td>${q ? N(f(m)) : v0(f(m))}</td>`).join("")}</tr>`;
    const outras = (m: { despesas: { valor: number }[] }) => m.despesas.slice(1).reduce((s, x) => s + x.valor, 0);
    const linhas = [
      ...(hb ? [L("Laudos de vistoria cautelar", (m) => m.cautelares, "s", true)]
        : [L("Laudos Detran (transferência)", (m) => m.transferencias, "s", true), L("Laudos cautelares", (m) => m.cautelares, "s", true)]),
      L(hb ? `Receita bruta (laudos × ${R0(d.ticketCautelar)})` : `Receita bruta (Detran ${R0(d.ticketDetran)} · cautelar ${R0(d.ticketCautelar)})`, (m) => m.receitaBruta, "t"),
      L(`(−) Impostos (${N(P.impostosPercentual)}% da receita bruta)`, (m) => m.impostos), L("Receita líquida", (m) => m.receitaLiquida, "t"),
      ...(hb ? [L(`(−) Custo da pesquisa (${R0(P.custoPesquisaCautelar)} por laudo)`, (m) => m.custoPesquisa), L("(−) Marketing (mensal)", (m) => m.marketing)]
        : [L(`(−) Custo do laudo (Detran ${R0(P.custoDetranPorVistoria)} + pesquisa ${R0(P.custoPesquisaCautelar)})`, (m) => m.custoDetran + m.custoPesquisa),
           L(`(−) Marketing (${R0(P.marketingPorTransferencia)} por vistoria Detran)`, (m) => m.marketing)]),
      L("(−) Parcela da franquia", (m) => m.parcela), L(`(−) Royalties (${R0(P.royaltiesPorLaudo)} por laudo)`, (m) => m.royalties),
      `<tr class="s"><td>Funcionários</td>${M.map((m) => `<td>${N(m.pessoas)}</td>`).join("")}<td>—</td></tr>`,
      L(`(−) Pessoal (${R0(P.salario)} + ${N(P.encargosPercentual)}% de encargos)`, (m) => m.cpTotal),
      // como no modelo aprovado: aluguel em linha própria e as outras 11 despesas fixas somadas (detalhe linha a linha na tela)
      L("(−) Aluguel", (m) => m.despesas[0].valor), L("(−) Outras despesas fixas", outras),
      L("Resultado operacional", (m) => m.ebitda, "t"),
      `<tr class="s"><td>Margem sobre a receita líquida</td>${[...M, T].map((m) => `<td>${formatarPercentual(m.margem)}</td>`).join("")}</tr>`,
    ];
    p = troca(p, /(<div class="dre-cab"><h2>(?:<svg[\s\S]*?<\/svg>)?)DRE mensal simulado/, "$1DRE simulado em 10 meses");
    p = troca(p, /<div class="cen">(<svg[\s\S]*?<\/svg>)?<span>[\s\S]*?<\/span><\/div>/, `<div class="cen">$1<span>DRE simulado <b>mês a mês</b> · <b>${N(T.transferencias + T.cautelares)} laudos em 10 meses</b>${d.exemplo ? " · valores de EXEMPLO" : ""}</span></div>`);
    p = troca(p, /<p class="prem"><b>Volume da unidade[\s\S]*?<\/p>/, hb
      ? `<p class="prem"><b>Volume de cada mês${d.exemplo ? " (EXEMPLO)" : ""}:</b> laudos de vistoria cautelar informados no painel, mês a mês. Valores em R$, sem centavos; o total soma os 10 meses.</p>`
      : `<p class="prem"><b>Volume de cada mês${d.exemplo ? " (EXEMPLO)" : ""}:</b> laudos Detran e cautelares informados no painel, mês a mês (padrão: colunas da planilha de referência, do mês 1 com ${N(M[0].transferencias)} + ${N(M[0].cautelares)} ao mês 10 com ${N(ult.transferencias)} + ${N(ult.cautelares)}). O DRE não usa o potencial da cidade da seção Relatório. Valores em R$, sem centavos; o total soma os 10 meses.</p>`);
    p = troca(p, /(<table class="dre"><thead>)[\s\S]*?(<\/thead><tbody>)[\s\S]*?(<\/tbody><\/table>)/, `$1<tr><th>Linha</th>${M.map((_, i) => `<th>Mês ${i + 1}</th>`).join("")}<th>Total 10 meses</th></tr>$2${linhas.join("")}$3`);
    p = troca(p, /(<div class="res[^"]*">)[\s\S]*?<div class="est">[^<]*<\/div><\/div>/, `$1<div><span>Resultado operacional simulado em 10 meses${ex}</span><b>${sg(T.ebitda)}</b></div><div><span>Margem sobre a receita líquida · mês 10: ${sg(ult.ebitda)}</span><b>${formatarPercentual(T.margem)}</b></div><div class="est">${T.ebitda < 0 ? "Resultado negativo" : "Resultado positivo"}</div></div>`);
    p = troca(p, /<p class="prem">Fórmulas:[\s\S]*?<\/p>/, `<p class="prem">Fórmulas (cada mês): receita bruta = ${hb ? "laudos × preço do laudo" : "laudos × ticket por tipo"}; impostos = ${N(P.impostosPercentual)}% da receita bruta; receita líquida = bruta − impostos; resultado = líquida − custos variáveis − parcela − royalties − pessoal − despesas fixas; margem = resultado ÷ receita líquida. Pessoal = arredondar para cima(laudos do mês ÷ ${N(P.laudosPorFuncionario)}) funcionários × (salário + ${N(P.encargosPercentual)}% de encargos); royalties = laudos × ${R0(P.royaltiesPorLaudo)}. Total = soma dos 10 meses; margem total = resultado total ÷ receita líquida total. Premissas editáveis no painel.</p>`);
    if (!d.exemplo) p = p.replace(/ <span class="tag-ex">EXEMPLO<\/span>/g, "");
    pags[1] = p;
  }

  // ---- página de contatos/entregáveis ----
  let pc = pags[total - 1];
  const parc = d.oferta.parcelamento;
  pc = troca(pc, /<div class="of">[\s\S]*?<\/div><\/div>\s*<p>[^<]*<\/p>/, `<div class="of${parc ? "" : " of-2"}">
<div><span>Taxa total</span><b>${R0(d.oferta.valorFranquia)}</b></div><div><span>Entrada</span><b>${R0(d.oferta.entrada)}</b></div>${parc ? `<div><span>Parcelas</span><b>${d.oferta.numeroParcelas} × ${R0(d.oferta.valorParcela)}</b></div>` : ""}</div>
${d.oferta.texto?.trim() ? `<p>${esc(d.oferta.texto)}</p>` : ""}`);
  pc = pc.replace(/<p class="prem" style="margin-top:2mm">Condição comercial[^<]*<\/p>/, `<p class="prem" style="margin-top:2mm">Condição comercial como digitada no painel${d.exemplo ? " (editável); valores padrão do formulário atual, usados como EXEMPLO" : ""}.</p>`);
  pc = troca(pc, /(<ul class="entreg">)[\s\S]*?(<\/ul>)/, `$1${[...ENTREGAVEIS_BASE, ...(hb ? [] : ENTREGAVEIS_FULL_EXTRA)].map((e) => `<li><i></i>${esc(e)}</li>`).join("")}$2`);
  pc = troca(pc, /(<table class="fontes"><thead>[\s\S]*?<\/thead><tbody>)[\s\S]*?(<\/tbody><\/table>)/, `$1
<tr><td>Frota de veículos</td><td>Senatran — Frota por município e tipo</td><td>Setembro/2026</td></tr>
<tr><td>População</td><td>IBGE — Estimativa da população 2025</td><td>1º/07/2025</td></tr>
${hb ? `${d.ecvs ? `<tr><td>Concorrentes (cautelar)</td><td>Informado pelo usuário</td><td>Data do estudo</td></tr>` : ""}<tr><td>Volume e preço do laudo</td><td>Informados no painel (editáveis)</td><td>${N(d.laudosHomeBased!)} laudos/mês · ${R0(d.ticketCautelar)}</td></tr>`
  : `<tr><td>ECVs concorrentes</td><td>${d.ecvs ? "Informado pelo usuário" : "Não informado (opcional)"}</td><td>Data do estudo</td></tr><tr><td>Tickets, divisão e cenário</td><td>Parâmetros do estudo (editáveis)</td><td>Detran ${R0(d.ticketDetran)} · cautelar ${R0(d.ticketCautelar)} · ${N(d.percentualDetran)}/${N(100 - d.percentualDetran)} · ${NOME_CEN[d.cenario]} ${N(d.percentuais[d.cenario])}%</td></tr>`}$2`);
  if (!d.exemplo) pc = pc.replace(/<p class="prem">Neste modelo, população e frota[^<]*<\/p>/, "");
  pags[total - 1] = pc;

  // numeração das seções
  let n = 0;
  pags = pags.map((p) => p.replace(/<div class="sec"><span>\d+<\/span>/g, () => `<div class="sec"><span>${++n}</span>`));
  if (hb) pags = pags.map((p) => p.replace(/<div class="sec"><span>(\d+)<\/span>DRE<\/div>/, '<div class="sec"><span>$1</span>DRE</div>'));

  return `<!doctype html><html lang="pt-BR" data-marca="${d.marca}"><head><meta charset="utf-8"><title>Estudo de praça ${esc(d.cidade)}/${esc(d.uf)} · ${nomeMarca}</title><style>${estilo(d.marca)}${comDre ? CSS_DRE_MESES : ""}</style></head><body>${base.sprite}${hb && comDre ? "" : ""}${pags.join("")}</body></html>`;
}
