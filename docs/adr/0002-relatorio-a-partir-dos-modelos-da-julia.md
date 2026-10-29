# ADR-0002: Relatório montado sobre os modelos HTML da Julia

## Status
Aceito (versão 0.2.0)

## Data
2026-10-29

## Contexto
O Otávio aprovou o visual da Julia (especificação v1.7, seção 16) e pediu fidelidade total no PDF e na tela, nas duas marcas e nos dois modelos. Recriar o visual em componentes próprios gerava diferenças visíveis e retrabalho a cada ajuste da Julia.

## Decisão
- Os HTML/CSS da Julia são copiados para `modelos/relatorio/<marca>/` e `modelos/tela/` e usados como **modelo**: `lib/relatorio.ts` só troca valores por trechos bem delimitados (expressões regulares), divide em páginas e renumera seções.
- A prévia ao vivo e o PDF saem da mesma função `montarHtml` no servidor; o Chromium renderiza com JavaScript desligado.
- A fidelidade é medida por comparação de pixels contra as prévias da Julia (`scripts/comparar_previas.py`, `scripts/capturar_tela.py`).

## Alternativas consideradas
- **Componentes React próprios**: mais "limpo", mas diverge do aprovado e duplica o trabalho de design.
- **Motor de modelos (Handlebars etc.)**: exigiria reescrever os HTML da Julia com marcadores; adiado — vale se a Julia passar a entregar modelos com marcadores.

## Consequências
- Positivas: diferença para as prévias ≤ 1,2% por página; ajustes da Julia entram copiando os arquivos.
- Negativas: as trocas dependem de trechos do HTML; um novo modelo pode quebrar uma expressão (os testes de relatório e a comparação visual detectam).
