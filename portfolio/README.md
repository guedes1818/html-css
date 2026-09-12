# Portfólio — Davi Guedes

Site de portfólio em **HTML, CSS e JavaScript puro**. Sem build, sem framework:
abra `index.html` no navegador (ou sirva a pasta com qualquer servidor estático).

```
portfolio/
├── index.html      # estrutura e conteúdo
├── styles.css      # design system + todas as seções
├── script.js       # animações, parallax e interações
└── assets/         # imagens (ver assets/README.md)
```

## Seções

| # | Seção | Destaque técnico |
| --- | --- | --- |
| 01 | Hero | Tipografia "DEVELOPER" fixa, parallax de scroll **e** de mouse, ajuste automático da palavra à largura da tela |
| 02 | Sobre | Retrato com parallax e revelação de texto palavra a palavra |
| 03 | Expertise | Scroll horizontal com seção pinada (GSAP ScrollTrigger) |
| 04 | Projetos | Seção pinada, projetos entrando um a um |
| — | Arquivo | Lista de trabalhos anteriores com imagem que persegue o cursor |
| 05 | Processo | Linha do tempo desenhada conforme o scroll |
| 06 | Stack | Marquee infinito em duas direções |
| 07 | Depoimentos | Cards minimalistas |
| 08 | Contato | Tipografia gigante, formulário e canais |

## O que trocar antes de publicar

1. **`assets/hero.jpg`** — sua foto (retrato vertical, fundo escuro). Sem ela, o hero
   mostra um plano de fundo de apoio.
2. **Projetos 02 e 03** e os itens do **Arquivo** — títulos, textos, stack, links e
   imagens são estruturas de espera. Só o *Tetris Classic* é real (está neste repositório).
3. **Depoimentos** — os três textos são exemplos. Use depoimentos reais, com nome e
   autorização de quem falou.
4. **WhatsApp e LinkedIn** — os `href` estão marcados com `TODO` no HTML.
5. **`<link rel="canonical">`** e `og:image` — ajuste para o domínio final.

## Comportamento e acessibilidade

- **Sem JavaScript** ou **sem GSAP** (CDN fora do ar): a página continua legível e
  navegável. As seções pinadas caem para layout nativo (scroll horizontal / empilhado)
  e as revelações usam `IntersectionObserver`.
- **`prefers-reduced-motion`**: desliga smooth scroll, parallax e todas as transições.
- **Mobile / toque**: sem pin, sem parallax de mouse, rolagem nativa.
- Navegação por teclado, foco visível e HTML semântico.

## Performance

CSS e JS próprios somam poucos KB. As únicas requisições externas são a fonte
(Google Fonts, `display=swap`) e o GSAP via CDN — ambos com fallback. Para tirar
o site do zero de dependências externas, baixe o GSAP para `assets/vendor/` e
aponte os `<script>` do fim do `index.html` para lá.
