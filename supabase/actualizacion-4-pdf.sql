-- MTS Operaciones · Actualización 4: permitir adjuntar PDF en la bitácora
-- Ejecutar una vez en Supabase → SQL Editor.
update storage.buckets
   set allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf'],
       file_size_limit    = 20971520   -- 20 MB
 where id = 'fotos';
