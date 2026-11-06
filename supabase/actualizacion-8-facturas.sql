-- ════════════════════════════════════════════════════════════════════
--  MTS · Actualización 8: Facturas privadas
--  · Sección "Facturas" con dos fases: Emitida → Pagada.
--  · Se adjunta el PDF de la factura y, al pagarla, opcionalmente el
--    comprobante de pago.
--  · SOLO el usuario principal MMORA puede verlas, subirlas, cambiarlas o
--    borrarlas. Técnicos y otros administradores no tienen acceso: la base
--    de datos y el almacenamiento rechazan cualquier intento.
--  Requiere la actualización 7 (función is_owner). Se puede volver a ejecutar.
-- ════════════════════════════════════════════════════════════════════

-- Por si la actualización 7 no se ejecutó: misma regla de dueño.
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid() and active and owner and username = 'MMORA'
  );
$$;
revoke execute on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

-- ───────────── Tabla de facturas ─────────────
create table if not exists public.invoices (
  id          uuid primary key default gen_random_uuid(),
  number      text not null check (length(number) between 1 and 40),
  client      text not null default '' check (length(client) <= 160),
  record_id   uuid references public.records(id) on delete set null,
  amount      numeric(14,0) check (amount is null or amount >= 0),
  issue_date  date not null default (now() at time zone 'America/Santiago')::date,
  due_date    date,
  status      text not null default 'emitida' check (status in ('emitida', 'pagada')),
  paid_date   date,
  pay_method  text not null default '' check (length(pay_method) <= 60),
  path        text not null default '',
  file_name   text not null default '',
  proof_path  text not null default '',
  proof_name  text not null default '',
  notes       text not null default '' check (length(notes) <= 1000),
  user_id     uuid not null default auth.uid(),
  at          timestamptz not null default now(),
  updated_at  timestamptz,
  constraint invoices_paid_date check (status = 'emitida' or paid_date is not null)
);
create index if not exists invoices_status_idx on public.invoices(status, issue_date desc);

alter table public.invoices enable row level security;
revoke all on public.invoices from anon;
revoke all on public.invoices from authenticated;
grant select, insert, update, delete on public.invoices to authenticated;

drop policy if exists "dueño ve facturas"       on public.invoices;
drop policy if exists "dueño crea facturas"     on public.invoices;
drop policy if exists "dueño edita facturas"    on public.invoices;
drop policy if exists "dueño elimina facturas"  on public.invoices;
create policy "dueño ve facturas"      on public.invoices for select to authenticated using (public.is_owner());
create policy "dueño crea facturas"    on public.invoices for insert to authenticated with check (public.is_owner() and user_id = auth.uid());
create policy "dueño edita facturas"   on public.invoices for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy "dueño elimina facturas" on public.invoices for delete to authenticated using (public.is_owner());

-- ───────────── Archivos (almacenamiento privado propio) ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('facturas', 'facturas', false, 20971520, array[
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel',
  'application/xml', 'text/xml'])
on conflict (id) do update set public = false, file_size_limit = 20971520, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "mts facturas ver"      on storage.objects;
drop policy if exists "mts facturas subir"    on storage.objects;
drop policy if exists "mts facturas eliminar" on storage.objects;
create policy "mts facturas ver"      on storage.objects for select to authenticated using (bucket_id = 'facturas' and public.is_owner());
create policy "mts facturas subir"    on storage.objects for insert to authenticated with check (bucket_id = 'facturas' and public.is_owner());
create policy "mts facturas eliminar" on storage.objects for delete to authenticated using (bucket_id = 'facturas' and public.is_owner());

-- Comprobación
select case when exists (select 1 from public.profiles where username = 'MMORA' and owner and active)
            then 'Actualización 8 lista ✔ — MMORA tiene acceso a las facturas: sí'
            else 'ATENCIÓN: MMORA no está marcado como usuario principal (owner) — acceso: no' end as resultado;
