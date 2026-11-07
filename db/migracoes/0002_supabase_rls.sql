-- Supabase expõe o schema public pela API REST (PostgREST) com as chaves anon/authenticated.
-- O sistema acessa o banco só pelo servidor (pg, papel postgres), então ativamos RLS sem políticas
-- e retiramos os privilégios dos papéis da API: nada fica legível nem gravável por ela.
-- Em um Postgres comum (sem esses papéis) a parte de revoke é ignorada.
alter table usuarios enable row level security;
alter table sessoes enable row level security;
alter table tentativas_ip enable row level security;
alter table tokens_redefinicao enable row level security;
alter table config_marca enable row level security;
alter table migracoes_aplicadas enable row level security;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on all tables in schema public from anon, authenticated;
    alter default privileges in schema public revoke all on tables from anon, authenticated;
  end if;
end $$;
