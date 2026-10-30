-- ════════════════════════════════════════════════════════════════════
--  MTS SECURITY SPA · Plataforma interna de operaciones
--  Instalación de la base de datos en Supabase (pegar completo en SQL Editor → Run)
--  Se puede volver a ejecutar sin perder datos.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto with schema extensions;

-- ───────────── Tablas ─────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique,
  name        text not null,
  role        text not null default 'tecnico' check (role in ('admin','tecnico')),
  cargo       text not null default '',
  phone       text not null default '',
  email       text not null default '',
  active      boolean not null default true,
  owner       boolean not null default false,
  created_at  timestamptz not null default now(),
  created_by  uuid,
  last_login  timestamptz
);

create sequence if not exists public.seq_proyecto;
create sequence if not exists public.seq_levantamiento;

create table if not exists public.records (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('proyecto','levantamiento')),
  code          text unique,
  name          text not null check (length(trim(name)) > 0),
  client        text not null default '',
  address       text not null default '',
  contact       text not null default '',
  contact_phone text not null default '',
  responsible   text not null default '',
  start_date    date,
  end_date      date,
  description   text not null default '',
  network       text not null default '',
  priority      text not null default 'media' check (priority in ('baja','media','alta')),
  status        text not null,
  from_levantamiento uuid references public.records(id) on delete set null,
  to_proyecto   uuid references public.records(id) on delete set null,
  created_by    uuid default auth.uid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint status_ok check (
    (kind = 'proyecto' and status in ('nuevo','abastecimiento','proceso','facturacion','finalizado')) or
    (kind = 'levantamiento' and status in ('visita_pendiente','visita_realizada','aprobado','rechazado'))
  )
);

create table if not exists public.status_history (
  id          bigserial primary key,
  record_id   uuid not null references public.records(id) on delete cascade,
  status      text not null,
  from_status text,
  by          uuid,
  at          timestamptz not null default now(),
  note        text not null default ''
);

create table if not exists public.entries (
  id         uuid primary key default gen_random_uuid(),
  record_id  uuid not null references public.records(id) on delete cascade,
  type       text not null default 'comentario' check (type in ('comentario','avance','incidencia','material')),
  text       text not null default '' check (length(text) <= 5000),
  user_id    uuid not null default auth.uid(),
  at         timestamptz not null default now(),
  edited_at  timestamptz
);

create table if not exists public.photos (
  id         uuid primary key default gen_random_uuid(),
  record_id  uuid not null references public.records(id) on delete cascade,
  entry_id   uuid references public.entries(id) on delete cascade,
  path       text not null,
  user_id    uuid not null default auth.uid(),
  at         timestamptz not null default now()
);

create table if not exists public.equipment (
  id         uuid primary key default gen_random_uuid(),
  record_id  uuid not null references public.records(id) on delete cascade,
  type       text not null default '',
  brand      text not null default '',
  model      text not null default '',
  ip         text not null default '',
  port       text not null default '',
  mac        text not null default '',
  serial     text not null default '',
  location   text not null default '',
  username   text not null default '',
  password   text not null default '',
  notes      text not null default '',
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_by uuid,
  updated_at timestamptz
);

create table if not exists public.activity (
  id        bigserial primary key,
  record_id uuid references public.records(id) on delete cascade,
  user_id   uuid,
  at        timestamptz not null default now(),
  action    text not null,
  detail    text not null default ''
);

create index if not exists entries_record_idx   on public.entries(record_id, at);
create index if not exists photos_record_idx    on public.photos(record_id);
create index if not exists equipment_record_idx on public.equipment(record_id);
create index if not exists activity_at_idx      on public.activity(at desc);
create index if not exists activity_record_idx  on public.activity(record_id, at desc);
create index if not exists history_record_idx   on public.status_history(record_id, at);

-- ───────────── Funciones de permisos ─────────────
create or replace function public.is_active() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active);
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active and role = 'admin');
$$;

