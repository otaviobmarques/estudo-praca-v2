# ADR-0007 — Implantação na Vercel com banco no Supabase

**Data:** 07/11/2026 · **Situação:** aceita (OK do Otávio)

## Contexto
O sistema rodava no VPS da Hostinger (Postgres em Docker + Chrome instalado). Decidiu-se levar para Vercel (aplicação) + Supabase (Postgres gerenciado).

## Decisão
- **Banco:** projeto Supabase `estudo-praca` (sa-east-1), Postgres 17. Mesmas migrações SQL (`db/migracoes/`). O sistema continua acessando o banco só pelo servidor, com `pg`, pela string do **pooler em modo transação** (porta 6543), com SSL.
- **RLS ligado em todas as tabelas, sem políticas** (`0002_supabase_rls.sql`), e privilégios retirados de `anon`/`authenticated`: a API REST pública do Supabase não lê nem grava nada. A autenticação continua a própria (ADR-0003); não usamos Supabase Auth.
- **PDF/PNG:** na Vercel (`VERCEL` definido e sem `CHROME_PATH`), `lib/pdf.ts` usa `@sparticuz/chromium`; fora dela continua o Chrome do sistema. JavaScript segue desligado na renderização.
- **Funções** na região `gru1` (São Paulo); rotas de relatório com 2 GB e até 60 s (`vercel.json`). Modelos, base embutida e fontes entram no pacote via `outputFileTracingIncludes`.

## Consequências
- Primeira geração de PDF após ociosidade é mais lenta (extração do Chromium, ~2–4 s).
- O pool de conexões por função é 1; sem transações explícitas no código, compatível com o modo transação do pooler.
- O VPS pode ser desligado depois da validação.
