# ADR-0004: Base oficial embutida no sistema

## Status
Aceito (versão 0.1.0)

## Data
2026-10-29

## Contexto
O escopo decide base fixa (Senatran set/2026 + Estimativa IBGE 2025), sem tela de troca; a troca é por nova versão publicada pela Domma.

## Decisão
`scripts/gerar_base.py` lê os arquivos oficiais, liga frota × IBGE por UF + nome normalizado (36 exceções conferidas em `dados/excecoes-nomes.json`), valida totais e número de municípios e grava `dados/municipios.json`, embutido no build.

## Alternativas consideradas
- **Tabela no Postgres com carga por tela**: fora do escopo do MVP (Fase 2).
- **Consultar a API do IBGE em tempo real**: dependência externa e sem frota.

## Consequências
Busca instantânea e sem rede. Atualizar a base exige nova versão. Duas mudanças de nome (Santarém → Joca Claudino; Boa Saúde → Januário Cicco) aguardam confirmação.
