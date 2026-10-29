# ADR-0005: DRE em 10 meses, com as colunas da planilha como meses

## Status
Aceito (versão 0.3.0)

## Data
2026-10-29

## Contexto
O escopo v2.0 (seção 7.6, M9) previa um DRE de um único mês, com o volume digitado em "Laudos/mês da unidade". O Otávio usa a planilha de referência (`dre-auto-visao.xlsx`, colunas D–M) como uma progressão mês a mês e pediu que as 10 colunas virem os meses 1 a 10.

## Decisão (Otávio, 29/10/2026)
- O DRE mostra 10 meses lado a lado e o total. Cada mês é o DRE mensal de sempre (`calcularDre`), com o volume daquele mês (`calcularDreMeses` em `lib/calculo.ts`).
- Volumes do Full: os da planilha, coluna a coluna (transferência 100 → 550, cautelar 10 → 100), editáveis mês a mês no painel. Não se usa a divisão 90/10 no DRE.
- Home Based: mesma estrutura, só com laudos cautelares; cada mês começa com os laudos/mês informados (a planilha não tem esse modelo; curva de crescimento [A CONFIRMAR]).
- Pessoal: continua a regra TETO(laudos do mês ÷ 200), mínimo 1 (a planilha digita as pessoas).
- PDF: a página do DRE sai em A4 deitada (`@page horizontal`), com o visual da Julia e só os tamanhos ajustados (`CSS_DRE_MESES` em `lib/relatorio.ts`). Valores dos meses sem centavos; resumo com centavos.
- API: `mesesDre` (10 itens, opcional) substitui `laudosUnidade`.

## Alternativas consideradas
- **Volume do mês 10 como meta e crescimento em linha reta**: exigiria inventar o volume inicial.
- **Divisão 90/10 sobre o total de cada mês**: não reproduziria a planilha.
- **Página em pé com letra menor, ou resumo no PDF**: ilegível ou incompleto.

## Consequências
O exemplo de aceite de 400 laudos (R$ 38.783,80; 64,35%) continua valendo como um mês (`calcularDre`), mas o relatório padrão de Joinville passa a mostrar R$ 369.405,00 em 10 meses (margem 62,21%). A página do DRE não tem prévia da Julia; a comparação visual dessa página deixa de valer até haver modelo novo.