-- ───────────── Disparadores: códigos, historial y actividad ─────────────
create or replace function public.trg_records_before() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.kind = 'proyecto' then
      new.code := 'PRY-' || lpad(nextval('public.seq_proyecto')::text, 4, '0');
      new.status := coalesce(nullif(new.status, ''), 'nuevo');
    else
      new.code := 'LEV-' || lpad(nextval('public.seq_levantamiento')::text, 4, '0');
      new.status := coalesce(nullif(new.status, ''), 'visita_pendiente');
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
  elsif (new.name, new.client, new.address, new.contact, new.contact_phone, new.responsible, new.start_date, new.end_date, new.description, new.network, new.priority)
        is distinct from
        (old.name, old.client, old.address, old.contact, old.contact_phone, old.responsible, old.start_date, old.end_date, old.description, old.network, old.priority) then
    insert into activity(record_id, user_id, action) values (new.id, auth.uid(), 'editó la ficha');
  end if;
  return null;
end $$;

drop trigger if exists records_before on public.records;
create trigger records_before before insert or update on public.records for each row execute function public.trg_records_before();
drop trigger if exists records_after on public.records;
create trigger records_after after insert or update on public.records for each row execute function public.trg_records_after();

create or replace function public.trg_entries() returns trigger
language plpgsql security definer set search_path = public as $$
declare lbl text;
begin
  if tg_op = 'INSERT' then
    lbl := case new.type when 'avance' then 'registró un avance' when 'incidencia' then 'reportó una incidencia'
                         when 'material' then 'registró material' else 'comentó' end;
    insert into activity(record_id, user_id, action, detail) values (new.record_id, new.user_id, lbl, left(new.text, 120));
    update records set updated_at = now() where id = new.record_id;
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
drop trigger if exists entries_ins on public.entries;
create trigger entries_ins after insert on public.entries for each row execute function public.trg_entries();
drop trigger if exists entries_upd on public.entries;
create trigger entries_upd before update on public.entries for each row execute function public.trg_entries();
drop trigger if exists entries_del on public.entries;
create trigger entries_del after delete on public.entries for each row execute function public.trg_entries();

create or replace function public.trg_equipment() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into activity(record_id, user_id, action, detail)
      values (new.record_id, auth.uid(), 'agregó un equipo', concat_ws(' · ', nullif(new.type,''), nullif(new.model,''), nullif(new.ip,'')));
    update records set updated_at = now() where id = new.record_id;
    return new;
  elsif tg_op = 'UPDATE' then
    new.record_id := old.record_id; new.created_by := old.created_by; new.created_at := old.created_at;
    new.updated_by := auth.uid(); new.updated_at := now();
    insert into activity(record_id, user_id, action, detail)
      values (new.record_id, auth.uid(), 'editó un equipo', concat_ws(' · ', nullif(new.type,''), nullif(new.ip,'')));
    return new;
  else
    insert into activity(record_id, user_id, action, detail)
      values (old.record_id, auth.uid(), 'eliminó un equipo', concat_ws(' · ', nullif(old.type,''), nullif(old.ip,'')));
    return old;
  end if;
end $$;
drop trigger if exists equipment_ins on public.equipment;
create trigger equipment_ins after insert on public.equipment for each row execute function public.trg_equipment();
drop trigger if exists equipment_upd on public.equipment;
create trigger equipment_upd before update on public.equipment for each row execute function public.trg_equipment();
drop trigger if exists equipment_del on public.equipment;
create trigger equipment_del after delete on public.equipment for each row execute function public.trg_equipment();

-- ───────────── Seguridad por filas (RLS) ─────────────
alter table public.profiles       enable row level security;
alter table public.records        enable row level security;
alter table public.status_history enable row level security;
alter table public.entries        enable row level security;
alter table public.photos         enable row level security;
alter table public.equipment      enable row level security;
alter table public.activity       enable row level security;

