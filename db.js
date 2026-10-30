/* MTS SECURITY · Capa de datos sobre Supabase.
   Mantiene la misma interfaz que la versión con servidor propio: mtsApi(ruta, opciones). */
'use strict';

(function () {
  const CFG = window.MTS_CONFIG || {};
  const MAIL_DOMAIN = '@usuarios.mts-security.cl';
  const BUCKET = 'fotos';

  const configured = CFG.supabaseUrl && CFG.supabaseAnonKey && !CFG.supabaseUrl.includes('PEGAR');
  const sb = configured ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'mts-ops-auth' },
  }) : null;
  window.mtsSupabase = sb;
  window.mtsConfigured = !!configured;

  class ApiError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
  const fail = (status, msg) => { throw new ApiError(status, msg); };

  // ── Traducción de errores al español ──
  function friendly(err) {
    const m = String((err && (err.message || err.error_description)) || err || '');
    if (/Invalid login credentials/i.test(m)) return 'Usuario o contraseña incorrectos';
    if (/banned/i.test(m)) return 'Este usuario está desactivado';
    if (/row-level security|permission denied/i.test(m)) return 'No tienes permiso para realizar esta acción';
    if (/JWT|not authenticated|Auth session missing/i.test(m)) return 'Sesión expirada, vuelve a ingresar';
    if (/Failed to fetch|NetworkError|network/i.test(m)) return 'Sin conexión con el servidor. Revisa tu internet.';
    if (/payload too large|exceeded the maximum/i.test(m)) return 'La foto es demasiado grande';
    return m || 'Ocurrió un error';
  }
  function check({ data, error, count }) {
    if (error) {
      const st = /JWT|Auth session/i.test(error.message || '') ? 401 : error.code === '42501' ? 403 : 400;
      throw new ApiError(st, friendly(error));
    }
    return count !== undefined && count !== null && data === null ? count : data;
  }

  // ── Conversión snake_case ⇄ camelCase ──
  const camel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  const snake = (s) => s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
  const toCamel = (o) => {
    if (Array.isArray(o)) return o.map(toCamel);
    if (!o || typeof o !== 'object') return o;
    const r = {};
    for (const [k, v] of Object.entries(o)) r[camel(k)] = v === null && !['to_proyecto', 'from_levantamiento', 'edited_at', 'last_login', 'updated_at', 'updated_by'].includes(k) ? '' : v;
    return r;
  };
  const RECORD_FIELDS = ['name', 'client', 'address', 'contact', 'contactPhone', 'responsible', 'startDate', 'endDate', 'description', 'network', 'priority', 'frequency', 'nextDate'];
  const EQUIP_FIELDS = ['type', 'brand', 'model', 'ip', 'port', 'mac', 'serial', 'location', 'username', 'password', 'notes'];
  const pick = (body, fields) => {
    const o = {};
    for (const f of fields) if (f in body) {
      let v = body[f] == null ? '' : String(body[f]).trim();
      if ((f === 'startDate' || f === 'endDate' || f === 'nextDate') && !v) v = null;
      o[snake(f)] = v;
    }
    return o;
  };

  // ── Fotos: URLs firmadas (privadas, válidas 1 hora) ──
  const urlCache = new Map(); // path -> {url, exp}
  async function signPaths(paths) {
    const now = Date.now();
    const need = [...new Set(paths)].filter((p) => { const c = urlCache.get(p); return !c || c.exp < now + 60e3; });
    for (let i = 0; i < need.length; i += 100) {
      const chunk = need.slice(i, i + 100);
      const { data, error } = await sb.storage.from(BUCKET).createSignedUrls(chunk, 3600);
      if (error) continue;
      data.forEach((d) => { if (d.signedUrl) urlCache.set(d.path, { url: d.signedUrl, exp: now + 3600e3 }); });
    }
  }
  async function withUrls(photos) {
    await signPaths(photos.map((p) => p.path));
    return photos.map((p) => ({ ...toCamel(p), url: (urlCache.get(p.path) || {}).url || '' }));
  }
  function dataUrlToBlob(dataUrl) {
    const [head, b64] = dataUrl.split(',');
    const mime = /data:([^;]+)/.exec(head)[1];
    const bin = atob(b64); const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(16) + Math.random().toString(16).slice(2));

  // ── Sesión ──
  let meCache = null;
  async function currentUserId() {
    const { data } = await sb.auth.getSession();
    if (!data.session) fail(401, 'Sesión no iniciada');
    return data.session.user.id;
  }
  async function loadMe() {
    const id = await currentUserId();
    const p = check(await sb.from('profiles').select('*').eq('id', id).maybeSingle());
    if (!p) { await sb.auth.signOut(); fail(401, 'Tu usuario no tiene perfil en la plataforma'); }
    if (!p.active) { await sb.auth.signOut(); fail(403, 'Este usuario está desactivado'); }
    meCache = toCamel(p);
    return meCache;
  }
  const requireAdmin = () => { if (!meCache || meCache.role !== 'admin') fail(403, 'Solo un administrador puede realizar esta acción'); };

  function summarize(r) {
    const o = toCamel(r);
    o.counts = { entries: (r.entries && r.entries[0] && r.entries[0].count) || 0, photos: (r.photos && r.photos[0] && r.photos[0].count) || 0, equipment: (r.equipment && r.equipment[0] && r.equipment[0].count) || 0 };
    delete o.entries; delete o.photos; delete o.equipment;
    o.lastActivity = r.updated_at;
    return o;
  }

  // ── Router con la misma forma que la API anterior ──
  async function mtsApi(path, opts = {}) {
    if (!sb) fail(500, 'Falta configurar la conexión con Supabase (archivo config.js)');
    const method = opts.method || 'GET';
    const body = opts.body || {};
    const seg = path.replace(/\?.*$/, '').split('/').filter(Boolean); // ['api', ...]
    const p = '/' + seg.join('/');

    try {
      // Login / logout
      if (p === '/api/login') {
        const username = String(body.username || '').trim().toUpperCase().replace(/\s+/g, '');
        if (!username || !body.password) fail(400, 'Ingresa usuario y contraseña');
        const { error } = await sb.auth.signInWithPassword({ email: username.toLowerCase() + MAIL_DOMAIN, password: String(body.password) });
        if (error) fail(401, friendly(error));
        const user = await loadMe();
        sb.rpc('touch_login').then(() => {}, () => {});
        return { user };
      }
      if (p === '/api/logout') { await sb.auth.signOut(); meCache = null; return { ok: true }; }

      if (p === '/api/me' && method === 'GET') return { user: await loadMe() };
      if (!meCache) await loadMe();
      const me = meCache;

      if (p === '/api/me/password') {
        if (String(body.password || '').length < 6) fail(400, 'La nueva contraseña debe tener al menos 6 caracteres');
        const v = await sb.auth.signInWithPassword({ email: me.username.toLowerCase() + MAIL_DOMAIN, password: String(body.current || '') });
        if (v.error) fail(400, 'La contraseña actual no es correcta');
        const { error } = await sb.auth.updateUser({ password: String(body.password) });
        if (error) fail(400, friendly(error));
        return { ok: true };
      }

      // Usuarios
      if (p === '/api/users' && method === 'GET') {
        return { users: toCamel(check(await sb.from('profiles').select('*').order('name'))) };
      }
      if (p === '/api/users' && method === 'POST') {
        requireAdmin();
        const id = check(await sb.rpc('admin_create_user', {
          p_username: body.username || '', p_password: body.password || '', p_name: body.name || '',
          p_role: body.role === 'admin' ? 'admin' : 'tecnico', p_cargo: body.cargo || '', p_phone: body.phone || '', p_email: body.email || '',
        }));
        return { user: { id } };
      }
      if (seg[1] === 'users' && seg[2] && method === 'PATCH') {
        requireAdmin();
        if (body.password) check(await sb.rpc('admin_set_password', { p_id: seg[2], p_password: String(body.password) }));
        const args = { p_id: seg[2] };
        for (const k of ['name', 'role', 'cargo', 'phone', 'email']) if (k in body) args['p_' + k] = body[k];
        if ('active' in body) args.p_active = !!body.active;
        if (Object.keys(args).length > 1) check(await sb.rpc('admin_update_user', args));
        return { ok: true };
      }

      // Panel
      if (p === '/api/dashboard') {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const [recs, act, today, nPhotos, nEquip, nUsers] = await Promise.all([
          sb.from('records').select('kind,status,next_date'),
          sb.from('activity').select('*, records(id,code,name,kind)').order('id', { ascending: false }).limit(40),
          sb.from('entries').select('id', { count: 'exact', head: true }).gte('at', start.toISOString()),
          sb.from('photos').select('id', { count: 'exact', head: true }),
          sb.from('equipment').select('id', { count: 'exact', head: true }),
          sb.from('profiles').select('id', { count: 'exact', head: true }).eq('active', true),
        ]);
        const STATUSES = {
          proyecto: ['nuevo', 'abastecimiento', 'proceso', 'facturacion', 'finalizado'],
          levantamiento: ['visita_pendiente', 'visita_realizada', 'aprobado', 'rechazado'],
          mantencion: ['activa', 'pausada', 'finalizada'],
        };
        const byStatus = {};
        for (const k of Object.keys(STATUSES)) byStatus[k] = Object.fromEntries(STATUSES[k].map((s) => [s, 0]));
        const soon = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
        let maintDue = 0;
        check(recs).forEach((r) => { byStatus[r.kind][r.status]++; if (r.kind === 'mantencion' && r.status === 'activa' && r.next_date && r.next_date <= soon) maintDue++; });
        const recent = check(act).map((a) => ({ ...toCamel(a), record: a.records || null }));
        return {
          byStatus,
          totals: { maintDue, entriesToday: check(today) || 0, photos: check(nPhotos) || 0, equipment: check(nEquip) || 0, users: check(nUsers) || 0 },
          recent,
        };
      }

      // Registros
      if (p === '/api/records' && method === 'GET') {
        const rows = check(await sb.from('records').select('*, entries(count), photos(count), equipment(count)').order('updated_at', { ascending: false }));
        return { records: rows.map(summarize) };
      }
      if (p === '/api/records' && method === 'POST') {
        requireAdmin();
        if (!String(body.name || '').trim()) fail(400, 'El nombre es obligatorio');
        const row = { kind: body.kind, status: ({ proyecto: 'nuevo', levantamiento: 'visita_pendiente', mantencion: 'activa' })[body.kind], ...pick(body, RECORD_FIELDS) };
        const r = check(await sb.from('records').insert(row).select().single());
        return { record: toCamel(r) };
      }
      if (seg[1] === 'records' && seg[2]) {
        const id = seg[2]; const sub = seg[3];
        if (!sub && method === 'GET') {
          const [rec, ents, eqs, phs, hist, act] = await Promise.all([
            sb.from('records').select('*, entries(count), photos(count), equipment(count)').eq('id', id).maybeSingle(),
            sb.from('entries').select('*').eq('record_id', id).order('at'),
            sb.from('equipment').select('*').eq('record_id', id).order('created_at'),
            sb.from('photos').select('*').eq('record_id', id).order('at'),
            sb.from('status_history').select('*').eq('record_id', id).order('id'),
            sb.from('activity').select('*').eq('record_id', id).order('id', { ascending: false }).limit(100),
          ]);
          const r = check(rec);
          if (!r) fail(404, 'Registro no encontrado');
          const record = summarize(r);
          record.statusHistory = check(hist).map(toCamel);
          const photos = await withUrls(check(phs));
          const entries = check(ents).map((e) => ({ ...toCamel(e), photos: photos.filter((x) => x.entryId === e.id).map((x) => x.id) }));
          return { record, entries, equipment: check(eqs).map(toCamel), photos, activity: check(act).map(toCamel) };
        }
        if (!sub && method === 'PATCH') {
          requireAdmin();
          if ('name' in body && !String(body.name).trim()) fail(400, 'El nombre es obligatorio');
          const r = check(await sb.from('records').update(pick(body, RECORD_FIELDS)).eq('id', id).select().single());
          return { record: toCamel(r) };
        }
        if (!sub && method === 'DELETE') {
          requireAdmin();
          const phs = check(await sb.from('photos').select('path').eq('record_id', id));
          for (let i = 0; i < phs.length; i += 100) await sb.storage.from(BUCKET).remove(phs.slice(i, i + 100).map((x) => x.path));
          check(await sb.from('records').delete().eq('id', id));
          return { ok: true };
        }
        if (sub === 'status') { requireAdmin(); check(await sb.rpc('set_status', { p_record: id, p_status: body.status, p_note: body.note || '' })); return { ok: true }; }
        if (sub === 'convert') { requireAdmin(); const nid = check(await sb.rpc('convert_levantamiento', { p_id: id })); return { record: { id: nid, code: 'Proyecto' } }; }
        if (sub === 'entries') {
          const text = String(body.text || '').trim().slice(0, 5000);
          const photos = Array.isArray(body.photos) ? body.photos.slice(0, 12) : [];
          if (!text && !photos.length) fail(400, 'Escribe un comentario o adjunta una foto');
          const e = check(await sb.from('entries').insert({ record_id: id, type: body.type || 'comentario', text, user_id: me.id }).select().single());
          let failed = 0;
          for (const dataUrl of photos) {
            const path = `${id}/${e.id}/${uuid()}.jpg`;
            const up = await sb.storage.from(BUCKET).upload(path, dataUrlToBlob(dataUrl), { contentType: 'image/jpeg', upsert: false });
            if (up.error) { failed++; continue; }
            const ins = await sb.from('photos').insert({ record_id: id, entry_id: e.id, path, user_id: me.id });
            if (ins.error) failed++;
          }
          if (failed) fail(400, `Se publicó el texto, pero ${failed} foto(s) no se pudieron subir`);
          return { entry: toCamel(e) };
        }
        if (sub === 'equipment') {
          const row = pick(body, EQUIP_FIELDS);
          if (!row.type && !row.ip && !row.model) fail(400, 'Completa al menos el tipo, modelo o IP');
          const eq = check(await sb.from('equipment').insert({ record_id: id, created_by: me.id, ...row }).select().single());
          return { equipment: toCamel(eq) };
        }
      }

      // Bitácora
      if (seg[1] === 'entries' && seg[2]) {
        if (method === 'PATCH') {
          const r = check(await sb.from('entries').update({ text: String(body.text || '').slice(0, 5000) }).eq('id', seg[2]).select());
          if (!r.length) fail(403, 'Solo puedes editar tus propios comentarios');
          return { entry: toCamel(r[0]) };
        }
        if (method === 'DELETE') {
          requireAdmin();
          const phs = check(await sb.from('photos').select('path').eq('entry_id', seg[2]));
          if (phs.length) await sb.storage.from(BUCKET).remove(phs.map((x) => x.path));
          check(await sb.from('entries').delete().eq('id', seg[2]));
          return { ok: true };
        }
      }
      // Equipos
      if (seg[1] === 'equipment' && seg[2]) {
        if (method === 'PATCH') {
          const r = check(await sb.from('equipment').update(pick(body, EQUIP_FIELDS)).eq('id', seg[2]).select());
          if (!r.length) fail(403, 'Solo puedes editar los equipos que tú agregaste');
          return { equipment: toCamel(r[0]) };
        }
        if (method === 'DELETE') { requireAdmin(); check(await sb.from('equipment').delete().eq('id', seg[2])); return { ok: true }; }
      }
      // Fotos
      if (seg[1] === 'photos' && seg[2] && method === 'DELETE') {
        requireAdmin();
        const ph = check(await sb.from('photos').select('path').eq('id', seg[2]).maybeSingle());
        if (ph) await sb.storage.from(BUCKET).remove([ph.path]);
        check(await sb.from('photos').delete().eq('id', seg[2]));
        return { ok: true };
      }
      // Notificaciones (registros de otros usuarios)
      if (p === '/api/notifications' && method === 'GET') {
        const prof = check(await sb.from('profiles').select('notif_seen_at').eq('id', me.id).maybeSingle());
        const seen = prof ? prof.notif_seen_at : null;
        const rows = check(await sb.from('entries').select('*, records(id,code,name,kind)').neq('user_id', me.id).order('at', { ascending: false }).limit(40));
        const items = rows.map((e) => ({ ...toCamel(e), record: e.records || null, unread: !!(seen && e.at > seen) }));
        return { items, unread: items.filter((x) => x.unread).length, seenAt: seen };
      }
      if (p === '/api/notifications/seen') { check(await sb.rpc('mark_notifications_seen')); return { ok: true }; }

      // Respaldo (descarga JSON con todos los datos, sin fotos)
      if (p === '/api/backup') {
        requireAdmin();
        const tables = ['profiles', 'records', 'status_history', 'entries', 'equipment', 'photos', 'activity'];
        const out = { generado: new Date().toISOString() };
        for (const t of tables) out[t] = check(await sb.from(t).select('*').limit(100000));
        return out;
      }
      fail(404, 'Acción no encontrada');
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError(400, friendly(e));
    }
  }

  // Descarga de una foto (las URLs son firmadas y de otro dominio)
  async function downloadPhoto(url, name) {
    const res = await fetch(url); const blob = await res.blob();
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name || 'foto-mts.jpg';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // Tiempo real: avisa cuando alguien agrega algo a un registro
  let channel = null;
  function watchRecord(recordId, onChange) {
    if (!sb) return;
    if (channel) { sb.removeChannel(channel); channel = null; }
    if (!recordId) return;
    let t = null;
    const fire = () => { clearTimeout(t); t = setTimeout(onChange, 700); };
    channel = sb.channel('rec-' + recordId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entries', filter: `record_id=eq.${recordId}` }, fire)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment', filter: `record_id=eq.${recordId}` }, fire)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'records', filter: `id=eq.${recordId}` }, fire)
      .subscribe();
  }

  // Tiempo real: cualquier registro nuevo en cualquier proyecto (para la campana de avisos)
  let allChannel = null;
  function watchAllEntries(onInsert) {
    if (!sb) return;
    if (allChannel) { sb.removeChannel(allChannel); allChannel = null; }
    if (!onInsert) return;
    allChannel = sb.channel('all-entries')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'entries' }, (payload) => onInsert(toCamel(payload.new)))
      .subscribe();
  }

  window.mtsApi = mtsApi;
  window.mtsWatchAllEntries = watchAllEntries;
  window.mtsDownloadPhoto = downloadPhoto;
  window.mtsWatchRecord = watchRecord;
})();
