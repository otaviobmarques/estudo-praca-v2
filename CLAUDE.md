# CLAUDE.md — Gerador de Estudo de Praça v2 (Auto Visão e Royal)

Guia para o Claude Code trabalhar neste repositório. Leia inteiro antes de qualquer mudança. Responda e escreva **em português do Brasil**.

## 1. Visão do projeto
Sistema interno da **Domma Tecnologia** para o Otávio Marques e as equipes de expansão. Em segundos, gera o **estudo de potencial de uma cidade** para um candidato a franqueado, na marca escolhida (**Auto Visão** ou **Royal Vistorias**) e no modelo escolhido (**Full** ou **Home Based**), e baixa o relatório em **PDF A4** (ou PNG da 1ª página).
- Acesso com usuário e senha (sem cadastro público). Papéis: `usuario` e `administrador` (Otávio).
- **Nenhum estudo é guardado**: tudo é calculado na hora. O banco guarda só usuários, sessões, tentativas, links de redefinição e "Sobre a rede".
- Base oficial **embutida**: frota Senatran set/2026 + Estimativa IBGE 2025 (5.571 municípios), em `dados/municipios.json`.

## 2. Pilha
- **Next.js 16** (App Router, Turbopack) + **TypeScript** + React 19. API em `app/api/v1/**/route.ts`.
- **Postgres 17** (Docker), acesso com `pg` e migrações SQL próprias (`db/migracoes/`, `scripts/migrar.mjs`).
- **Argon2id** (`@node-rs/argon2`: memória 19456 KiB, tempo 2, paralelismo 1); sessões opacas em cookie `sessao` (HttpOnly, SameSite=Lax, Secure em produção), no banco só o SHA-256.
- **zod** na fronteira; erros em **Problem Details (RFC 9457)** via `lib/http.ts`.
- **PDF/PNG** com `puppeteer-core` + Chrome/Chromium no servidor, **JavaScript desligado** na renderização.
- Testes: **vitest** (unitários) + `tests/integracao/fumaca.sh` (contra o servidor). Comparação visual: Python + Playwright + Pillow.

## 3. Comandos
```bash
npm install                      # dependências
cp .env.example .env             # preencha os <SENHA> com valores aleatórios (openssl rand -hex 16); nunca versione o .env
sudo docker compose up -d        # Postgres local (porta 5433)  — ou: npm run db:up
npm run db:migrate               # aplica db/migracoes/*.sql
npm run admin:criar -- <usuario> <email> "<Nome>"   # 1º administrador; a senha é pedida sem eco
npm run dev                      # desenvolvimento (http://localhost:3000)
npm run build && npm start       # produção local
npm test                         # testes unitários (vitest) — precisam passar sempre
npm run typecheck                # tsc --noEmit — sem erros
SENHA_ARQ=<arquivo-com-a-senha> BASE=http://localhost:3000 bash tests/integracao/fumaca.sh   # integração (0 falhas)
npx tsx scripts/gerar-exemplos.ts        # regenera os 8 PDFs de docs/exemplos/
python3 scripts/comparar_previas.py      # compara os PDFs com as prévias da Julia (docs/comparacao/)
SENHA_ARQ=<arquivo> python3 scripts/capturar_tela.py    # compara a tela com as prévias da Julia
python3 scripts/montar_tela.py           # regenera modelos/tela/painel.html a partir da tela da Julia
npm run base:gerar -- <frota.xlsx> <populacao.xls>      # regenera e valida a base embutida
```
O teste de fumaça provoca o bloqueio de login de propósito no final; antes de rodar de novo, zere o bloqueio no banco local (`update usuarios set falhas_login=0, bloqueado_ate=null; delete from tentativas_ip;`).

