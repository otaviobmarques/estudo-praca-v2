/**
 * Comportamento da tela aprovada (porta de design/tela/app.js da Julia para TypeScript),
 * ligado à API: busca de município, "Sobre a rede", prévia e geração de PDF/PNG no servidor.
 * Os cálculos vêm de lib/calculo.ts (os mesmos do PDF e dos testes).
 */
import { PADROES, padroesDre, calcularPotencial, calcularHomeBased, calcularDreMeses, volumesPadraoMeses, MESES_DRE, conferirOferta, type Modelo, type Cenario, type ParametrosDre, type VolumeMes } from "@/lib/calculo";

const ENTREGAVEIS_BASE = ["Suporte na abertura do CNPJ", "Treinamento", "Marketing", "Jurídico", "Sistema de montagem de laudos", "Suporte técnico", "Back office comercial"];
const ENTREGAVEIS_FULL_EXTRA = ["Todo o processo de credenciamento no DETRAN", "Sistema ECV Vistoria DETRAN", "Câmeras e leitores de biometria em comodato, quando o DETRAN exigir"];
const TEXTO: Record<Modelo, string> = {
  full: "Entrada inclui:\nKit de Câmeras e Biometria homologados pelo DETRAN\nProjeto Arquitetônico\n2 Vagas de Treinamento\nSistema e App de Laudos",
  home_based: "10 parcelas sem juros. Atendimento móvel, sem ponto fixo.",
};
const ROTULO: Record<Modelo, string> = { full: "Franquia Full · Completa", home_based: "Franquia Home Based · Atendimento Móvel" };
const LOGO = { "auto-visao": ["/auto-visao_logo-oficial_branco-integral.svg", "Auto Visão"], royal: ["/royal-logo-horizontal-fundo-escuro.svg", "Royal Vistorias"] } as const;
const CENS: Cenario[] = ["conservador", "provavel", "otimista"]; const NOMES = ["conservador", "provável", "otimista"];
const FIXAS: [string, keyof ParametrosDre["despesasFixas"]][] = [["d-alu", "aluguel"], ["d-agua", "agua"], ["d-ener", "energia"], ["d-net", "internetTelefonia"], ["d-cont", "contabilidade"], ["d-manu", "manutencaoPredial"], ["d-mat", "materialEscritorio"], ["d-imps", "impressoes"], ["d-film", "sistemaFilmagem"], ["d-ouv", "canalOuvidoria"], ["d-iso", "certificacaoIsoSeguros"], ["d-ger", "despesasGerais"]];
const VAR: [string, Exclude<keyof ParametrosDre, "despesasFixas">][] = [["d-imp", "impostosPercentual"], ["d-roy", "royaltiesPorLaudo"], ["d-mkt", "marketingPorTransferencia"], ["d-mkth", "marketingMensal"], ["d-cdet", "custoDetranPorVistoria"], ["d-ccau", "custoPesquisaCautelar"], ["d-parc", "parcelaFranquia"], ["d-lpf", "laudosPorFuncionario"], ["d-sal", "salario"], ["d-enc", "encargosPercentual"]];
type Rede = { marca: string; destaque: string | null; lojas: string; estados: string; laudos_mes: string; frase_full: string; frase_home_based: string };

