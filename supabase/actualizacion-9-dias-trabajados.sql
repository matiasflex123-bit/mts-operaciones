-- ════════════════════════════════════════════════════════════════════
--  MTS SECURITY · Actualización 9: Rendición de días de trabajo con código
--  Pegar completo en Supabase → SQL Editor → Run. Se puede volver a ejecutar.
--  · MMORA genera un código por día de trabajo, asociado a un proyecto /
--    mantención / reparación / levantamiento, con el valor del día.
--  · El técnico ingresa el código en "Rendir día de trabajo"; recién ahí ve el
--    trabajo y el valor, y su día queda "por pagar" a su nombre.
--  · Cada técnico ve solo sus días; solo MMORA ve todo y marca los pagos.
-- ════════════════════════════════════════════════════════════════════

-- Usuario principal (MMORA)
create or replace function public.mts_is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                  where id = auth.uid() and active and owner and role = 'admin' and username = 'MMORA');
$$;

-- ───────────── Tablas ─────────────
create table if not exists public.work_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique check (code ~ '^[A-Z0-9]{6,12}$'),
  record_id   uuid not null references public.records(id) on delete cascade,
  tech_id     uuid references public.profiles(id) on delete set null,
  work_date   date not null,
  expires_on  date not null,
  rate        integer not null check (rate >= 0),
  notes       text not null default '' check (length(notes) <= 500),
  used_at     timestamptz,
  used_by     uuid references public.profiles(id) on delete set null,
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now()
);

