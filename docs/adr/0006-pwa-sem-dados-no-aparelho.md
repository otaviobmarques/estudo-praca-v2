# ADR-0006: PWA instalável, sem guardar dados no aparelho

## Status
Aceito (pedido do Otávio, 29/10/2026)

## Data
2026-10-29

## Contexto
O Otávio pediu uma versão PWA, para instalar o gerador no celular e no computador como aplicativo. O escopo diz que nenhum estudo é guardado e o acesso é só com login.

## Decisão
- Manifesto em `app/manifest.ts` (nome "Gerador de Estudo de Praça", curto "Estudo de Praça", `display: standalone`), ícones em `public/icones` gerados por `scripts/gerar_icones.py`.
- Ícone e cores **neutros** (grafite da tela de login, barras crescentes): o aplicativo atende as duas marcas e não pode usar a identidade de uma delas. Pode ser trocado por um ícone aprovado sem mudar código além dos PNGs.
- Service worker (`public/sw.js`) guarda **só arquivos fixos** (build, fontes, ícones, logos) e a página `offline.html`. A API (`/api/`) e as páginas vão sempre direto à rede; nada de estudo, usuário ou sessão fica no aparelho. Sem conexão, aparece "Sem conexão".
- Registro só em produção (`components/RegistrarSW.tsx`); `sw.js` com `Cache-Control: no-cache`.

## Alternativas consideradas
- **Funcionar offline com cálculo no aparelho**: exigiria guardar a base e os estudos no celular, contra o escopo e a LGPD.
- **Biblioteca de PWA (next-pwa/serwist)**: dependência a mais para um service worker de 30 linhas.

## Consequências
Instalável no Android/Chrome/Edge e no iPhone (Adicionar à Tela de Início). O PWA exige HTTPS (Codespaces e a implantação com Caddy já têm). Ao mudar a lista de arquivos fixos, troque `VERSAO` em `sw.js`.