revoke all on public.profiles, public.records, public.status_history, public.entries, public.photos, public.equipment, public.activity from anon;
revoke all on public.profiles, public.records, public.status_history, public.entries, public.photos, public.equipment, public.activity from authenticated;

grant select on public.profiles, public.records, public.status_history, public.entries, public.photos, public.equipment, public.activity to authenticated;
grant insert, update, delete on public.records to authenticated;
grant insert, delete on public.entries, public.photos, public.equipment to authenticated;
grant update (text) on public.entries to authenticated;
grant update (type, brand, model, ip, port, mac, serial, location, username, password, notes) on public.equipment to authenticated;
grant usage on sequence public.seq_proyecto, public.seq_levantamiento to authenticated;

do $$ declare t text; p record;
begin
  -- limpiar políticas anteriores para poder re-ejecutar
  for p in select policyname, tablename from pg_policies where schemaname = 'public'
           and tablename in ('profiles','records','status_history','entries','photos','equipment','activity') loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
  foreach t in array array['profiles','records','status_history','entries','photos','equipment','activity'] loop
    execute format('create policy "ver (usuarios activos)" on public.%I for select to authenticated using (public.is_active())', t);
  end loop;
end $$;

-- Proyectos / levantamientos: solo administradores crean, editan, cambian estado o eliminan
create policy "admin crea"    on public.records for insert to authenticated with check (public.is_admin());
create policy "admin edita"   on public.records for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin elimina" on public.records for delete to authenticated using (public.is_admin());

-- Bitácora: todos publican a su nombre; editan solo lo suyo (o admin); solo admin elimina
create policy "publicar"       on public.entries for insert to authenticated with check (public.is_active() and user_id = auth.uid());
create policy "editar propio"  on public.entries for update to authenticated using (public.is_admin() or (public.is_active() and user_id = auth.uid()));
create policy "admin elimina"  on public.entries for delete to authenticated using (public.is_admin());

-- Fotos
create policy "subir"          on public.photos for insert to authenticated with check (public.is_active() and user_id = auth.uid());
create policy "admin elimina"  on public.photos for delete to authenticated using (public.is_admin());

-- Equipos
create policy "agregar"        on public.equipment for insert to authenticated with check (public.is_active() and created_by = auth.uid());
create policy "editar propio"  on public.equipment for update to authenticated using (public.is_admin() or (public.is_active() and created_by = auth.uid()));
create policy "admin elimina"  on public.equipment for delete to authenticated using (public.is_admin());

-- ───────────── Funciones (RPC) ─────────────
create or replace function public.set_status(p_record uuid, p_status text, p_note text default '')
returns void language plpgsql security invoker set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Solo un administrador puede cambiar el estado'; end if;
  perform set_config('mts.status_note', left(coalesce(p_note, ''), 300), true);
  update records set status = p_status where id = p_record;
  if not found then raise exception 'Registro no encontrado'; end if;
end $$;