create table if not exists public.workdays (
  id           uuid primary key default gen_random_uuid(),
  code_id      uuid unique references public.work_codes(id) on delete set null,
  code         text not null,
  record_id    uuid references public.records(id) on delete set null,
  record_code  text not null default '',
  record_name  text not null default '',
  record_kind  text not null default '',
  client       text not null default '',
  user_id      uuid not null references public.profiles(id) on delete cascade,
  work_date    date not null,
  rate         integer not null check (rate >= 0),
  start_time   text not null default '',
  end_time     text not null default '',
  summary      text not null default '' check (length(summary) <= 2000),
  status       text not null default 'pendiente' check (status in ('pendiente','pagado')),
  paid_date    date,
  pay_method   text not null default '',
  pay_note     text not null default '',
  entry_id     uuid references public.entries(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists workdays_user_idx on public.workdays (user_id, work_date desc);
create index if not exists workdays_status_idx on public.workdays (status, work_date desc);

-- Intentos de código (para bloquear a quien prueba códigos al azar)
create table if not exists public.work_code_attempts (
  id       bigserial primary key,
  user_id  uuid not null,
  at       timestamptz not null default now(),
  ok       boolean not null default false
);
create index if not exists work_code_attempts_idx on public.work_code_attempts (user_id, at desc);

-- ───────────── Permisos ─────────────
alter table public.work_codes enable row level security;
alter table public.workdays enable row level security;
alter table public.work_code_attempts enable row level security;

revoke all on public.work_codes, public.workdays, public.work_code_attempts from anon, authenticated;
grant select, insert, delete on public.work_codes to authenticated;
grant select, delete on public.workdays to authenticated;
grant update (status, paid_date, pay_method, pay_note, rate) on public.workdays to authenticated;

do $$ declare p record;
begin
  for p in select policyname, tablename from pg_policies where schemaname = 'public'
           and tablename in ('work_codes','workdays','work_code_attempts') loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- Códigos: solo MMORA los ve, crea y elimina (los técnicos nunca leen esta tabla)
create policy "principal ve codigos"     on public.work_codes for select to authenticated using (public.mts_is_owner());
create policy "principal crea codigos"   on public.work_codes for insert to authenticated with check (public.mts_is_owner());
create policy "principal elimina codigos sin usar" on public.work_codes for delete to authenticated using (public.mts_is_owner() and used_at is null);

-- Días: cada técnico ve los suyos; MMORA ve todos, marca pagos y corrige
create policy "ver dias propios o principal" on public.workdays for select to authenticated
  using (public.mts_is_owner() or (public.is_active() and user_id = auth.uid()));
create policy "principal marca pagos"   on public.workdays for update to authenticated using (public.mts_is_owner()) with check (public.mts_is_owner());
create policy "principal elimina dias"  on public.workdays for delete to authenticated using (public.mts_is_owner());
-- (sin políticas en work_code_attempts: solo la usan las funciones de abajo)

-- ───────────── Funciones ─────────────
create or replace function public.mts_norm_code(p text) returns text
language sql immutable as $$ select upper(regexp_replace(coalesce(p, ''), '[^A-Za-z0-9]', '', 'g')) $$;

-- Validación interna: límite de intentos, existencia, uso, técnico asignado y vencimiento
create or replace function public.work_code_validate(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_code  text := public.mts_norm_code(p_code);
  v_fails int;
  v_err   text;
  c       public.work_codes;
  today   date := (now() at time zone 'America/Santiago')::date;
begin
  if auth.uid() is null or not public.is_active() then
    return jsonb_build_object('ok', false, 'error', 'Sesión no válida, vuelve a ingresar');
  end if;
  select count(*) into v_fails from public.work_code_attempts
   where user_id = auth.uid() and not ok and at > now() - interval '15 minutes';
  if v_fails >= 5 then
    return jsonb_build_object('ok', false, 'error', 'Demasiados intentos fallidos. Espera 15 minutos y vuelve a intentar.');
  end if;
  if length(v_code) < 6 then
    return jsonb_build_object('ok', false, 'error', 'Ingresa el código completo que te entregó tu supervisor');
  end if;
  select * into c from public.work_codes where code = v_code;
  if not found then
    v_err := 'Código no válido. Revísalo con tu supervisor.';
  elsif c.used_at is not null then
    v_err := case when c.used_by = auth.uid() then 'Ya usaste este código.' else 'Este código ya fue usado.' end;
  elsif c.tech_id is not null and c.tech_id <> auth.uid() then
    v_err := 'Este código fue asignado a otro técnico.';
  elsif c.expires_on < today then
    v_err := 'Este código venció el ' || to_char(c.expires_on, 'DD-MM-YYYY') || '.';
  end if;
  insert into public.work_code_attempts (user_id, ok) values (auth.uid(), v_err is null);
  if v_err is not null then return jsonb_build_object('ok', false, 'error', v_err); end if;
  return jsonb_build_object('ok', true, 'id', c.id);
end $$;
revoke all on function public.work_code_validate(text) from public, anon, authenticated;

-- Paso 1 del técnico: muestra el trabajo y el valor del día asociados al código
create or replace function public.work_code_check(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v jsonb; c public.work_codes; r public.records;
begin
  v := public.work_code_validate(p_code);
  if not coalesce((v->>'ok')::boolean, false) then return v; end if;
  select * into c from public.work_codes where id = (v->>'id')::uuid;
  select * into r from public.records where id = c.record_id;
  return jsonb_build_object(
    'ok', true, 'code', c.code, 'workDate', c.work_date, 'expiresOn', c.expires_on, 'rate', c.rate, 'notes', c.notes,
    'record', jsonb_build_object('id', r.id, 'code', r.code, 'name', r.name, 'kind', r.kind, 'status', r.status,
      'client', r.client, 'address', r.address, 'contact', r.contact, 'contactPhone', r.contact_phone, 'responsible', r.responsible));
end $$;

-- Paso 2 del técnico: rinde el día (queda "por pagar", se quema el código y se anota en la bitácora sin montos)
create or replace function public.work_code_redeem(p_code text, p_start text default '', p_end text default '', p_summary text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v jsonb; c public.work_codes; r public.records; e_id uuid; w_id uuid;
  v_sum   text := left(trim(coalesce(p_summary, '')), 2000);
  v_start text := left(trim(coalesce(p_start, '')), 5);
  v_end   text := left(trim(coalesce(p_end, '')), 5);
begin
  if length(v_sum) < 5 then return jsonb_build_object('ok', false, 'error', 'Describe brevemente el trabajo que realizaste'); end if;
  v := public.work_code_validate(p_code);
  if not coalesce((v->>'ok')::boolean, false) then return v; end if;
  select * into c from public.work_codes where id = (v->>'id')::uuid for update;
  if c.used_at is not null then return jsonb_build_object('ok', false, 'error', 'Este código ya fue usado.'); end if;
  if exists (select 1 from public.workdays where user_id = auth.uid() and record_id = c.record_id and work_date = c.work_date) then
    return jsonb_build_object('ok', false, 'error', 'Ya rendiste el día ' || to_char(c.work_date, 'DD-MM-YYYY') || ' en este trabajo.');
  end if;
  select * into r from public.records where id = c.record_id;
  insert into public.entries (record_id, type, text, user_id)
  values (c.record_id, 'avance',
          left('Día de trabajo rendido · ' || to_char(c.work_date, 'DD-MM-YYYY')
               || case when v_start <> '' or v_end <> '' then ' · ' || coalesce(nullif(v_start, ''), '¿?') || ' a ' || coalesce(nullif(v_end, ''), '¿?') else '' end
               || E'\n' || v_sum, 5000),
          auth.uid())
  returning id into e_id;
  insert into public.workdays (code_id, code, record_id, record_code, record_name, record_kind, client, user_id,
                               work_date, rate, start_time, end_time, summary, entry_id)
  values (c.id, c.code, r.id, coalesce(r.code, ''), r.name, r.kind, coalesce(r.client, ''), auth.uid(),
          c.work_date, c.rate, v_start, v_end, v_sum, e_id)
  returning id into w_id;
  update public.work_codes set used_at = now(), used_by = auth.uid() where id = c.id;
  return jsonb_build_object('ok', true, 'id', w_id, 'rate', c.rate, 'workDate', c.work_date);
end $$;

revoke all on function public.work_code_check(text) from public, anon;
revoke all on function public.work_code_redeem(text, text, text, text) from public, anon;
grant execute on function public.work_code_check(text) to authenticated;
grant execute on function public.work_code_redeem(text, text, text, text) to authenticated;
grant execute on function public.mts_is_owner() to authenticated;
