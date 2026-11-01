-- ════════════════════════════════════════════════════════════════════
--  MTS · Actualización 6: "Visto" en la bitácora
--  · Cada usuario puede marcar un registro de la bitácora como visto,
--    para que quien lo escribió sepa quién lo leyó y cuándo.
--  Se puede volver a ejecutar sin problema.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.entry_acks (
  entry_id   uuid not null references public.entries(id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  record_id  uuid not null references public.records(id) on delete cascade,
  at         timestamptz not null default now(),
  primary key (entry_id, user_id)
);
create index if not exists entry_acks_record_idx on public.entry_acks(record_id);
alter table public.entry_acks replica identity full;   -- para avisar en tiempo real también al quitar el visto

alter table public.entry_acks enable row level security;
revoke all on public.entry_acks from anon;
revoke all on public.entry_acks from authenticated;
grant select, insert, delete on public.entry_acks to authenticated;

drop policy if exists "ver vistos"     on public.entry_acks;
drop policy if exists "marcar visto"   on public.entry_acks;
drop policy if exists "quitar visto"   on public.entry_acks;
create policy "ver vistos"   on public.entry_acks for select to authenticated using (public.is_active());
create policy "marcar visto" on public.entry_acks for insert to authenticated with check (public.is_active() and user_id = auth.uid());
create policy "quitar visto" on public.entry_acks for delete to authenticated using (user_id = auth.uid() or public.is_admin());

do $$ begin
  alter publication supabase_realtime add table public.entry_acks;
exception when others then null;
end $$;

select 'Actualización 6 lista' as resultado;
