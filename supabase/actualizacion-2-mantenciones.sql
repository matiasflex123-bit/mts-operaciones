-- ════════════════════════════════════════════════════════════════════
--  MTS · Actualización 2: Mantenciones + notificaciones
--  Ejecutar en Supabase → SQL Editor. Se puede volver a ejecutar sin problema.
-- ════════════════════════════════════════════════════════════════════

-- Nuevas columnas
alter table public.records  add column if not exists frequency text not null default '';
alter table public.records  add column if not exists next_date date;
alter table public.records  add column if not exists last_date date;
alter table public.profiles add column if not exists notif_seen_at timestamptz not null default now();

-- Tipo "mantencion" y sus estados
alter table public.records drop constraint if exists records_kind_check;
alter table public.records add constraint records_kind_check check (kind in ('proyecto','levantamiento','mantencion'));
alter table public.records drop constraint if exists status_ok;
alter table public.records add constraint status_ok check (
  (kind = 'proyecto'      and status in ('nuevo','abastecimiento','proceso','facturacion','finalizado')) or
  (kind = 'levantamiento' and status in ('visita_pendiente','visita_realizada','aprobado','rechazado')) or
  (kind = 'mantencion'    and status in ('activa','pausada','finalizada'))
);
alter table public.records drop constraint if exists frequency_ok;
alter table public.records add constraint frequency_ok check (frequency in ('','mensual','bimestral','trimestral','semestral','anual'));

-- Tipo de registro "mantención realizada"
alter table public.entries drop constraint if exists entries_type_check;
alter table public.entries add constraint entries_type_check check (type in ('comentario','avance','incidencia','material','mantencion'));

create sequence if not exists public.seq_mantencion;
grant usage on sequence public.seq_mantencion to authenticated;

create or replace function public.next_maintenance(p_from date, p_freq text) returns date
language sql immutable as $$
  select case p_freq
    when 'mensual'    then (p_from + interval '1 month')::date
    when 'bimestral'  then (p_from + interval '2 months')::date
    when 'trimestral' then (p_from + interval '3 months')::date
    when 'semestral'  then (p_from + interval '6 months')::date
    when 'anual'      then (p_from + interval '1 year')::date
    else null end;
$$;

-- Códigos y valores por defecto
create or replace function public.trg_records_before() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.kind = 'proyecto' then
      new.code := 'PRY-' || lpad(nextval('public.seq_proyecto')::text, 4, '0');
      new.status := coalesce(nullif(new.status, ''), 'nuevo');
    elsif new.kind = 'levantamiento' then
      new.code := 'LEV-' || lpad(nextval('public.seq_levantamiento')::text, 4, '0');
      new.status := coalesce(nullif(new.status, ''), 'visita_pendiente');
    else
      new.code := 'MAN-' || lpad(nextval('public.seq_mantencion')::text, 4, '0');
      new.status := coalesce(nullif(new.status, ''), 'activa');
      if new.next_date is null then new.next_date := coalesce(new.start_date, (now() at time zone 'America/Santiago')::date); end if;
      if new.frequency = '' then new.frequency := 'mensual'; end if;
    end if;
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.created_at := now();
  else
    new.code := old.code; new.kind := old.kind; new.created_by := old.created_by; new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end $$;

create or replace function public.trg_records_after() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into status_history(record_id, status, by, note) values (new.id, new.status, auth.uid(), 'Creado');
    insert into activity(record_id, user_id, action, detail) values (new.id, auth.uid(), 'creó', new.code || ' · ' || new.name);
  elsif new.status is distinct from old.status then
    insert into status_history(record_id, status, from_status, by, note)
      values (new.id, new.status, old.status, auth.uid(), coalesce(current_setting('mts.status_note', true), ''));
    insert into activity(record_id, user_id, action, detail) values (new.id, auth.uid(), 'cambió el estado', old.status || ' → ' || new.status);
  elsif (new.name, new.client, new.address, new.contact, new.contact_phone, new.responsible, new.start_date, new.end_date, new.description, new.network, new.priority, new.frequency, new.next_date)
        is distinct from
        (old.name, old.client, old.address, old.contact, old.contact_phone, old.responsible, old.start_date, old.end_date, old.description, old.network, old.priority, old.frequency, old.next_date)
        and current_setting('mts.auto', true) is distinct from '1' then
    insert into activity(record_id, user_id, action) values (new.id, auth.uid(), 'editó la ficha');
  end if;
  return null;
end $$;

-- Al registrar "mantención realizada" se actualiza la última y la próxima fecha
create or replace function public.trg_entries() returns trigger
language plpgsql security definer set search_path = public as $$
declare lbl text; today date := (now() at time zone 'America/Santiago')::date;
begin
  if tg_op = 'INSERT' then
    lbl := case new.type when 'avance' then 'registró un avance' when 'incidencia' then 'reportó una incidencia'
                         when 'material' then 'registró material' when 'mantencion' then 'registró una mantención'
                         else 'comentó' end;
    insert into activity(record_id, user_id, action, detail) values (new.record_id, new.user_id, lbl, left(new.text, 120));
    perform set_config('mts.auto', '1', true);
    if new.type = 'mantencion' then
      update records set last_date = today,
             next_date = coalesce(public.next_maintenance(today, frequency), next_date),
             updated_at = now()
       where id = new.record_id and kind = 'mantencion';
    end if;
    update records set updated_at = now() where id = new.record_id;
    perform set_config('mts.auto', '', true);
    return new;
  elsif tg_op = 'UPDATE' then
    new.record_id := old.record_id; new.user_id := old.user_id; new.at := old.at; new.type := old.type;
    new.edited_at := now();
    return new;
  else
    insert into activity(record_id, user_id, action) values (old.record_id, auth.uid(), 'eliminó un comentario');
    return old;
  end if;
end $$;

-- Notificaciones: marcar como vistas
create or replace function public.mark_notifications_seen() returns void
language sql security definer set search_path = public as $$
  update public.profiles set notif_seen_at = now() where id = auth.uid();
$$;
revoke execute on function public.mark_notifications_seen() from public, anon;
grant execute on function public.mark_notifications_seen() to authenticated;

select 'Actualización 2 lista ✔' as resultado;