## 4. Estrutura de pastas
```
app/                 páginas (entrar, esqueci-senha, redefinir-senha, admin, painel "/") e API /api/v1
  api/v1/            sessoes, senha/pedidos, senha/redefinicoes, municipios, rede, rede/[marca],
                     relatorios (PDF/PNG), relatorios/previa, usuarios, usuarios/[id]
components/          Estudo.tsx (injeta o painel), tela/painel.ts (lógica da tela), Admin.tsx, AdminRede.tsx, MolduraLogin.tsx
lib/                 calculo.ts (TODAS as fórmulas), relatorio.ts (HTML do PDF a partir dos modelos da Julia),
                     pdf.ts, auth.ts, senha.ts, db.ts, http.ts, municipios.ts
modelos/relatorio/<marca>/   full.html, home-based.html, estilo.css (cópias fiéis da Julia — só troque valores)
modelos/tela/        painel.html (gerado), tela.css, tokens.css
dados/               municipios.json, excecoes-nomes.json (36 grafias), dre-referencia-xlsx.json
db/migracoes/        SQL versionado (nunca edite migração já aplicada; crie a próxima)
scripts/             geração de base, exemplos, comparações, migração, criação do admin
tests/               calculo.test.ts, relatorio.test.ts, integracao/fumaca.sh
docs/                openapi.yaml, adr/, exemplos/, comparacao/, manual/capturas/, documentacao-tecnica-*.pdf
```

