# Registro de mudanças
## [0.2.1] — 2026-10-29
### Adicionado
- Home Based: campo "Marketing (R$/mês)", que começa zerado (decisão 45 do escopo v2.0).
- `CLAUDE.md`, ADRs 0002–0004, `docs/openapi.yaml` 0.2.0 completo, capturas reais para o manual (`scripts/capturar_manual.py`) e documentação técnica em PDF.
### Alterado
- Lista das despesas zeradas do Home Based confirmada pelo Otávio.
### Corrigido
- Tela de login: textos de apoio usavam a fonte padrão do navegador (variável de fonte definida só no contêiner).
- Rota PUT /rede/{marca}: 401 sem sessão (antes 403).
## [0.2.0] — 2026-10-29
### Adicionado
- PDF montado sobre os HTML da Julia (`modelos/relatorio/<marca>/`) e tela sobre `tela/app.js` (`modelos/tela/`), nas duas marcas e nos dois modelos.
- DRE no Home Based (mesma chave, desligada por padrão; 3 páginas com DRE); despesas que não se aplicam começam zeradas.
- Custos do DRE campo a campo no painel (12 despesas fixas + variáveis), com os valores da planilha e botão para voltar ao padrão.
- Tela do administrador para editar "Sobre a rede" (`PUT /api/v1/rede/{marca}`); prévia em PNG.
- Royal: título sem " · EXEMPLO" no nome da cidade, premissas no texto curto da Julia, linha de ECVs e nota da oferta como no modelo (diferença para a prévia caiu de 19–22% para 0,3–0,6%).
- Comparações com as prévias em `docs/comparacao/`; 60 testes unitários e teste de fumaça ampliado.
## [0.1.0] — 2026-10-29
### Adicionado
- Cálculos (potencial, Home Based, DRE, oferta) com testes; DRE confere com as 10 colunas do xlsx de referência e com o exemplo de 400 laudos (R$ 64.120,00 · R$ 38.783,80 · 64,35%).
- Login (Argon2id, sessão em cookie, bloqueio de 10 min), "Esqueci a senha", nova senha com regras e tela de sucesso, administração de usuários.
- Base embutida Senatran set/2026 + IBGE 2025 (5.571 municípios).
- Painel com modelo, marca, cidade, cenário, DRE, oferta com parcelamento e alerta; prévia ao vivo; PDF A4 por marca e modelo.
### Segurança
- Cabeçalhos (CSP, HSTS, nosniff), erros no formato Problem Details, resposta igual no pedido de redefinição.
