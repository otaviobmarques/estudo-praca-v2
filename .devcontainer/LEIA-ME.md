# Rodando no GitHub Codespaces

O Codespace já instalou tudo, subiu o banco e aplicou as migrações. Faltam três passos, no **terminal** (painel de baixo):

**1. Criar o administrador** (só na primeira vez; a senha é pedida sem aparecer, mínimo 12 caracteres):

```bash
npm run admin:criar -- otavio <seu-email> "Otávio Marques"
```

**2. Subir o sistema:**

```bash
npm run build && npm start
```

Quando aparecer `Ready`, clique em **Open in Browser** (ou na aba **Portas**, endereço da porta 3000). O endereço é privado: só abre logado na sua conta do GitHub.

**3. (Opcional) Teste de fumaça**, em outro terminal (botão `+`). Guarde a senha num arquivo fora do repositório e rode:

```bash
read -rs -p "Senha do admin: " S; printf '%s' "$S" > ~/.estudo-senha; unset S; chmod 600 ~/.estudo-senha; echo
```

```bash
SENHA_ARQ=~/.estudo-senha BASE=http://localhost:3000 bash tests/integracao/fumaca.sh
```

Deve terminar com `falhas: 0`. O teste bloqueia o login de propósito no final; para liberar:

```bash
docker exec -i estudo-praca-db psql -U estudo -p 5433 -d estudo_praca -c "update usuarios set falhas_login=0, bloqueado_ate=null; delete from tentativas_ip;"
```

Ao terminar, pare o Codespace (github.com/codespaces → ⋯ → Stop) para não gastar a cota gratuita.
