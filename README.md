# Davi Guedes — Portfólio

Site de portfólio em **HTML, CSS e JavaScript puro**. Sem build, sem framework,
sem dependência externa em tempo de execução: abra `index.html` no navegador
ou sirva a pasta com qualquer servidor estático.

```
.
├── index.html          # o portfólio
├── styles.css          # design system + todas as seções
├── script.js           # animações, parallax e interações
├── assets/
│   ├── fonts/          # Inter e Playfair Display auto-hospedadas (woff2)
│   ├── vendor/         # GSAP + ScrollTrigger auto-hospedados
│   └── *.jpg | *.svg   # imagens dos projetos (ver assets/README.md)
└── tetris/             # Tetris Classic — projeto anterior, linkado no portfólio
```

## Seções

| # | Seção | Destaque técnico |
| --- | --- | --- |
| 01 | Hero | Tipografia "DEVELOPER" fixa, parallax de scroll **e** de mouse, ajuste automático da palavra à largura da tela |
| 02 | Sobre | Retrato com parallax e revelação de texto palavra a palavra |
| 03 | Expertise | Scroll horizontal com seção pinada (GSAP ScrollTrigger) |
| 04 | Projetos | Seção pinada, projetos entrando um a um |
| — | Arquivo | Trabalhos anteriores com imagem que persegue o cursor |
| 05 | Processo | Linha do tempo desenhada conforme o scroll |
| 06 | Stack | Marquee infinito em duas direções |
| 07 | Depoimentos | Cards minimalistas |
| 08 | Contato | Tipografia gigante, formulário e canais |

## O que trocar antes de publicar

1. **`assets/hero.jpg`** — sua foto (retrato vertical, fundo escuro, ~1600×2000).
   Sem ela o hero mostra um plano de fundo de apoio, sem quebrar o layout.
2. **Projetos 02 e 03** e os itens do **Arquivo** — títulos, textos, stack, links e
   imagens são estruturas de espera, marcadas com comentário no HTML. Só o
   *Tetris Classic* é real.
3. **Depoimentos** — os três textos são exemplos, assinados como
   "Depoimento de exemplo — substituir". Use depoimentos reais, com nome e
   autorização de quem falou.
4. **WhatsApp e LinkedIn** — os `href` estão marcados com `TODO` no HTML.
5. **`<link rel="canonical">`** e `og:image` — ajuste para o domínio final.

## Comportamento e acessibilidade

- **Sem JavaScript**: a página continua legível e navegável. As seções pinadas caem
  para layout nativo (scroll horizontal / empilhado) e nada fica escondido.
- **`prefers-reduced-motion`**: desliga smooth scroll, parallax e transições.
- **Mobile / toque**: sem pin, sem parallax de mouse, rolagem nativa.
- Navegação por teclado, foco visível, HTML semântico e dados estruturados
  (JSON-LD `Person`).

## Performance

Zero requisições a terceiros — fontes e GSAP são servidos da própria pasta.
Nada bloqueia a renderização além do CSS próprio; os scripts usam `defer` e as
imagens abaixo da dobra usam `loading="lazy"`.

## Terceiros

- [Inter](https://rsms.me/inter/) e [Playfair Display](https://github.com/clauseggers/Playfair-Display) — SIL Open Font License 1.1.
- [GSAP](https://gsap.com) 3.12.5 — GreenSock Standard License (cabeçalho preservado em `assets/vendor/`).
