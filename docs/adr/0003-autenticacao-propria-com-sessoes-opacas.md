# ADR-0003: Autenticação própria com sessões opacas no Postgres

## Status
Aceito (versão 0.1.0)

## Data
2026-10-29

## Contexto
Poucos usuários internos, criados pelo Otávio; sem cadastro público; bloqueio de 10 minutos; "Esqueci a senha" por e-mail; sistema numa única VPS.

## Decisão
- Senhas com Argon2id (19 MiB, t=2, p=1 — parâmetros recomendados pela OWASP).
- Sessão = código aleatório de 32 bytes no cookie `sessao` (HttpOnly, SameSite=Lax, Secure em produção), validade de 12 h; no banco fica só o SHA-256.
- Bloqueio de 10 min após 5 falhas por usuário ou 20 por IP, guardado no Postgres.
- Link de redefinição de uso único, 30 min, guardado como hash; a resposta do pedido é sempre a mesma.

## Alternativas consideradas
- **JWT**: não dá para revogar sem lista negra; sem vantagem para uma instância.
- **Provedor externo (Auth0, Clerk)**: custo e dependência externa para poucos usuários.

## Consequências
Revogação imediata (sair, troca de senha encerra as sessões). Precisa de um serviço de e-mail na implantação (pendente).
