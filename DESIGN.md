# Salomar Design System

## Intent

Um fim de tarde no litoral brasileiro: areia clara, mar azul profundo e o dourado do sol sobre linho. A identidade parte diretamente da logo pública da Salomar no Instagram — onda marinho, sol dourado e base areia.

## Color

Estratégia costeira committed, preservando as cores oficiais percebidas na logo.

- `canvas`: `oklch(0.96 0.022 91)` — areia clara
- `surface`: `oklch(0.985 0.01 91)`
- `ink`: `oklch(0.27 0.065 252)` — azul-marinho oficial
- `muted`: `oklch(0.48 0.035 240)`
- `line`: `oklch(0.84 0.025 91)`
- `honey`: `oklch(0.72 0.13 79)` — sol dourado
- `ocean`: `oklch(0.3 0.085 250)` — ações e seções imersivas
- `sky`: `oklch(0.78 0.075 220)` — apoio litorâneo

Texto sobre `ocean` usa areia clara. Texto principal mantém contraste superior a 7:1 no canvas.

## Typography

- Display: Bodoni Moda, serif; alto contraste e uso contido em títulos.
- Interface/body: Manrope, sans-serif; leve, precisa e legível.
- Marca: arquivo oficial extraído da imagem pública do perfil `@salomarloja`.
- Escala fluida com `clamp()`, títulos limitados a 6rem e parágrafos a 68 caracteres.

## Layout

- Margem responsiva: `clamp(1rem, 3vw, 3rem)`.
- Hero ocupa a primeira viewport e usa fotografia full-bleed à beira-mar.
- O feed é assimétrico: histórias amplas alternam com seleções de produto.
- Cards não recebem moldura, sombra ou arredondamento decorativo; imagem, espaço e tipografia definem grupos.
- Prompt contextual fica centralizado na base, sem cobrir ações essenciais.

## Components

- Header transparente que ganha superfície discreta após rolagem.
- Intent composer translúcido com entrada, envio e sugestões.
- Product tile vertical 3:4 com metadados mínimos.
- Quick view em diálogo nativo com foto, tamanho e CTA.
- Cart drawer em diálogo nativo lateral, com subtotal e controles de quantidade.
- Editorial story alterna fotografia e texto, com traço SVG manual.

## Motion

- Curva principal: `cubic-bezier(.22, 1, .36, 1)`.
- Entrada inicial em camadas com opacity, blur e clip-path.
- Hover de imagem por escala máxima de 1.035.
- `prefers-reduced-motion: reduce` remove deslocamento, blur e rolagem suave.

## Responsive

- Desktop: hero dividido, feed em 12 colunas e prompt largo.
- Tablet: feed em 2 colunas.
- Mobile: hero empilhado, seleção horizontal com snap, quick view e carrinho em tela cheia.

## Content

Português brasileiro. Preços em BRL. A fotografia e as imagens de produto vêm das publicações públicas oficiais de `@salomarloja`, salvas localmente para estabilidade, com texto alternativo específico.
