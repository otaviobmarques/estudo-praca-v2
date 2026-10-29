# Gerador de Estudo de Praça v2 — Auto Visão e Royal

Sistema interno da Domma para gerar, em segundos, o estudo de potencial de uma cidade (modelos **Full** e **Home Based**) e baixar o relatório em PDF A4 da marca escolhida. Regras: `escopo-gerador-estudo-praca-v2.md` v2.0 (final) e `design/especificacao.md` v1.7 (seção 16).

> **Situação (29/10/2026):** versão 0.2.1, implementação local completa do MVP. Guia para o Claude Code em `CLAUDE.md`; documentação técnica em `docs/documentacao-tecnica-estudo-praca-v2.pdf`. Nada foi publicado, implantado no VPS, enviado a repositório ou por e-mail.

## Início rápido (local)
1. Node 24 e Docker. Suba o banco: `sudo docker compose up -d` (ou `npm run db:up` se o contêiner já existe).
2. `cp .env.example .env` e preencha `<SENHA>` com um valor aleatório (`openssl rand -hex 16`).
3. `npm install`
4. `npm run db:migrate`
5. Primeiro administrador: `npm run admin:criar -- <usuario> <email> "<Nome>"` (a senha é pedida no terminal, sem eco).
6. `npm run build && npm start` (ou `npm run dev`) e abra `http://localhost:3000`.

## Comandos
| Comando | O que faz |
|---|---|
| `npm test` | testes automatizados (cálculos, DRE contra o xlsx, relatório, regras de senha) |
| `npm run typecheck` | verificação de tipos |
| `SENHA_ARQ=<arquivo> BASE=http://localhost:3000 tests/integracao/fumaca.sh` | teste de fumaça contra o servidor rodando (login, bloqueio, PDFs) |
| `npm run base:gerar -- <frota.xlsx> <populacao.xls>` | regenera `dados/municipios.json` e valida |

## Estrutura
- `lib/calculo.ts` — potencial (3 cenários, 90/10, R$ 147/R$ 280, 22 dias úteis), Home Based (laudos digitados × preço do laudo), DRE (linhas e fórmulas do xlsx + royalties + regra de pessoal), conferência da oferta, código do estudo.
- `lib/relatorio.ts` — HTML A4 por marca e modelo (prévia ao vivo e PDF). `lib/pdf.ts` — Chromium.
- `lib/auth.ts`, `lib/senha.ts` — Argon2id, sessões, bloqueio de 10 min (5 tentativas por usuário; 20 por IP), "Esqueci a senha" com link de uso único (30 min).
- `db/migracoes/` — esquema Postgres. `dados/` — base embutida, exceções de nomes, valores do DRE de referência.
- `docs/adr/`, `docs/openapi.yaml`, `docs/exemplos/` (8 PDFs de exemplo: 2 marcas × Full e Home Based, com e sem DRE), `docs/comparacao/` (comparações com as prévias da Julia).

## Base de dados embutida
Gerada de `estudo-praca/bases/` (Senatran set/2026 + Estimativa IBGE 2025): **5.571 municípios ligados**, população 213.421.037, frota 133.337.835 (+4 de "SP – MUNICIPIO NAO INFORMADO", descartados). Como o `municipios_2026.json` do site atual **não foi recebido**, a ligação frota × IBGE foi feita por UF + nome normalizado, com 36 grafias diferentes resolvidas em `dados/excecoes-nomes.json` (2 são mudanças de nome — PB Santarém → Joca Claudino, RN Boa Saúde → Januário Cicco — a confirmar com o JSON).

## Variáveis de ambiente
| Nome | Obrigatória | Descrição |
|---|---|---|
| DATABASE_URL | sim | conexão Postgres |
| POSTGRES_PASSWORD | sim (Docker) | senha do banco |
| APP_URL | sim | base do link de redefinição |
| COOKIE_SECURE | não | `false` só em ambiente local sem HTTPS |
| CHROME_PATH | não | caminho do Chrome/Chromium |
| EMAIL_SERVICO | não | serviço de e-mail — **a definir**; hoje o envio é simulado (registra só o domínio do destinatário) |

## Implantação
Não feita. Precisa do OK do Otávio: VPS Hostinger, subdomínio, HTTPS, imagem com Chromium, serviço de e-mail.

## Pendências
Ver o relatório de entrega e `CHANGELOG.md`.