## 5. Regras invioláveis
1. **Nunca misturar as marcas.** Um PDF/tela da Auto Visão não pode conter nome, logo, cor, contato ou texto da Royal, e vice-versa (há teste para isso). Contatos: Auto Visão Matriz (19) 98366-8000; Royal Vistorias Matriz (19) 98460-7000.
2. **Seguir o guia visual de cada marca** (Design Systems oficiais em `estudo-praca/design/referencias-ds-novo/` e o visual aprovado da Julia, `especificacao.md` v1.7, seção 16). A Royal segue **só** o manual dela (sem #A8460F). Não recrie o visual: edite os modelos HTML/CSS da Julia e mantenha a diferença para as prévias baixa (hoje ≤ 1,2%).
3. **Aviso fixo em todas as páginas** do relatório (e na tela), **mesmo texto nos dois modelos**, não editável (`AVISO_FIXO` em `lib/relatorio.ts`). Não altere o texto sem decisão do Otávio.
4. **Nunca inventar dados.** Número sem fonte vira **[A CONFIRMAR]**. Se faltar base da Senatran ou do IBGE, registre a falta; não estime.
5. **Nunca expor senhas, chaves ou tokens** — nem no código, nem em logs, nem em respostas, nem em documentos. Use `.env` (fora do git) e só `.env.example` com `<SENHA>`. Ao mostrar comandos, troque segredos por `<OCULTO>`.
6. **Não implantar, publicar, apontar domínio, enviar para repositório remoto nem mandar e-mail sem o OK explícito do Otávio.**
7. Home Based **nunca** cita DETRAN, credenciamento nem ECV (há teste).
8. Todo cálculo fica em `lib/calculo.ts` (dinheiro em centavos inteiros no DRE). A tela e o PDF usam as mesmas funções.

## 6. Fórmulas e números de referência (precisam continuar batendo)
**Potencial (Full)** — frota $F$, percentual do cenário $p$ (1,5 / **2** / 2,5%), divisão Detran $\delta$ = 90%, tickets Detran R$ 147 e cautelar R$ 280, 22 dias úteis:
- laudos/mês $L$ = arred($F$ × $p$); Detran = arred($L$ × $\delta$); cautelar = $L$ − Detran; por dia útil = arred($L$ ÷ 22)
- faturamento mensal = Detran × 147 + cautelar × 280; anual = mensal × 12

**Joinville/SC** (população 664.541; frota 498.378):

| Cenário | Laudos/mês | Dia útil | Detran | Cautelar | Fat. mensal |
|---|---|---|---|---|---|
| Conservador 1,5% | 7.476 | 340 | 6.728 | 748 | R$ 1.198.456 |
| **Provável 2%** | **9.968** | **453** | **8.971** | **997** | **R$ 1.597.897** (anual R$ 19.174.764) |
| Otimista 2,5% | 12.459 | 566 | 11.213 | 1.246 | R$ 1.997.191 |

**DRE (Full)** com 400 laudos da unidade (360 Detran + 40 cautelar): receita bruta **R$ 64.120,00**; impostos 6% = R$ 3.847,20; receita líquida R$ 60.272,80; custos variáveis R$ 8.080,00 (pesquisa R$ 25/cautelar, marketing R$ 8/Detran, parcela R$ 1.000, royalties R$ 8/laudo); pessoal R$ 5.100,00 (TETO(400 ÷ 200) = 2 × R$ 1.700 + 50%); despesas fixas R$ 8.309,00; **resultado R$ 38.783,80; margem 64,35% sobre a receita líquida**.

**DRE em 10 meses** (decisão 47, ADR-0005): as colunas D–M da planilha viram os meses 1 a 10 (`calcularDreMeses`); cada mês é o DRE mensal acima. Volumes padrão do Full = planilha (transferência 100 → 550, cautelar 10 → 100), editáveis; pessoal TETO(laudos do mês ÷ 200). Com os padrões: resultado mês 1 R$ 2.661 … mês 10 R$ 70.710; **total R$ 369.405,00, margem 62,21%**. Home Based 200 laudos/mês: 10 × R$ 41.370 = **R$ 413.700,00**. No PDF, a página do DRE é A4 deitada.

**Home Based**: laudos/mês digitados (sugestão 180–250; vazio **bloqueia o PDF**); dia útil = arred(laudos ÷ 22); faturamento = laudos × preço do laudo (R$ 280); anual × 12. Exemplo 200 laudos: **R$ 56.000/mês, R$ 672.000/ano, 9/dia útil**. DRE opcional (chave desligada por padrão; 2 páginas sem DRE, 3 com DRE). Começam **zeradas**: custo Detran, marketing por transferência, aluguel, água, energia, manutenção predial, sistema de filmagem, canal de ouvidoria, certificação ISO + seguros; **marketing (R$/mês) começa zerado** e o Otávio preenche. Com os padrões: receita líquida R$ 52.640, resultado **R$ 41.370,00**.

**Oferta**: Full R$ 30.000 = 10.000 + 20 × 1.000; Home Based R$ 15.000 = 5.000 + 10 × 1.000. Conta que não fecha só gera alerta.

## 7. Onde fica cada referência
- **Escopo final v2.0:** `/home/box/redbox/clientes/auto-visao/estudo-praca/escopo/escopo-gerador-estudo-praca-v2.md` (e `.pdf`); cópia em `docs/`.
- **Documentação técnica:** `docs/documentacao-tecnica-estudo-praca-v2.pdf` (inclui o roteiro "Desenvolvimento com Claude Code").
- **Especificação visual da Julia:** `/home/box/redbox/clientes/auto-visao/estudo-praca/design/especificacao.md` (v1.7, seção 16); login em `design/login/login_<estado>.html`; tela em `design/tela/app.js`; relatórios em `design/relatorio/guia-<marca>/fonte/*.html` e prévias `design/relatorio/relatorio-modelo_*.pdf`.
- **Modelos usados pelo sistema:** `modelos/relatorio/<marca>/` e `modelos/tela/`.
- **DRE de referência:** `estudo-praca/referencias/dre-auto-visao.xlsx` (valores em `dados/dre-referencia-xlsx.json`).
- **Bases oficiais:** `estudo-praca/bases/`.
- **Contrato da API:** `docs/openapi.yaml`. **Decisões:** `docs/adr/`.

## 8. Como trabalhar aqui
- Antes de mudar comportamento: leia o escopo e escreva/ajuste o teste primeiro (vermelho → verde).
- Ao terminar cada mudança: `npm test`, `npm run typecheck`, `npm run build`; se mexeu no relatório, `npx tsx scripts/gerar-exemplos.ts && python3 scripts/comparar_previas.py` e confira as imagens.
- Atualize `CHANGELOG.md`, `docs/openapi.yaml` (se a API mudou) e um ADR para decisões caras de reverter.
- Pendências abertas: seção 13 do escopo (e-mail, implantação, domínio, Santarém → Joca Claudino, Boa Saúde → Januário Cicco, itens [A CONFIRMAR]).