create or replace function public.convert_levantamiento(p_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare l records; new_id uuid;
begin
  if not public.is_admin() then raise exception 'Solo un administrador puede crear proyectos'; end if;
  select * into l from records where id = p_id and kind = 'levantamiento';
  if not found then raise exception 'Levantamiento no encontrado'; end if;
  if l.status <> 'aprobado' then raise exception 'El levantamiento debe estar aprobado'; end if;
  if l.to_proyecto is not null then raise exception 'Este levantamiento ya tiene un proyecto creado'; end if;
  insert into records(kind, name, client, address, contact, contact_phone, responsible, description, network, priority, status, from_levantamiento)
    values ('proyecto', l.name, l.client, l.address, l.contact, l.contact_phone, l.responsible, l.description, l.network, l.priority, 'nuevo', l.id)
    returning id into new_id;
  insert into equipment(record_id, type, brand, model, ip, port, mac, serial, location, username, password, notes, created_by)
    select new_id, type, brand, model, ip, port, mac, serial, location, username, password, notes, auth.uid() from equipment where record_id = l.id;
  update records set to_proyecto = new_id where id = l.id;
  insert into activity(record_id, user_id, action, detail) values (l.id, auth.uid(), 'generó el proyecto', (select code from records where id = new_id));
  return new_id;
end $$;

create or replace function public.touch_login() returns void
language sql security definer set search_path = public as $$
  update public.profiles set last_login = now() where id = auth.uid();
$$;

-- Crear usuario (solo admin). El acceso es con "usuario"; internamente se usa un correo interno.
create or replace function public.admin_create_user(
  p_username text, p_password text, p_name text, p_role text default 'tecnico',
  p_cargo text default '', p_phone text default '', p_email text default '', p_owner boolean default false
) returns uuid language plpgsql security definer set search_path = public, extensions, auth as $$
declare uid uuid := gen_random_uuid(); uname text := upper(regexp_replace(coalesce(p_username,''), '\s', '', 'g'));
        mail text;
begin
  if auth.uid() is not null and not public.is_admin() then raise exception 'Solo un administrador puede crear usuarios'; end if;
  if uname !~ '^[A-Z0-9._-]{3,30}$' then raise exception 'El usuario debe tener 3 a 30 caracteres (letras, números, punto o guion)'; end if;
  if length(coalesce(p_password,'')) < 6 then raise exception 'La contraseña debe tener al menos 6 caracteres'; end if;
  if coalesce(trim(p_name),'') = '' then raise exception 'El nombre es obligatorio'; end if;
  if exists (select 1 from public.profiles where username = uname) then raise exception 'Ese nombre de usuario ya existe'; end if;
  mail := lower(uname) || '@usuarios.mts-security.cl';
  if exists (select 1 from auth.users where email = mail) then raise exception 'Ese nombre de usuario ya existe'; end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', mail,
          extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}', jsonb_build_object('username', uname, 'name', p_name),
          now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', mail, 'email_verified', true),
          'email', now(), now(), now());

  insert into public.profiles (id, username, name, role, cargo, phone, email, owner, created_by)
  values (uid, uname, trim(p_name), case when p_role = 'admin' then 'admin' else 'tecnico' end,
          coalesce(p_cargo,''), coalesce(p_phone,''), coalesce(p_email,''), coalesce(p_owner,false), auth.uid());
  return uid;
end $$;

create or replace function public.admin_update_user(
  p_id uuid, p_name text default null, p_role text default null, p_cargo text default null,
  p_phone text default null, p_email text default null, p_active boolean default null
) returns void language plpgsql security definer set search_path = public, auth as $$
declare u public.profiles;
begin
  if not public.is_admin() then raise exception 'Solo un administrador puede editar usuarios'; end if;
  select * into u from public.profiles where id = p_id;
  if not found then raise exception 'Usuario no encontrado'; end if;
  if p_role is not null and u.owner then raise exception 'No se puede cambiar el rol del usuario principal'; end if;
  if p_active is not null and (u.owner or u.id = auth.uid()) then raise exception 'No puedes desactivar este usuario'; end if;
  update public.profiles set
    name   = coalesce(nullif(trim(p_name),''), name),
    role   = case when p_role is null then role when p_role = 'admin' then 'admin' else 'tecnico' end,
    cargo  = coalesce(p_cargo, cargo),
    phone  = coalesce(p_phone, phone),
    email  = coalesce(p_email, email),
    active = coalesce(p_active, active)
  where id = p_id;
  if p_active is not null then
    update auth.users set banned_until = case when p_active then null else 'infinity'::timestamptz end where id = p_id;
    if not p_active then delete from auth.sessions where user_id = p_id; end if;
  end if;
end $$;