const $ = <T extends HTMLElement = HTMLInputElement>(id: string) => document.getElementById(id) as T;
const n = (v: string) => Number(String(v).replace(/\./g, "").replace(",", ".")) || 0;
const vazio = (id: string) => $(id).value.trim() === "";
const fi = (v: number) => Math.round(v).toLocaleString("pt-BR");
const fd = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const brl2 = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const sg = (v: number) => (Math.round(v * 100) < 0 ? "− " + brl2(-v) : brl2(Math.abs(v)));
const pc = (v: number, b: number) => (b ? (Math.abs(v / b) < 0.00005 ? 0 : (v / b) * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%" : "—");
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function iniciarPainel(opts: { admin: boolean }) {
  const doc = document.documentElement;
  let MODELO: Modelo = "full", MARCA: "auto-visao" | "royal" = "auto-visao", CEN = 1, EXEMPLO = false, REDE: Record<string, Rede> = {};
  if (opts.admin) $("l-admin").hidden = false;
  $("l-sair").onclick = async (e) => { e.preventDefault(); await fetch("/api/v1/sessoes", { method: "DELETE" }); location.href = "/entrar"; };

  const aplicarPadroesDre = () => { const p = padroesDre(MODELO); VAR.forEach(([id, k]) => ($(id).value = fd(p[k] as number))); FIXAS.forEach(([id, k]) => ($(id).value = fd(p.despesasFixas[k]))); };
  const lerDre = (): ParametrosDre => ({ ...Object.fromEntries(VAR.map(([id, k]) => [k, n($(id).value)])), despesasFixas: Object.fromEntries(FIXAS.map(([id, k]) => [k, n($(id).value)])) } as ParametrosDre);
  // DRE em 10 meses: Full começa com os volumes da planilha; no Home Based, mês em branco = laudos/mês informados
  const MESES = Array.from({ length: MESES_DRE }, (_, i) => i + 1);
  const aplicarVolumes = () => { const v = volumesPadraoMeses(MODELO); MESES.forEach((i) => { $(`d-m${i}-t`).value = MODELO === "full" ? fi(v[i - 1].transferencias) : ""; $(`d-m${i}-c`).value = MODELO === "full" ? fi(v[i - 1].cautelares) : ""; }); };
  const lerMeses = (hb: boolean, laudosHb: number | null): VolumeMes[] => MESES.map((i) => ({
    transferencias: hb ? 0 : n($(`d-m${i}-t`).value),
    cautelares: vazio(`d-m${i}-c`) ? (hb ? laudosHb ?? 0 : 0) : n($(`d-m${i}-c`).value),
  }));
  const aplicarOferta = () => { const o = PADROES.oferta[MODELO]; $("f-parc-on").checked = true; $("f-taxa").value = fi(o.valorFranquia); $("f-ent").value = fi(o.entrada); $("f-np").value = String(o.numeroParcelas); $("f-vp").value = fi(o.valorParcela); ($("f-txt") as unknown as HTMLTextAreaElement).value = TEXTO[MODELO]; };

  function estado() {
    const p = CENS.map((_, i) => n($(`f-c${i + 1}`).value));
    const laudosHomeBased = vazio("f-lhb") ? null : n($("f-lhb").value);
    return {
      marca: MARCA, modelo: MODELO, cidade: $("f-cidade").value.trim(), uf: ($("f-uf") as unknown as HTMLSelectElement).value,
      populacao: n($("f-pop").value), frota: n($("f-frota").value), cenario: CENS[CEN],
      percentuais: { conservador: p[0], provavel: p[1], otimista: p[2] }, percentualDetran: n($("f-pd").value),
      ticketDetran: n($("f-td").value), ticketCautelar: n($("f-tc").value), ecvs: vazio("f-ecv") ? null : n($("f-ecv").value),
      laudosHomeBased, incluirDre: $("d-on").checked, mesesDre: lerMeses(MODELO === "home_based", laudosHomeBased),
      oferta: { valorFranquia: n($("f-taxa").value), entrada: n($("f-ent").value), parcelamento: $("f-parc-on").checked, numeroParcelas: n($("f-np").value), valorParcela: n($("f-vp").value), texto: ($("f-txt") as unknown as HTMLTextAreaElement).value },
      exemplo: EXEMPLO, dre: lerDre(),
    };
  }

  function renderRede() {
    const r = REDE[MARCA]; if (!r) return; const ic = ["concorrentes", "cidade", "laudos"], nums = [[r.lojas, "lojas"], [r.estados, "estados"], [r.laudos_mes, "laudos/mês"]];
    $("r-rede").innerHTML = `<div class="rede-txt"><h3><svg class="ic"><use href="#ic-marca"/></svg>Sobre a rede</h3>${r.destaque ? `<p class="rede-tit">${esc(r.destaque)}</p>` : ""}<p class="rede-conf">${esc(MODELO === "home_based" ? r.frase_home_based : r.frase_full)}</p></div>
    <div class="rede-nums">${nums.map(([a, b], i) => `<div class="rn"><svg class="ic"><use href="#ic-${ic[i]}"/></svg><b>${esc(a)}</b><span>${b}</span></div>`).join("")}</div>`;
  }

  function render() {
    const e = estado(), hb = MODELO === "home_based";
    $("f-pc").value = (100 - e.percentualDetran).toLocaleString("pt-BR");
    CENS.forEach((c, i) => ($(`s-c${i + 1}`).textContent = e.percentuais[c].toLocaleString("pt-BR") + "%"));
    doc.classList.toggle("sem-exemplo", !EXEMPLO); $("r-marca-dagua").hidden = !EXEMPLO; $("r-selo-ex").hidden = !EXEMPLO;
    $("r-cen-nome").textContent = NOMES[CEN]; $("r-cen-pct").textContent = e.percentuais[e.cenario].toLocaleString("pt-BR") + "%";
    $("r-cidade").innerHTML = e.cidade ? `${esc(e.cidade)} <span>/ ${esc(e.uf)}</span>` : "Escolha a cidade";
    $("r-pop").textContent = e.populacao ? fi(e.populacao) : "—"; $("r-frota").textContent = e.frota ? fi(e.frota) : "—";
    $("r-modelo").textContent = ROTULO[MODELO];
    $("r-ent-tit").textContent = hb ? "O que a franquia Home Based entrega" : "O que a franquia Full entrega";
    $("r-entreg").innerHTML = [...ENTREGAVEIS_BASE, ...(hb ? [] : ENTREGAVEIS_FULL_EXTRA)].map((x) => `<li><svg class="ic"><use href="#ic-marca"/></svg>${x}</li>`).join("");
    $("rl-ecv").textContent = hb ? "Concorrentes (cautelar)" : "ECVs concorrentes"; $("l-ecv").textContent = hb ? "Concorrentes de vistoria cautelar" : "ECVs concorrentes";
    $("r-ecv").textContent = e.ecvs ? fi(e.ecvs) : "—";
    // oferta (v1.6): alerta só informativo
    const of = conferirOferta(e.oferta); $("g-parc").hidden = !e.oferta.parcelamento; $("r-parc-box").hidden = !e.oferta.parcelamento;
    $("r-taxa").textContent = brl(e.oferta.valorFranquia); $("r-ent").textContent = brl(e.oferta.entrada); $("r-parc").textContent = `${e.oferta.numeroParcelas} × ${brl(e.oferta.valorParcela)}`;
    $("o-alerta").hidden = of.fecha; $("o-alerta-txt").textContent = of.alerta ?? ""; { const l = (e.oferta.texto ?? "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
      $("r-txt").innerHTML = l.length > 1 ? `${esc(l[0])}<ul class="of-lista">${l.slice(1).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : esc(l[0] ?? ""); }
    if (hb) {
      const r = calcularHomeBased({ laudosMes: e.laudosHomeBased, ticketCautelar: e.ticketCautelar }), tr = "—";
      $("hb-alerta").hidden = r.pronto; $("f-lhb-box").classList.toggle("erro", !r.pronto); $("f-lhb").setAttribute("aria-invalid", String(!r.pronto));
      $("r-lm").textContent = r.pronto ? fi(r.laudosMes) : tr; $("r-lm-f").textContent = r.pronto ? "Informado no painel" : "Aguardando laudos/mês";
      $("r-ld").textContent = r.pronto ? fi(r.laudosDia) : tr; $("r-fm").textContent = r.pronto ? brl(r.faturamentoMes) : tr; $("r-fa").textContent = r.pronto ? brl(r.faturamentoAno) : tr;
      $("rl-div").textContent = "Preço do laudo"; $("r-div").textContent = brl(e.ticketCautelar); $("r-div-f").textContent = "Vistoria cautelar · editável"; $("r-fpe").textContent = e.ecvs ? "Informado pelo usuário" : "Não informado · opcional";
      $("r-tab-tit").textContent = "Potencial de vistoria · atendimento móvel";
      $("r-tab").innerHTML = !r.pronto ? `<tbody><tr><td>Informe os laudos/mês no painel para calcular o estudo.</td></tr></tbody>` : `<thead><tr><th>Serviço</th><th>Laudos/mês</th><th>Laudos/dia útil</th><th>Ticket</th><th>Faturamento bruto/mês*</th></tr></thead><tbody><tr><td>Vistoria cautelar · atendimento móvel</td><td>${fi(r.laudosMes)}</td><td>${fi(r.laudosDia)}</td><td>${brl(e.ticketCautelar)}</td><td>${brl(r.faturamentoMes)}</td></tr><tr class="total"><td>Faturamento bruto anual*</td><td></td><td></td><td></td><td>${brl(r.faturamentoAno)}</td></tr></tbody>`;
    } else {
      let x; try { x = calcularPotencial({ frota: e.frota, percentualFrota: e.percentuais[e.cenario], percentualDetran: e.percentualDetran, ticketDetran: e.ticketDetran, ticketCautelar: e.ticketCautelar, ecvs: e.ecvs }); } catch { x = calcularPotencial({ frota: 0, percentualFrota: 0 }); }
      $("rl-div").textContent = "Divisão da demanda"; $("r-div-f").textContent = "Detran / cautelar"; $("r-tab-tit").textContent = "Laudos e faturamento por tipo de vistoria";
      $("r-lm").textContent = fi(x.laudosMes); $("r-lm-f").textContent = `${fi(x.detran)} Detran · ${fi(x.cautelar)} cautelar`; $("r-ld").textContent = fi(x.laudosDia);
      $("r-fm").textContent = brl(x.faturamentoMes); $("r-fa").textContent = brl(x.faturamentoAno); $("r-div").textContent = `${fd(e.percentualDetran)}% / ${fd(100 - e.percentualDetran)}%`;
      $("r-fpe").textContent = x.frotaPorEcv ? `${fi(x.frotaPorEcv)} veículos e ${fi(x.laudosPorEcv!)} laudos/mês por ECV` : "Não informado · opcional";
      $("r-tab").innerHTML = `<thead><tr><th>Tipo de vistoria</th><th>Laudos/mês</th><th>Laudos/dia útil</th><th>Ticket</th><th>Faturamento bruto/mês*</th></tr></thead><tbody>
      <tr><td>Detran (${fd(e.percentualDetran)}%)</td><td>${fi(x.detran)}</td><td>${fi(x.detranDia)}</td><td>${brl(e.ticketDetran)}</td><td>${brl(x.faturamentoDetran)}</td></tr>
      <tr><td>Cautelar (${fd(100 - e.percentualDetran)}%)</td><td>${fi(x.cautelar)}</td><td>${fi(x.cautelarDia)}</td><td>${brl(e.ticketCautelar)}</td><td>${brl(x.faturamentoCautelar)}</td></tr>
      <tr class="total"><td>Total</td><td>${fi(x.laudosMes)}</td><td>${fi(x.laudosDia)}</td><td>—</td><td>${brl(x.faturamentoMes)}</td></tr></tbody>`;
    }
    // DRE em 10 meses (Full e Home Based): chave desligada por padrão
    const on = e.incluirDre, semMeses = !e.mesesDre.some((v) => v.transferencias + v.cautelares > 0), faltaFull = !hb && on && semMeses;
    if (hb) MESES.forEach((i) => ($(`d-m${i}-c`).placeholder = e.laudosHomeBased ? fi(e.laudosHomeBased) : ""));
    $("d-req").hidden = !on; $("d-alerta").hidden = !faltaFull;
    $("d-alerta-hb").hidden = !(hb && on && !e.laudosHomeBased);
    const bloco = $("r-dre-bloco"); bloco.hidden = !on;
    if (on) {
      if ((hb && !e.laudosHomeBased) || semMeses) { $("r-dre-vol").textContent = hb ? "Aguardando os laudos/mês do Home Based." : "Aguardando os laudos dos 10 meses."; $("r-dre").innerHTML = ""; $("r-res").innerHTML = ""; }
      else {
        const { meses: M, total: T } = calcularDreMeses({ meses: e.mesesDre, ticketDetran: e.ticketDetran, ticketCautelar: e.ticketCautelar, parametros: e.dre, modelo: MODELO });
        const v0 = (x: number) => (Math.round(x) < 0 ? "−" : "") + fi(Math.abs(x));
        const L = (t: string, f: (m: (typeof M)[number] | typeof T) => number, c = "sub", q = false) =>
          `<tr class="${c}"><td>${t}</td>${[...M, T].map((m) => `<td>${q ? fi(f(m)) : v0(f(m))}</td>`).join("")}</tr>`;
        const outras = (m: { despesas: { valor: number }[] }) => m.despesas.slice(1).reduce((s, x) => s + x.valor, 0);
        $("r-dre-vol").textContent = `${fi(T.transferencias + T.cautelares)} laudos em 10 meses${hb ? " de vistoria cautelar" : ` (${fi(T.transferencias)} Detran + ${fi(T.cautelares)} cautelar)`}. Valores em R$, sem centavos. O DRE não usa o potencial da cidade mostrado acima.`;
        $("r-dre").innerHTML = `<thead><tr><th>Linha</th>${MESES.map((i) => `<th>Mês ${i}</th>`).join("")}<th>Total</th></tr></thead><tbody>` +
          (hb ? L("Laudos de vistoria cautelar", (m) => m.cautelares, "sub", true) : L("Laudos Detran", (m) => m.transferencias, "sub", true) + L("Laudos cautelares", (m) => m.cautelares, "sub", true)) +
          L("Receita bruta", (m) => m.receitaBruta, "total") + L("(−) Impostos", (m) => m.impostos) + L("Receita líquida", (m) => m.receitaLiquida, "total") +
          (hb ? "" : L("(−) Custo Detran por vistoria", (m) => m.custoDetran)) + L("(−) Custo da pesquisa (cautelar)", (m) => m.custoPesquisa) + L(hb ? "(−) Marketing (mensal)" : "(−) Marketing", (m) => m.marketing) +
          L("(−) Parcela da franquia", (m) => m.parcela) + L("(−) Royalties", (m) => m.royalties) + L("Custos variáveis — total", (m) => m.cvTotal, "total") +
          `<tr class="sub"><td>Funcionários</td>${M.map((m) => `<td>${fi(m.pessoas)}</td>`).join("")}<td>—</td></tr>` +
          L("(−) Pessoal (salários + encargos)", (m) => m.cpTotal) + L("(−) Aluguel", (m) => m.despesas[0].valor) + L("(−) Outras despesas fixas", outras) +
          L("Despesas fixas — total", (m) => m.totalDespesas, "total") + L("Resultado operacional (EBITDA)", (m) => m.ebitda, "total") +
          `<tr class="sub"><td>Margem (receita líquida)</td>${[...M, T].map((m) => `<td>${pc(m.ebitda, m.receitaLiquida)}</td>`).join("")}</tr></tbody>`;
        $("r-res").innerHTML = `<span>Resultado operacional simulado em 10 meses<br><small>Margem ${pc(T.ebitda, T.receitaLiquida)} da receita líquida · mês 10: ${sg(M[MESES_DRE - 1].ebitda)}</small></span><b>${sg(T.ebitda)}</b><span class="estado">${T.ebitda < 0 ? "Resultado negativo" : "Resultado positivo"}</span>`;
      }
    }
    // bloqueio do PDF/PNG
    const motivo = !e.cidade ? "Escolha a cidade" : hb && !e.laudosHomeBased ? "Preencha os laudos/mês do Home Based" : faltaFull ? "Preencha os laudos dos 10 meses ou desligue o DRE" : "";
    for (const b of ["b-pdf", "b-png"]) { ($(b) as unknown as HTMLButtonElement).disabled = !!motivo; $(b).title = motivo; }
  }

  function modelo(m: Modelo) {
    MODELO = m; doc.dataset.modelo = m === "home_based" ? "hb" : "full";
    document.querySelectorAll(".seletor-modelo button").forEach((b) => b.setAttribute("aria-checked", String((b as HTMLElement).dataset.mod === doc.dataset.modelo)));
    aplicarOferta(); aplicarPadroesDre(); aplicarVolumes(); $("d-on").checked = false; renderRede(); render();
  }
  function marca(m: "auto-visao" | "royal") {
    MARCA = m; doc.dataset.marca = m; ($("logo") as unknown as HTMLImageElement).src = LOGO[m][0]; ($("logo") as unknown as HTMLImageElement).alt = LOGO[m][1];
    document.querySelectorAll(".seletor-marca button").forEach((b) => b.setAttribute("aria-pressed", String((b as HTMLElement).dataset.m === m))); renderRede(); render();
  }
  function cenario(i: number) { CEN = i; document.querySelectorAll(".seletor-cenario button").forEach((b) => b.setAttribute("aria-checked", String((b as HTMLElement).dataset.c === String(i)))); render(); }
  function definirCidade(c: { nome: string; uf: string; populacao: number; frota: number } | null, exemplo = false) {
    const uf = $("f-uf") as unknown as HTMLSelectElement; uf.innerHTML = `<option>${c ? esc(c.uf) : ""}</option>`;
    $("f-cidade").value = c?.nome ?? ""; $("f-pop").value = c ? fi(c.populacao) : ""; $("f-frota").value = c ? fi(c.frota) : ""; EXEMPLO = exemplo; $("selo-ex-base").hidden = !exemplo;
  }
  function padroesEstudo() {
    $("f-td").value = String(PADROES.ticketDetran); $("f-tc").value = String(PADROES.ticketCautelar); $("f-pd").value = String(PADROES.percentualDetran);
    CENS.forEach((c, i) => ($(`f-c${i + 1}`).value = String(PADROES.cenarios[c]).replace(".", ",")));
  }

  // busca de município (≥ 2 letras, até 10; só a seleção confirma)
  const lista = $("f-cidade-lista") as unknown as HTMLUListElement; let tempo: ReturnType<typeof setTimeout>;
  $("f-cidade").addEventListener("input", () => {
    clearTimeout(tempo); const q = $("f-cidade").value.trim(); EXEMPLO = false;
    if (q.length < 2) { lista.hidden = true; return; }
    tempo = setTimeout(async () => {
      const d = await fetch(`/api/v1/municipios?q=${encodeURIComponent(q)}`).then((r) => r.json()).catch(() => ({ itens: [] }));
      lista.innerHTML = d.itens.map((m: { cod_ibge: string; nome: string; uf: string }, i: number) => `<li role="option" id="op-${i}" data-i="${i}" aria-selected="false">${esc(m.nome)} / ${esc(m.uf)}</li>`).join("");
      lista.hidden = !d.itens.length; $("f-cidade").setAttribute("aria-expanded", String(!lista.hidden));
      lista.querySelectorAll("li").forEach((li) => li.addEventListener("mousedown", (ev) => { ev.preventDefault(); definirCidade(d.itens[+(li as HTMLElement).dataset.i!]); lista.hidden = true; render(); }));
    }, 200);
  });
  $("f-cidade").addEventListener("blur", () => setTimeout(() => (lista.hidden = true), 150));

  document.querySelectorAll(".seletor-cenario button").forEach((b) => ((b as HTMLElement).onclick = () => cenario(+(b as HTMLElement).dataset.c!)));
  document.querySelectorAll(".seletor-modelo button").forEach((b) => ((b as HTMLElement).onclick = () => modelo((b as HTMLElement).dataset.mod === "hb" ? "home_based" : "full")));
  document.querySelectorAll(".seletor-marca button").forEach((b) => ((b as HTMLElement).onclick = () => marca((b as HTMLElement).dataset.m as "auto-visao" | "royal")));
  document.querySelectorAll(".painel input:not(#f-cidade), .painel textarea").forEach((i) => i.addEventListener("input", render));
  $("d-padrao").onclick = () => { aplicarPadroesDre(); aplicarVolumes(); render(); };
  $("b-exemplo").onclick = () => { definirCidade({ nome: "Joinville", uf: "SC", populacao: 664541, frota: 498378 }, true); padroesEstudo(); $("f-ecv").value = "";
    if (MODELO === "full") { $("d-on").checked = true; aplicarVolumes(); } else $("f-lhb").value = "200"; render(); };
  $("b-limpar").onclick = () => { definirCidade(null); padroesEstudo(); $("f-ecv").value = ""; $("f-lhb").value = ""; $("d-on").checked = false; aplicarOferta(); aplicarPadroesDre(); aplicarVolumes(); render(); };
  async function baixar(formato: "pdf" | "png") {
    const b = $(formato === "pdf" ? "b-pdf" : "b-png") as unknown as HTMLButtonElement; b.disabled = true;
    try {
      const r = await fetch(`/api/v1/relatorios${formato === "png" ? "?formato=png" : ""}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(estado()) });
      if (!r.ok) { alert((await r.json().catch(() => ({}))).detail ?? "Não foi possível gerar o arquivo."); return; }
      const url = URL.createObjectURL(await r.blob()); const a = document.createElement("a");
      a.href = url; a.download = r.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1] ?? `estudo.${formato}`; a.click(); URL.revokeObjectURL(url);
    } finally { b.disabled = false; render(); }
  }
  $("b-pdf").onclick = () => baixar("pdf"); $("b-png").onclick = () => baixar("png");

  fetch("/api/v1/rede").then((r) => r.json()).then((d) => { REDE = Object.fromEntries((d.itens ?? []).map((x: Rede) => [x.marca, x])); renderRede(); });
  definirCidade(null); padroesEstudo(); $("f-ecv").value = ""; modelo("full"); marca("auto-visao"); cenario(1);
}
