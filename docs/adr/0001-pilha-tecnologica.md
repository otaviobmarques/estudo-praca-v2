# ADR-0001: Next.js + Postgres (SQL puro com pg) + PDF com Chromium no servidor

## Status
Aceito (implementado na versão 0.1.0)

## Data
2026-10-29

## Contexto
Escopo v1.5, seção 6: sistema novo em Docker na VPS do Otávio; login próprio; estudos não são guardados; PDF A4 pesquisável por marca.

## Decisão
- Next.js 16 (App Router, TypeScript), API em rotas `/api/v1`.
- Postgres 17 em contêiner, só para usuários, sessões, tentativas, links de redefinição e "Sobre a rede". Acesso com `pg` e migrações SQL versionadas (o escopo sugeria Prisma; trocado por SQL puro para reduzir dependências — reversível).
- Senhas em Argon2id (`@node-rs/argon2`, 19 MiB, t=2, p=1). Sessão opaca em cookie HttpOnly/SameSite=Lax/Secure; no banco só o SHA-256 do código.
- Base de municípios embutida (`dados/municipios.json`), gerada e validada por `scripts/gerar_base.py`.
- O mesmo módulo `lib/relatorio.ts` monta a prévia ao vivo (iframe sem scripts) e o HTML do PDF (Chromium via `puppeteer-core`).

## Alternativas consideradas
- Prisma: mais peso e geração de cliente; sem ganho para 5 tabelas.
- PDF no navegador (jsPDF): texto não pesquisável, já recusado no escopo.

## Consequências
Precisa do Chrome/Chromium na imagem de produção. Limite de tentativas guardado no Postgres (serve para mais de uma instância).