create or replace function public.admin_set_password(p_id uuid, p_password text)
returns void language plpgsql security definer set search_path = public, extensions, auth as $$
declare u public.profiles;
begin
  if not public.is_admin() then raise exception 'Solo un administrador puede cambiar contraseñas'; end if;
  select * into u from public.profiles where id = p_id;
  if not found then raise exception 'Usuario no encontrado'; end if;
  if u.owner and u.id <> auth.uid() then raise exception 'Solo el usuario principal puede cambiar su propia clave'; end if;
  if length(coalesce(p_password,'')) < 6 then raise exception 'La contraseña debe tener al menos 6 caracteres'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now() where id = p_id;
end $$;

revoke execute on function public.admin_create_user(text,text,text,text,text,text,text,boolean) from public, anon;
revoke execute on function public.admin_update_user(uuid,text,text,text,text,text,boolean) from public, anon;
revoke execute on function public.admin_set_password(uuid,text) from public, anon;
revoke execute on function public.convert_levantamiento(uuid) from public, anon;
revoke execute on function public.set_status(uuid,text,text) from public, anon;
revoke execute on function public.touch_login() from public, anon;
grant execute on function public.admin_create_user(text,text,text,text,text,text,text,boolean) to authenticated;
grant execute on function public.admin_update_user(uuid,text,text,text,text,text,boolean) to authenticated;
grant execute on function public.admin_set_password(uuid,text) to authenticated;
grant execute on function public.convert_levantamiento(uuid) to authenticated;
grant execute on function public.set_status(uuid,text,text) to authenticated;
grant execute on function public.touch_login() to authenticated;

-- ───────────── Fotos (Storage) ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "mts fotos ver" on storage.objects;
drop policy if exists "mts fotos subir" on storage.objects;
drop policy if exists "mts fotos eliminar" on storage.objects;
create policy "mts fotos ver"      on storage.objects for select to authenticated using (bucket_id = 'fotos' and public.is_active());
create policy "mts fotos subir"    on storage.objects for insert to authenticated with check (bucket_id = 'fotos' and public.is_active());
create policy "mts fotos eliminar" on storage.objects for delete to authenticated using (bucket_id = 'fotos' and public.is_admin());

-- ───────────── Tiempo real (la bitácora se actualiza sola) ─────────────
do $$ begin
  alter publication supabase_realtime add table public.entries, public.equipment, public.records;
exception when others then null;
end $$;

-- ───────────── Mantenciones y notificaciones (actualización 2) ─────────────
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


-- ───────────── Levantamientos: finalizado + proyecto automático (actualización 3) ─────────────
alter table public.records drop constraint if exists status_ok;
alter table public.records add constraint status_ok check (
  (kind = 'proyecto'      and status in ('nuevo','abastecimiento','proceso','facturacion','finalizado')) or
  (kind = 'levantamiento' and status in ('visita_pendiente','visita_realizada','aprobado','rechazado','finalizado')) or
  (kind = 'mantencion'    and status in ('activa','pausada','finalizada'))
);

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
    -- Levantamiento aprobado → se crea el proyecto automáticamente (una sola vez)
    if new.kind = 'levantamiento' and new.status = 'aprobado' and new.to_proyecto is null then
      perform public.convert_levantamiento(new.id);
    end if;
  elsif (new.name, new.client, new.address, new.contact, new.contact_phone, new.responsible, new.start_date, new.end_date, new.description, new.network, new.priority, new.frequency, new.next_date)
        is distinct from
        (old.name, old.client, old.address, old.contact, old.contact_phone, old.responsible, old.start_date, old.end_date, old.description, old.network, old.priority, old.frequency, old.next_date)
        and current_setting('mts.auto', true) is distinct from '1' then
    insert into activity(record_id, user_id, action) values (new.id, auth.uid(), 'editó la ficha');
  end if;
  return null;
end $$;


-- ───────────── Usuario principal ─────────────
-- Se crea aparte (una sola vez), para no dejar la contraseña escrita en este archivo:
--   select public.admin_create_user('MMORA', 'TU_CLAVE', 'Matías Mora', 'admin', 'Gerente General', '', '', true);

select 'Instalación lista ✔ — usuarios: ' || count(*) as resultado from public.profiles;
