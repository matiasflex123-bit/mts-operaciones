-- ════════════════════════════════════════════════════════════════════
--  MTS · Actualización 7: Cotizaciones privadas en los levantamientos
--  · Cada levantamiento puede tener una o más cotizaciones adjuntas
--    (PDF, imagen, Excel o Word).
--  · SOLO el usuario principal MMORA puede verlas, subirlas o borrarlas.
--    Ni los técnicos ni los otros administradores tienen acceso: la base
--    de datos y el almacenamiento rechazan cualquier intento.
--  · No aparecen en la actividad, avisos, tiempo real ni respaldos.
--  Se puede volver a ejecutar sin problema.
-- ════════════════════════════════════════════════════════════════════

-- Quién es el dueño: usuario principal, activo y con nombre MMORA.
-- (El nombre de usuario no se puede cambiar desde la plataforma, así que
--  otro administrador no puede darse este acceso.)
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid() and active and owner and username = 'MMORA'
  );
$$;
revoke execute on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

-- ───────────── Tabla de cotizaciones ─────────────
create table if not exists public.quotes (
  id         uuid primary key default gen_random_uuid(),
  record_id  uuid not null references public.records(id) on delete cascade,
  path       text not null,
  file_name  text not null default '',
  number     text not null default '' check (length(number) <= 60),
  amount     numeric(14,0) check (amount is null or amount >= 0),
  notes      text not null default '' check (length(notes) <= 1000),
  user_id    uuid not null default auth.uid(),
  at         timestamptz not null default now()
);
create index if not exists quotes_record_idx on public.quotes(record_id, at);

alter table public.quotes enable row level security;
revoke all on public.quotes from anon;
revoke all on public.quotes from authenticated;
grant select, insert, update (number, amount, notes), delete on public.quotes to authenticated;

drop policy if exists "dueño ve"       on public.quotes;
drop policy if exists "dueño sube"     on public.quotes;
drop policy if exists "dueño edita"    on public.quotes;
drop policy if exists "dueño elimina"  on public.quotes;
create policy "dueño ve"      on public.quotes for select to authenticated using (public.is_owner());
create policy "dueño sube"    on public.quotes for insert to authenticated
  with check (public.is_owner() and user_id = auth.uid()
              and exists (select 1 from public.records r where r.id = record_id and r.kind = 'levantamiento'));
create policy "dueño edita"   on public.quotes for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "dueño elimina" on public.quotes for delete to authenticated using (public.is_owner());

-- ───────────── Archivos (almacenamiento privado aparte de las fotos) ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cotizaciones', 'cotizaciones', false, 20971520, array[
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'])
on conflict (id) do update set public = false, file_size_limit = 20971520, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "mts cotizaciones ver"      on storage.objects;
drop policy if exists "mts cotizaciones subir"    on storage.objects;
drop policy if exists "mts cotizaciones eliminar" on storage.objects;
create policy "mts cotizaciones ver"      on storage.objects for select to authenticated using (bucket_id = 'cotizaciones' and public.is_owner());
create policy "mts cotizaciones subir"    on storage.objects for insert to authenticated with check (bucket_id = 'cotizaciones' and public.is_owner());
create policy "mts cotizaciones eliminar" on storage.objects for delete to authenticated using (bucket_id = 'cotizaciones' and public.is_owner());

-- Comprobación: debe decir "sí" para MMORA. Si dice "no", avisar antes de usar la sección.
select case when exists (select 1 from public.profiles where username = 'MMORA' and owner and active)
            then 'Actualización 7 lista ✔ — MMORA tiene acceso a las cotizaciones: sí'
            else 'ATENCIÓN: MMORA no está marcado como usuario principal (owner) — acceso: no' end as resultado;
