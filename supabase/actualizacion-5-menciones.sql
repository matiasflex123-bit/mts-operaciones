-- ════════════════════════════════════════════════════════════════════
--  MTS · Actualización 5: Menciones con @
--  · Tabla de menciones: cada vez que alguien escribe @USUARIO en la
--    bitácora, una nota de estado, la ficha o las notas de un equipo,
--    se crea un aviso para esa persona en su panel principal.
--  Se puede volver a ejecutar sin problema.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.mentions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,   -- a quién mencionaron
  by_user    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  record_id  uuid references public.records(id) on delete cascade,
  entry_id   uuid references public.entries(id) on delete cascade,
  context    text not null default 'comentario',
  snippet    text not null default '',
  at         timestamptz not null default now(),
  seen_at    timestamptz
);
create index if not exists mentions_user_idx on public.mentions(user_id, at desc);

alter table public.mentions enable row level security;
revoke all on public.mentions from anon;
revoke all on public.mentions from authenticated;
grant select, insert, delete on public.mentions to authenticated;
grant update (seen_at) on public.mentions to authenticated;

drop policy if exists "ver menciones"   on public.mentions;
drop policy if exists "mencionar"       on public.mentions;
drop policy if exists "marcar leída"    on public.mentions;
drop policy if exists "admin elimina"   on public.mentions;
create policy "ver menciones" on public.mentions for select to authenticated
  using (public.is_active() and (user_id = auth.uid() or by_user = auth.uid() or public.is_admin()));
create policy "mencionar"     on public.mentions for insert to authenticated
  with check (public.is_active() and by_user = auth.uid() and user_id <> auth.uid());
create policy "marcar leída"  on public.mentions for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admin elimina" on public.mentions for delete to authenticated using (public.is_admin());

-- Aviso en tiempo real a la persona mencionada
do $$ begin
  alter publication supabase_realtime add table public.mentions;
exception when others then null;
end $$;

select 'Actualización 5 lista ✔' as resultado;
