-- ════════════════════════════════════════════════════════════════════
--  MTS · Actualización 4: Reparaciones
--  Estados: Ingresada → En diagnóstico → En reparación → Pendiente de facturación → Finalizado
--  Se puede volver a ejecutar sin problema.
-- ════════════════════════════════════════════════════════════════════

alter table public.records drop constraint if exists records_kind_check;
alter table public.records add constraint records_kind_check check (kind in ('proyecto','levantamiento','mantencion','reparacion'));
alter table public.records drop constraint if exists status_ok;
alter table public.records add constraint status_ok check (
  (kind = 'proyecto'      and status in ('nuevo','abastecimiento','proceso','facturacion','finalizado')) or
  (kind = 'levantamiento' and status in ('visita_pendiente','visita_realizada','aprobado','rechazado','finalizado')) or
  (kind = 'mantencion'    and status in ('activa','pausada','finalizada')) or
  (kind = 'reparacion'    and status in ('ingresada','diagnostico','reparacion','facturacion','finalizado'))
);

create sequence if not exists public.seq_reparacion;
grant usage on sequence public.seq_reparacion to authenticated;

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
    elsif new.kind = 'mantencion' then
      new.code := 'MAN-' || lpad(nextval('public.seq_mantencion')::text, 4, '0');
      new.status := coalesce(nullif(new.status, ''), 'activa');
      if new.next_date is null then new.next_date := coalesce(new.start_date, (now() at time zone 'America/Santiago')::date); end if;
      if new.frequency = '' then new.frequency := 'mensual'; end if;
    else
      new.code := 'REP-' || lpad(nextval('public.seq_reparacion')::text, 4, '0');
      new.status := coalesce(nullif(new.status, ''), 'ingresada');
      if new.start_date is null then new.start_date := (now() at time zone 'America/Santiago')::date; end if;
    end if;
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.created_at := now();
  else
    new.code := old.code; new.kind := old.kind; new.created_by := old.created_by; new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end $$;

select 'Actualización 4 lista ✔' as resultado;
