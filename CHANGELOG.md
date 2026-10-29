# Registro de mudanças
## [Não lançado]
### Alterado
- Oferta do Full: texto padrão "Entrada inclui:" com a lista Kit de Câmeras e Biometria homologados pelo DETRAN · Projeto Arquitetônico · 2 Vagas de Treinamento · Sistema e App de Laudos (pedido do Otávio). Texto de várias linhas sai em lista no PDF e na tela.
- Removidas do relatório as notas internas do modelo ("população e frota de Joinville são valores de EXEMPLO herdados do sistema atual…" e "Condição comercial como digitada no painel…"), também no Exemplo Joinville, e o título "Leitura do estudo", que ficou sem conteúdo.
- Tela principal mais compacta (botões, campos, títulos, cartões e painel menores) e Administração refeita com o mesmo design system da tela (cabeçalho, blocos, campos, botões e selos; redefinição de senha em linha, sem janela do navegador).
- Removidos os textos provisórios "[REVISAR – OTÁVIO]" e "[VERIFICAR]" dos modelos do relatório e da tela (decisão do Otávio; pendência C7). O aviso fixo aprovado continua em todas as páginas.
### Corrigido
- Página de contatos: vão grande entre o título da seção e o contato de expansão.
- Fontes: Inter, Nunito e Raleway passam a ser servidas pelo próprio sistema (`public/fontes`, licença OFL) em todas as telas e embutidas no PDF; antes cada computador usava a fonte que tivesse instalada. CSP com `font-src 'self' data:`.
- Selos "EXEMPLO" dos cartões de população e frota e do DRE apareciam também em cidades reais.
- Campo UF com duas setas.
- **DRE em 10 meses** (decisão do Otávio, 29/10/2026; ADR-0005): as colunas D–M da planilha de referência viram os meses 1 a 10, com os volumes dela como padrão (transferência 100 → 550, cautelar 10 → 100), editáveis mês a mês no painel, e total dos 10 meses. Pessoal pela regra TETO(laudos ÷ 200). Home Based com a mesma estrutura, começando com os laudos/mês informados em todos os meses.
- PDF: página do DRE em A4 deitada (10 meses + total); as outras páginas continuam em pé.
- API: `mesesDre` (10 meses) substitui `laudosUnidade`; `docs/openapi.yaml` 0.3.0.
- Relatório padrão de Joinville com DRE: de R$ 38.783,80 (um mês com 400 laudos, margem 64,35%) para R$ 369.405,00 em 10 meses (margem 62,21%). O cálculo de um mês com 400 laudos continua testado.
### Adicionado
- `.devcontainer/` para rodar o sistema no GitHub Codespaces sem instalar nada no computador: Chromium, fontes do relatório (Inter, Nunito, Raleway), Postgres e migrações automáticos; passos finais em `.devcontainer/LEIA-ME.md`.
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
