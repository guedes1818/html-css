-- FitTrack Pro — estado do usuário na nuvem
--
-- Cada pessoa tem uma linha só: o estado inteiro do app em JSON.
-- O isolamento é feito pelo próprio Postgres (RLS): mesmo com a chave
-- pública em mãos, ninguém lê nem escreve a linha de outra pessoa.

create table if not exists public.user_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.user_state is
  'Estado do FitTrack Pro por usuário: atividades, metas, métricas, registros e perfil.';

alter table public.user_state enable row level security;

-- Uma política por operação, todas restritas ao dono da linha.
create policy "usuario le o proprio estado"
  on public.user_state for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "usuario cria o proprio estado"
  on public.user_state for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "usuario atualiza o proprio estado"
  on public.user_state for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "usuario apaga o proprio estado"
  on public.user_state for delete to authenticated
  using ((select auth.uid()) = user_id);

-- O horário de modificação é decidido pelo servidor, não pelo cliente:
-- é ele que resolve qual aparelho tem a versão mais nova.
create or replace function public.touch_user_state()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_state_touch on public.user_state;
create trigger user_state_touch
  before insert or update on public.user_state
  for each row execute function public.touch_user_state();

-- A função de gatilho não precisa ser chamável pela API REST: o trigger a
-- executa com os direitos do dono da tabela. Sem isto ela fica exposta em
-- /rest/v1/rpc para anônimos e logados (alerta do linter do Supabase).
revoke all on function public.touch_user_state() from public;
revoke all on function public.touch_user_state() from anon;
revoke all on function public.touch_user_state() from authenticated;
