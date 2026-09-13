# FitTrack Pro

App de fitness e produtividade em um arquivo só (`index.html`), sem build,
sem dependências instaladas. Abre com dois cliques ou publicado em qualquer
hospedagem estática.

Todo dado começa em zero e é editável por quem usa: atividades, categorias,
metas, métricas personalizadas, cores, tema e perfil.

## Os dois modos

O app decide sozinho ao abrir:

| | Modo local | Modo nuvem (Supabase) |
|---|---|---|
| Quando | sem chave configurada, ou servidor fora do ar | chave preenchida e servidor respondendo |
| Login | conta no próprio navegador, senha com PBKDF2-SHA256 | conta de verdade no servidor |
| Dados | separados por conta, dentro daquele navegador | sincronizados entre todos os aparelhos |
| Isolamento | por espaço de armazenamento | garantido pelo Postgres (RLS), no servidor |

Se a rede cair durante o uso, o modo nuvem continua funcionando pelo cache
local e sincroniza quando a conexão voltar.

## Banco de dados

A migração está em `../supabase/migrations/`. Ela cria uma tabela só,
`public.user_state`, com uma linha por pessoa e políticas de segurança que
permitem a cada uma ler e escrever apenas a própria linha.

Já aplicada no projeto `harpmzexpfpqfppzcstw` (sa-east-1).

## Para ligar o login com Google

1. Publique o app em `https` (o GitHub Pages deste repositório serve).
2. No Google Cloud Console, crie um **ID do cliente OAuth** do tipo
   Aplicativo da Web. Em origens autorizadas, informe o endereço do app;
   em URIs de redirecionamento, `https://<projeto>.supabase.co/auth/v1/callback`.
3. No painel do Supabase, em **Authentication → Providers → Google**, cole o
   Client ID e o Client Secret e ative.
4. Em **Authentication → URL Configuration**, coloque o endereço do app em
   Site URL e em Redirect URLs.

O botão no app já chama o fluxo — não é preciso mexer no código.

## Para ligar o login com Apple

Mesmo caminho, com **Authentication → Providers → Apple**. Exige conta paga
no Apple Developer Program, um Services ID e o domínio verificado.

## Recomendações de segurança

- Ative **Leaked Password Protection** em Authentication → Policies: barra
  senhas que já vazaram publicamente.
- Mantenha a confirmação de e-mail ligada. O app já trata o caso: mostra o
  aviso para abrir o link enviado antes de entrar.

A chave que aparece no código é a *publishable*, feita para ficar à vista.
Ela não dá acesso a nada sozinha — quem decide o que cada pessoa pode ler e
escrever é a política do banco. A chave secreta (`service_role`) nunca deve
ir para o arquivo.
