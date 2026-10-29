create extension if not exists pgcrypto;
create table usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 1 and 120),
  usuario text not null unique check (usuario ~ '^[a-z0-9._-]{3,40}$'),
  email text not null unique check (char_length(email) <= 254),
  senha_hash text not null,
  papel text not null default 'usuario' check (papel in ('usuario','administrador')),
  ativo boolean not null default true,
  falhas_login int not null default 0,
  bloqueado_ate timestamptz,
  criado_em timestamptz not null default now()
);
create table sessoes (
  id_hash text primary key,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  criada_em timestamptz not null default now(),
  expira_em timestamptz not null
);
create index sessoes_usuario_id_idx on sessoes (usuario_id);
create table tentativas_ip (
  ip text primary key,
  falhas int not null default 0,
  bloqueado_ate timestamptz,
  atualizado_em timestamptz not null default now()
);
create table tokens_redefinicao (
  token_hash text primary key,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  expira_em timestamptz not null,
  usado_em timestamptz
);
create index tokens_redefinicao_usuario_id_idx on tokens_redefinicao (usuario_id);
create table config_marca (
  marca text primary key check (marca in ('auto-visao','royal')),
  destaque text,
  lojas text not null,
  estados text not null,
  laudos_mes text not null,
  frase_full text not null,
  frase_home_based text not null,
  atualizado_em timestamptz not null default now()
);
-- Dados informados pelo Otávio em 28 e 29/10/2026 (não verificados externamente; escopo seção 9).
insert into config_marca values
 ('auto-visao','Maior Rede de Vistorias do Brasil','+240','+18','+80.000','Confie em uma rede com +15 anos, credenciada pelo DETRAN.','Confie em uma rede com + de 15 anos',now()),
 ('royal',null,'+70','+10','+30.000','Confie em uma rede com +15 anos, credenciada pelo DETRAN.','Confie em uma rede com + de 15 anos',now());
create table migracoes_aplicadas (nome text primary key, aplicada_em timestamptz not null default now());
