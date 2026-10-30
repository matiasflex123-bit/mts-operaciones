-- ════════════════════════════════════════════════════════════════════
--  MTS · Actualización 3: Levantamientos
--  · Nuevo estado "finalizado" (después de aprobado o rechazado)
--  · Al aprobar un levantamiento se crea automáticamente el proyecto (estado Nuevo)
--  Se puede volver a ejecutar sin problema.
-- ════════════════════════════════════════════════════════════════════

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

select 'Actualización 3 lista ✔' as resultado;
