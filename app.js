/* MTS SECURITY · Plataforma interna — aplicación del navegador */
'use strict';

// ───────────────────────── Configuración ─────────────────────────
const STATUS_META = {
  nuevo:            { label: 'Nuevo',                    c: 'var(--cyan)' },
  abastecimiento:   { label: 'Abastecimiento',           c: 'var(--amber)' },
  proceso:          { label: 'En proceso',               c: 'var(--accent)' },
  facturacion:      { label: 'Pendiente de facturación', c: 'var(--violet)' },
  finalizado:       { label: 'Finalizado',               c: 'var(--green)' },
  activa:           { label: 'Activa',                   c: 'var(--green)' },
  pausada:          { label: 'Pausada',                  c: 'var(--amber)' },
  finalizada:       { label: 'Finalizada',               c: 'var(--muted)' },
  visita_pendiente: { label: 'Visita pendiente',         c: 'var(--amber)' },
  visita_realizada: { label: 'Visita realizada',         c: 'var(--cyan)' },
  aprobado:         { label: 'Aprobado',                 c: 'var(--green)' },
  rechazado:        { label: 'Rechazado',                c: 'var(--red)' },
};
const STATUSES = {
  proyecto: ['nuevo', 'abastecimiento', 'proceso', 'facturacion', 'finalizado'],
  levantamiento: ['visita_pendiente', 'visita_realizada', 'aprobado', 'rechazado', 'finalizado'],
  mantencion: ['activa', 'pausada', 'finalizada'],
};
const KIND = {
  proyecto: { one: 'Proyecto', many: 'Proyectos', route: 'proyectos', nuevo: 'Nuevo proyecto', del: 'del proyecto' },
  levantamiento: { one: 'Levantamiento', many: 'Levantamientos', route: 'levantamientos', nuevo: 'Nuevo levantamiento', del: 'del levantamiento' },
  mantencion: { one: 'Mantención', many: 'Mantenciones', route: 'mantenciones', nuevo: 'Nueva mantención', del: 'de la mantención' },
};
const ENTRY_META = {
  comentario: { label: 'Comentario', c: 'var(--muted)' },
  avance:     { label: 'Avance diario', c: 'var(--accent)' },
  incidencia: { label: 'Incidencia', c: 'var(--red)' },
  material:   { label: 'Material', c: 'var(--amber)' },
  mantencion: { label: 'Mantención realizada', c: 'var(--green)' },
};
const ENTRY_TYPES_BY_KIND = {
  proyecto: ['avance', 'comentario', 'incidencia', 'material'],
  levantamiento: ['comentario', 'avance', 'incidencia', 'material'],
  mantencion: ['mantencion', 'comentario', 'incidencia', 'material'],
};
const FREQ = { mensual: 'Mensual', bimestral: 'Bimestral', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual' };
const EQUIP_TYPES = ['Cámara IP', 'Cámara análoga', 'PTZ', 'NVR', 'DVR', 'Switch', 'Switch PoE', 'Router', 'Antena / enlace', 'Access point', 'Central de alarma', 'Sensor', 'Control de acceso', 'Cerradura', 'Citófono', 'Monitor', 'UPS', 'Rack', 'Otro'];
const AVATAR_COLORS = ['#EE6A2F', '#4FC3F7', '#A78BFA', '#34D399', '#F5B544', '#F472B6', '#60A5FA', '#2DD4BF'];

// ───────────────────────── Íconos ─────────────────────────
const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  dash: I('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
  proj: I('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M8 13h8"/>'),
  lev: I('<path d="M9 4h6l1 2h3a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3z"/><path d="m9 13 2 2 4-4"/>'),
  users: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>'),
  user: I('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  back: I('<path d="M15 18 9 12l6-6"/>'),
  next: I('<path d="m9 18 6-6-6-6"/>'),
  msg: I('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'),
  cam: I('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>'),
  pdf: I('<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
  img: I('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>'),
  chip: I('<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>'),
  info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  edit: I('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
  trash: I('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  copy: I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  eye: I('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  ext: I('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>'),
  build: I('<path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/>'),
  cal: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>'),
  x: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  out: I('<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="M10 17l5-5-5-5M15 12H3"/>'),
  board: I('<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="11" rx="1"/><rect x="17" y="4" width="4" height="7" rx="1"/>'),
  grid: I('<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>'),
  key: I('<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>'),
  down: I('<path d="M12 4v12M6 11l6 6 6-6M4 20h16"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  wrench: I('<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 1.3-1.3a4 4 0 0 0-5-5L3 9l3-3 3 3 1.3-1.3a4 4 0 0 0 4.4-1.4z"/>'),
  bell: I('<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>'),
  xls: I('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m9 8 6 8M15 8l-6 8"/>'),
};

// ───────────────────────── Estado ─────────────────────────
const S = {
  me: null,
  users: [],
  records: [],
  view: localGet('mts_view', 'cards'),
  filter: {},
  search: '',
  tab: 'bitacora',
  composer: { type: 'comentario', photos: [] },
  notif: { unread: 0, items: [] },
  ment: { unread: 0, items: [] },
};
function localGet(k, d) { try { return localStorage.getItem(k) || d; } catch { return d; } }
function localSet(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } }

const app = document.getElementById('app');
const isAdmin = () => S.me && S.me.role === 'admin';

// ───────────────────────── Utilidades ─────────────────────────
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TZ = 'America/Santiago';
const fDateTime = (iso) => new Intl.DateTimeFormat('es-CL', { timeZone: TZ, weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
const fDate = (iso) => new Intl.DateTimeFormat('es-CL', { timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
const fTime = (iso) => new Intl.DateTimeFormat('es-CL', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
const fDayLong = (iso) => new Intl.DateTimeFormat('es-CL', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
const dayKey = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso));
function ago(iso) {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'ahora';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  if (s < 86400 * 7) return `hace ${Math.floor(s / 86400)} d`;
  return fDate(iso);
}
const fYmd = (ymd) => (ymd ? new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(ymd + 'T12:00:00Z')) : '');
const userById = (id) => S.users.find((u) => u.id === id) || { name: 'Usuario eliminado', username: '?', role: 'tecnico' };
const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
function avatarColor(id) { let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return AVATAR_COLORS[h % AVATAR_COLORS.length]; }
// Texto con menciones resaltadas (@USUARIO → @Nombre)
function richText(t) {
  return esc(t).replace(/(^|[^\w@])@([A-Za-z0-9_.\-]+)/g, (m, a, h) => {
    const clean = h.replace(/[.\-_]+$/, ''); const rest = h.slice(clean.length);
    const u = S.users.find((x) => x.username.toUpperCase() === clean.toUpperCase());
    return u ? `${a}<span class="mention${S.me && u.id === S.me.id ? ' me' : ''}" title="${esc(u.username)}">@${esc(u.name)}</span>${rest}` : m;
  });
}
const avatar = (u, cls = '') => `<span class="avatar ${cls}" style="--c:${avatarColor(u.id)}">${esc(initials(u.name))}</span>`;
const chip = (status) => { const m = STATUS_META[status] || { label: status, c: 'var(--muted)' }; return `<span class="chip" style="--c:${m.c}"><i></i>${esc(m.label)}</span>`; };
const prettyDetail = (d) => String(d || '').replace(/\b[a-z_]+\b/g, (w) => (STATUS_META[w] ? STATUS_META[w].label : w));
const todayYmd = () => dayKey(new Date().toISOString());
function dueInfo(r) {
  if (r.kind !== 'mantencion' || !r.nextDate || r.status !== 'activa') return null;
  const days = Math.round((new Date(r.nextDate + 'T12:00:00Z') - new Date(todayYmd() + 'T12:00:00Z')) / 864e5);
  if (days < 0) return { days, c: 'var(--red)', text: `Atrasada ${-days} día${days === -1 ? '' : 's'}` };
  if (days === 0) return { days, c: 'var(--amber)', text: 'Toca hoy' };
  if (days <= 7) return { days, c: 'var(--amber)', text: `En ${days} día${days === 1 ? '' : 's'}` };
  return { days, c: 'var(--cyan)', text: `En ${days} días` };
}
const roleTag = (u) => (u.role === 'admin' ? '<span class="tag role" style="--c:var(--accent)">Admin</span>' : '<span class="tag role" style="--c:var(--cyan)">Técnico</span>');

async function api(path, opts = {}) {
  try {
    return await window.mtsApi(path, opts);
  } catch (e) {
    if (e.status === 401 && path !== '/api/login') { S.me = null; renderLogin(); }
    throw e;
  }
}
function toast(msg, c = 'var(--green)') {
  const el = document.createElement('div');
  el.className = 'toast'; el.style.setProperty('--c', c); el.textContent = msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3600);
}
const toastErr = (e) => toast(e.message || String(e), 'var(--red)');
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); toast('Copiado: ' + t); }
  catch { toast('No se pudo copiar', 'var(--red)'); }
}

// Reducir fotos en el navegador antes de subirlas (más rápido desde terreno)
function resizeImage(file, max = 1800, q = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { width: w, height: h } = img;
      const k = Math.min(1, max / Math.max(w, h));
      w = Math.round(w * k); h = Math.round(h * k);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(cv.toDataURL('image/jpeg', q));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen ' + file.name)); };
    img.src = url;
  });
}

// PDF adjuntos: se guardan en el mismo almacenamiento que las fotos, con extensión .pdf
const PDF_MAX = 20 * 1024 * 1024;
const isDoc = (p) => /\.pdf$/i.test((p && p.path) || '');
const docName = (p) => { const f = String(p.path || '').split('/').pop(); return f.includes('__') ? f.slice(f.indexOf('__') + 2) : 'documento.pdf'; };
function readPdf(file) {
  return new Promise((resolve, reject) => {
    if (file.size > PDF_MAX) return reject(new Error(`${file.name} supera los 20 MB`));
    const fr = new FileReader();
    fr.onload = () => resolve({ pdf: true, name: file.name, data: fr.result });
    fr.onerror = () => reject(new Error('No se pudo leer ' + file.name));
    fr.readAsDataURL(file);
  });
}
const docList = (docs) => docs.length ? `<div class="docs">${docs.map((p) => `<a class="doc" href="${esc(p.url)}" target="_blank" rel="noopener">${ICON.pdf}<span>${esc(docName(p))}</span><b>Abrir</b></a>`).join('')}</div>` : '';

// ───────────────────────── Modales ─────────────────────────
const modalRoot = document.getElementById('modal-root');
function openModal({ title, body, foot, wide = false, onMount }) {
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `<div class="modal panel hud ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">
    <div class="panel-h"><h2 class="grow">${esc(title)}</h2><button class="btn ghost icon" data-close aria-label="Cerrar">${ICON.x}</button></div>
    <div class="panel-b">${body}</div>
    ${foot ? `<div class="foot">${foot}</div>` : ''}
  </div>`;
  const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(); });
  ov.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
  document.addEventListener('keydown', onKey);
  modalRoot.appendChild(ov);
  const first = ov.querySelector('input:not([type=hidden]):not([type=radio]), textarea, select');
  if (first) setTimeout(() => first.focus(), 30);
  if (onMount) onMount(ov, close);
  return { el: ov, close };
}
function confirmModal({ title, text, okLabel = 'Confirmar', danger = false }) {
  return new Promise((resolve) => {
    let done = false;
    const m = openModal({
      title,
      body: `<p style="margin:0" class="muted">${text}</p>`,
      foot: `<button class="btn" data-close>Cancelar</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(okLabel)}</button>`,
      onMount: (el, close) => {
        el.querySelector('[data-ok]').addEventListener('click', () => { done = true; close(); resolve(true); });
        new MutationObserver((_, obs) => { if (!el.isConnected) { obs.disconnect(); if (!done) resolve(false); } }).observe(modalRoot, { childList: true });
      },
    });
    return m;
  });
}
function formData(form) {
  const o = {};
  new FormData(form).forEach((v, k) => { o[k] = typeof v === 'string' ? v.trim() : v; });
  return o;
}

function lightbox(photos, index) {
  let i = index;
  const ov = document.createElement('div');
  ov.className = 'lightbox';
  const draw = () => {
    const p = photos[i]; const u = userById(p.userId);
    ov.innerHTML = `
      <div class="lb-top"><span class="mono">${i + 1} / ${photos.length}</span><span class="grow"></span>
        <button class="btn sm" data-dl>${ICON.down} Descargar</button>
        <button class="btn ghost icon" data-x aria-label="Cerrar">${ICON.x}</button></div>
      <div class="lb-img">
        ${photos.length > 1 ? `<button class="nav-b l" data-p aria-label="Anterior">${ICON.back}</button>` : ''}
        <img src="${esc(p.url)}" alt="">
        ${photos.length > 1 ? `<button class="nav-b r" data-n aria-label="Siguiente">${ICON.next}</button>` : ''}
      </div>
      <div class="lb-bot">${esc(u.name)} · ${esc(fDateTime(p.at))}</div>`;
    ov.querySelector('[data-x]').onclick = close;
    ov.querySelector('[data-dl]').onclick = () => window.mtsDownloadPhoto(p.url, `mts-${dayKey(p.at)}-${p.id.slice(0, 6)}.jpg`).catch(() => toast('No se pudo descargar', 'var(--red)'));
    const pb = ov.querySelector('[data-p]'); if (pb) pb.onclick = () => { i = (i - 1 + photos.length) % photos.length; draw(); };
    const nb = ov.querySelector('[data-n]'); if (nb) nb.onclick = () => { i = (i + 1) % photos.length; draw(); };
  };
  const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft' && photos.length > 1) { i = (i - 1 + photos.length) % photos.length; draw(); }
    if (e.key === 'ArrowRight' && photos.length > 1) { i = (i + 1) % photos.length; draw(); }
  };
  ov.addEventListener('click', (e) => { if (e.target.classList.contains('lb-img')) close(); });
  document.addEventListener('keydown', onKey);
  draw();
  document.body.appendChild(ov);
}

// ───────────────────────── Login ─────────────────────────
function renderLogin() {
  modalRoot.innerHTML = '';
  app.innerHTML = `
  <div class="login">
    <section class="login-art">
      <div class="scan"></div>
      <span class="rec"><i></i>REC · SISTEMA INTERNO</span>
      <div>
        <span class="label" style="color:var(--accent)">MTS SECURITY SPA</span>
        <h1 style="margin-top:12px">Cada instalación, <em>bajo control</em>.</h1>
        <p class="muted" style="max-width:42ch;margin-top:14px">Proyectos, levantamientos, equipos e IPs, avances diarios y fotos de terreno, en un solo lugar para todo el equipo.</p>
      </div>
      <span class="label">CCTV · Alarmas · Control de acceso · Automatización</span>
    </section>
    <section class="login-form">
      <div class="login-card panel hud">
        <img class="logo" src="img/logo.png" alt="MTS Security">
        <h2>Acceso personal</h2>
        <p class="sub label">Plataforma de operaciones</p>
        <form id="login-form" autocomplete="on">
          <label class="field"><span>Usuario</span><input class="input mono" name="username" autocomplete="username" autocapitalize="characters" spellcheck="false" required></label>
          <label class="field"><span>Contraseña</span><input class="input" type="password" name="password" autocomplete="current-password" required></label>
          <div class="login-err" id="login-err"></div>
          <button class="btn primary" style="height:46px">Ingresar ${ICON.arrow}</button>
        </form>
      </div>
    </section>
  </div>`;
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button'); btn.disabled = true;
    const err = document.getElementById('login-err'); err.textContent = '';
    try {
      const d = await api('/api/login', { method: 'POST', body: formData(e.target) });
      S.me = d.user;
      await boot();
      welcomeNotice();
    } catch (ex) { err.textContent = ex.message; btn.disabled = false; }
  });
}

// ───────────────────────── Estructura ─────────────────────────
function navItems() {
  const items = [
    { r: 'panel', n: '01', label: 'Panel', icon: ICON.dash },
    { r: 'proyectos', n: '02', label: 'Proyectos', icon: ICON.proj, count: S.records.filter((x) => x.kind === 'proyecto' && x.status !== 'finalizado').length },
    { r: 'levantamientos', n: '03', label: 'Levantamientos', icon: ICON.lev, count: S.records.filter((x) => x.kind === 'levantamiento' && ['visita_pendiente', 'visita_realizada'].includes(x.status)).length },
    { r: 'mantenciones', n: '04', label: 'Mantenciones', icon: ICON.wrench, count: S.records.filter((x) => { const d = dueInfo(x); return d && d.days <= 7; }).length },
  ];
  if (isAdmin()) items.push({ r: 'usuarios', n: '05', label: 'Usuarios', icon: ICON.users });
  items.push({ r: 'perfil', n: isAdmin() ? '06' : '05', label: 'Mi cuenta', icon: ICON.user });
  return items;
}
function shell(active, content) {
  const items = navItems();
  app.innerHTML = `
  <div class="shell">
    <aside class="side">
      <div class="brand"><img src="img/logo.png" alt=""><div><b>MTS SECURITY</b><small>OPERACIONES</small></div></div>
      <nav class="nav">${items.map((it) => `<a href="#/${it.r}" class="${active === it.r ? 'on' : ''}"><span class="n">${it.n}</span>${it.icon}${it.label}${it.count ? `<span class="count">${it.count}</span>` : ''}</a>`).join('')}</nav>
      <div class="side-foot">
        <button class="btn notif-btn" data-notif>${ICON.bell} Avisos <span class="nbadge ${unreadTotal() ? '' : 'hidden'}">${unreadTotal()}</span></button>
        <div class="me">${avatar(S.me)}<div class="grow"><b>${esc(S.me.name)}</b><small>${esc(S.me.role === 'admin' ? 'Administrador' : 'Técnico')}</small></div>
          <button class="btn ghost icon" id="logout" title="Cerrar sesión" aria-label="Cerrar sesión">${ICON.out}</button></div>
        <div class="sys"><i></i>SISTEMA EN LÍNEA</div>
      </div>
    </aside>
    <div>
      <header class="topbar"><img src="img/logo.png" alt=""><b class="grow">MTS OPS</b><button class="btn ghost icon notif-ico" data-notif aria-label="Avisos">${ICON.bell}<span class="nbadge ${unreadTotal() ? '' : 'hidden'}">${unreadTotal()}</span></button><a href="#/perfil" aria-label="Mi cuenta">${avatar(S.me)}</a><button class="btn ghost icon" id="logout2" aria-label="Cerrar sesión">${ICON.out}</button></header>
      <main class="main" id="main">${content}</main>
    </div>
    <nav class="bottomnav" style="--cols:${items.length - 1}">${items.filter((it) => it.r !== 'perfil').map((it) => `<a href="#/${it.r}" class="${active === it.r ? 'on' : ''}">${it.icon}${({ Levantamientos: 'Levant.', Mantenciones: 'Mantenc.' })[it.label] || it.label}</a>`).join('')}</nav>
  </div>`;
  const lo = async () => { window.mtsWatchAllEntries(null); window.mtsWatchMentions(null); S.ment = { unread: 0, items: [] }; await api('/api/logout', { method: 'POST' }).catch(() => {}); S.me = null; S.notif = { unread: 0, items: [] }; location.hash = ''; renderLogin(); };
  document.getElementById('logout').onclick = lo;
  document.getElementById('logout2').onclick = lo;
  app.querySelectorAll('[data-notif]').forEach((b) => (b.onclick = openNotifications));
  window.scrollTo(0, 0);
}

// ───────────────────────── Router ─────────────────────────
async function route() {
  if (!S.me) return renderLogin();
  const [, a, b] = (location.hash || '#/panel').split('/');
  if (a !== 'r') { REC = null; window.mtsWatchRecord(null); }
  try {
    if (a === 'proyectos') return await viewList('proyecto');
    if (a === 'levantamientos') return await viewList('levantamiento');
    if (a === 'mantenciones') return await viewList('mantencion');
    if (a === 'r' && b) return await viewRecord(b);
    if (a === 'usuarios' && isAdmin()) return await viewUsers();
    if (a === 'perfil') return viewProfile();
    return await viewDashboard();
  } catch (e) {
    if (S.me) { shell('', `<div class="empty panel">${ICON.info}<p>${esc(e.message)}</p><a class="btn" href="#/panel">Volver al panel</a></div>`); }
  }
}
window.addEventListener('hashchange', route);

async function refreshRecords() { S.records = (await api('/api/records')).records; }
async function refreshUsers() { S.users = (await api('/api/users')).users; }

// ───────────────────────── Panel ─────────────────────────
async function viewDashboard() {
  const [d] = await Promise.all([api('/api/dashboard'), refreshRecords(), refreshMentions()]);
  const hour = Number(new Intl.DateTimeFormat('es-CL', { timeZone: TZ, hour: 'numeric', hour12: false }).format(new Date()));
  const greet = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  const p = d.byStatus.proyecto; const l = d.byStatus.levantamiento;
  const activos = p.nuevo + p.abastecimiento + p.proceso;
  const bars = (kind) => {
    const counts = d.byStatus[kind]; const max = Math.max(1, ...Object.values(counts));
    return STATUSES[kind].map((s) => `<a class="sbar" href="#/${KIND[kind].route}" data-f="${s}" style="--c:${STATUS_META[s].c};color:inherit;text-decoration:none">
      <span>${esc(STATUS_META[s].label)}</span><span class="track"><span class="fill" style="width:${(counts[s] / max) * 100}%"></span></span><span class="num">${counts[s]}</span></a>`).join('');
  };
  shell('panel', `
    <div class="page-h"><div class="grow"><span class="label">${esc(fDayLong(new Date().toISOString()))}</span><h1>${greet}, ${esc(S.me.name.split(' ')[0])}</h1></div>
      ${isAdmin() ? `<button class="btn" data-new="mantencion">${ICON.plus} Mantención</button><button class="btn" data-new="levantamiento">${ICON.plus} Levantamiento</button><button class="btn primary" data-new="proyecto">${ICON.plus} Proyecto</button>` : ''}</div>
    <div class="kpis">
      <div class="kpi panel" style="--c:var(--accent)"><span class="label">Proyectos activos</span><div class="v">${activos}<small>/ ${Object.values(p).reduce((a, b) => a + b, 0)}</small></div><span class="bar"></span></div>
      <div class="kpi panel" style="--c:var(--amber)"><span class="label">Visitas pendientes</span><div class="v">${l.visita_pendiente}</div><span class="bar"></span></div>
      <div class="kpi panel" style="--c:var(--green)"><span class="label">Mantenciones próximas</span><div class="v">${d.totals.maintDue || 0}<small>7 días</small></div><span class="bar"></span></div>
      <div class="kpi panel" style="--c:var(--violet)"><span class="label">Por facturar</span><div class="v">${p.facturacion}</div><span class="bar"></span></div>
      <div class="kpi panel" style="--c:var(--cyan)"><span class="label">Registros hoy</span><div class="v">${d.totals.entriesToday}</div><span class="bar"></span></div>
    </div>
    ${mentionsPanel()}
    <div class="dash">
      <section class="panel hud">
        <div class="panel-h"><h2 class="grow">Actividad reciente</h2><span class="label">Tiempo real</span></div>
        <div class="panel-b" style="padding-top:4px;padding-bottom:4px">
          ${d.recent.length ? `<div class="feed dash-feed">${d.recent.slice(0, 30).map((a) => {
            const u = userById(a.userId);
            return `<div class="feed-i">${avatar(u)}<div style="min-width:0">
              <div class="t"><b>${esc(u.name)}</b> ${esc(a.action)} ${a.record ? `en <a href="#/r/${a.record.id}">${esc(a.record.code)} · ${esc(a.record.name)}</a>` : ''}</div>
              ${a.detail ? `<div class="x">${esc(prettyDetail(a.detail))}</div>` : ''}
              <div class="d">${esc(fDateTime(a.at))}</div></div></div>`;
          }).join('')}</div>` : `<div class="empty">${ICON.clock}<p>Aún no hay actividad. ${isAdmin() ? 'Crea tu primer proyecto para comenzar.' : ''}</p></div>`}
        </div>
      </section>
      <div class="stack">
        <section class="panel"><div class="panel-h"><h2 class="grow">Proyectos por estado</h2><a class="label" href="#/proyectos">Ver todos →</a></div><div class="panel-b sbars">${bars('proyecto')}</div></section>
        <section class="panel"><div class="panel-h"><h2 class="grow">Próximas mantenciones</h2><a class="label" href="#/mantenciones">Ver todas →</a></div><div class="panel-b" style="padding-top:6px;padding-bottom:6px">${upcomingMaint()}</div></section>
        <section class="panel"><div class="panel-h"><h2 class="grow">Levantamientos</h2><a class="label" href="#/levantamientos">Ver todos →</a></div><div class="panel-b sbars">${bars('levantamiento')}</div></section>
        <section class="panel"><div class="panel-b row wrap" style="gap:24px">
          <div><span class="label">Equipos registrados</span><div class="mono" style="font-size:22px;margin-top:4px">${d.totals.equipment}</div></div>
          <div><span class="label">Fotos de terreno</span><div class="mono" style="font-size:22px;margin-top:4px">${d.totals.photos}</div></div>
          <div><span class="label">Usuarios activos</span><div class="mono" style="font-size:22px;margin-top:4px">${d.totals.users}</div></div>
        </div></section>
      </div>
    </div>`);
  app.querySelectorAll('[data-new]').forEach((b) => (b.onclick = () => recordForm(b.dataset.new)));
  bindMentionLinks(app);
  const ma = app.querySelector('#ment-all');
  if (ma) ma.onclick = async () => { await api('/api/mentions/seen', { method: 'POST' }).catch(() => {}); S.ment.items.forEach((m) => (m.unread = false)); S.ment.unread = 0; updateBadges(); viewDashboard(); };
  app.querySelectorAll('.sbar[data-f]').forEach((a) => a.addEventListener('click', () => { const k = a.getAttribute('href').includes('proyectos') ? 'proyecto' : a.getAttribute('href').includes('mantenciones') ? 'mantencion' : 'levantamiento'; S.filter[k] = a.dataset.f; }));
}

function upcomingMaint() {
  const list = S.records.filter((r) => r.kind === 'mantencion' && r.status === 'activa' && r.nextDate).sort((a, b) => a.nextDate.localeCompare(b.nextDate)).slice(0, 5);
  if (!list.length) return `<p class="dim" style="font-size:13.5px;margin:10px 0">No hay mantenciones activas.${isAdmin() ? ' Crea una con el botón "Mantención".' : ''}</p>`;
  return `<div class="mlist">${list.map((r) => { const d = dueInfo(r); return `<a class="mrow" href="#/r/${r.id}" style="--c:${d.c}"><span class="mdot"></span><span class="grow" style="min-width:0"><b>${esc(r.name)}</b><small>${esc(r.client || '')}${r.frequency ? ' · ' + esc(FREQ[r.frequency] || r.frequency) : ''}</small></span><span class="mdate"><b>${esc(fYmd(r.nextDate))}</b><small>${esc(d.text)}</small></span></a>`; }).join('')}</div>`;
}

// ───────────────────────── Listado ─────────────────────────
function recordCard(r) {
  const m = STATUS_META[r.status];
  return `<a class="rcard panel" href="#/r/${r.id}" style="--c:${m.c}">
    <div class="row"><span class="code grow">${esc(r.code)}${r.priority === 'alta' ? ' · <span class="prio-alta">PRIORIDAD ALTA</span>' : ''}</span>${chip(r.status)}</div>
    <h3>${esc(r.name)}</h3>
    <div class="cl">${esc(r.client || 'Sin cliente asignado')}${r.address ? ' · ' + esc(r.address) : ''}</div>
    ${r.kind === 'mantencion' ? maintLine(r) : ''}
    <div class="meta"><span title="Registros">${ICON.msg}${r.counts.entries}</span><span title="Fotos">${ICON.img}${r.counts.photos}</span><span title="Equipos">${ICON.chip}${r.counts.equipment}</span><span class="when">${esc(ago(r.lastActivity))}</span></div>
  </a>`;
}
function maintLine(r) {
  const d = dueInfo(r);
  return `<div class="mline">${ICON.cal}<span>${r.frequency ? esc(FREQ[r.frequency] || r.frequency) + ' · ' : ''}Próxima: <b>${r.nextDate ? esc(fYmd(r.nextDate)) : '—'}</b></span>${d ? `<span class="tag" style="--c:${d.c}">${esc(d.text)}</span>` : ''}</div>`;
}
async function viewList(kind) {
  await Promise.all([refreshRecords(), S.users.length ? null : refreshUsers()]);
  const K = KIND[kind];
  const all = S.records.filter((r) => r.kind === kind);
  if (kind === 'mantencion') all.sort((a, b) => (a.status === 'activa' ? 0 : 1) - (b.status === 'activa' ? 0 : 1) || String(a.nextDate || '9').localeCompare(String(b.nextDate || '9')));
  shell(K.route, `
    <div class="page-h"><div class="grow"><span class="label">${all.length} registro(s)</span><h1>${K.many}</h1></div>
      ${isAdmin() ? `<button class="btn primary" id="new">${ICON.plus} ${K.nuevo}</button>` : ''}</div>
    <div class="toolbar">
      <label class="search"><span class="sr">Buscar</span>${ICON.search}<input class="input" id="q" placeholder="Buscar por nombre, cliente, código…" value="${esc(S.search)}"></label>
      <span class="grow"></span>
      <div class="seg" role="group" aria-label="Vista"><button data-v="cards" class="${S.view === 'cards' ? 'on' : ''}">${ICON.grid}Tarjetas</button><button data-v="board" class="${S.view === 'board' ? 'on' : ''}">${ICON.board}Tablero</button></div>
    </div>
    <div class="filters" id="filters"></div>
    <div id="list"></div>`);
  const draw = () => {
    const q = S.search.toLowerCase();
    const match = (r) => !q || [r.code, r.name, r.client, r.address, r.responsible].some((x) => String(x || '').toLowerCase().includes(q));
    const visible = all.filter(match);
    const cur = S.filter[kind] || 'todos';
    document.getElementById('filters').innerHTML = S.view === 'board' ? '' :
      `<button class="fchip ${cur === 'todos' ? 'on' : ''}" data-f="todos">Todos <b>${visible.length}</b></button>` +
      STATUSES[kind].map((s) => `<button class="fchip ${cur === s ? 'on' : ''}" data-f="${s}" style="--c:${STATUS_META[s].c}"><i></i>${esc(STATUS_META[s].label)} <b>${visible.filter((r) => r.status === s).length}</b></button>`).join('');
    document.querySelectorAll('#filters .fchip').forEach((b) => (b.onclick = () => { S.filter[kind] = b.dataset.f; draw(); }));
    const list = document.getElementById('list');
    if (!all.length) {
      list.innerHTML = `<div class="empty panel">${kind === 'proyecto' ? ICON.proj : ICON.lev}<p>Todavía no hay ${K.many.toLowerCase()}.</p>${isAdmin() ? `<button class="btn primary" data-new>${ICON.plus} Crear el primero</button>` : '<p class="dim">El administrador los crea y aparecerán aquí.</p>'}</div>`;
      const nb = list.querySelector('[data-new]'); if (nb) nb.onclick = () => recordForm(kind);
      return;
    }
    if (S.view === 'board') {
      list.innerHTML = `<div class="board">${STATUSES[kind].map((s) => {
        const items = visible.filter((r) => r.status === s);
        return `<div class="col" style="--c:${STATUS_META[s].c}"><div class="col-h"><b>${esc(STATUS_META[s].label)}</b><span>${items.length}</span></div>${items.map(recordCard).join('') || '<p class="dim" style="font-size:13px;text-align:center;margin:18px 0">Sin registros</p>'}</div>`;
      }).join('')}</div>`;
    } else {
      const shown = visible.filter((r) => cur === 'todos' || r.status === cur);
      list.innerHTML = shown.length ? `<div class="cards">${shown.map(recordCard).join('')}</div>` : `<div class="empty panel">${ICON.search}<p>No hay resultados con este filtro.</p></div>`;
    }
  };
  draw();
  document.getElementById('q').addEventListener('input', (e) => { S.search = e.target.value; draw(); });
  app.querySelectorAll('.seg button').forEach((b) => (b.onclick = () => { S.view = b.dataset.v; localSet('mts_view', S.view); app.querySelectorAll('.seg button').forEach((x) => x.classList.toggle('on', x === b)); draw(); }));
  const nb = document.getElementById('new'); if (nb) nb.onclick = () => recordForm(kind);
}

// ───────────────────────── Formulario de proyecto / levantamiento ─────────────────────────
function recordForm(kind, r = null) {
  const K = KIND[kind];
  const v = (k) => esc(r ? r[k] || '' : '');
  openModal({
    title: r ? `Editar ${K.one.toLowerCase()}` : K.nuevo,
    wide: true,
    body: `<form id="rf" class="grid2">
      <label class="field span2"><span>Nombre ${K.del} *</span><input class="input" name="name" required maxlength="120" placeholder="${kind === 'mantencion' ? 'Ej: Mantención CCTV Estadio UC' : 'Ej: CCTV CATÓLICA'}" value="${v('name')}"></label>
      <label class="field"><span>Cliente</span><input class="input" name="client" maxlength="120" placeholder="Ej: Club Deportivo Universidad Católica" value="${v('client')}"></label>
      <label class="field"><span>Dirección</span><input class="input" name="address" maxlength="200" value="${v('address')}"></label>
      <label class="field"><span>Contacto en sitio</span><input class="input" name="contact" maxlength="120" value="${v('contact')}"></label>
      <label class="field"><span>Teléfono contacto</span><input class="input mono" name="contactPhone" maxlength="40" placeholder="+56 9 …" value="${v('contactPhone')}"></label>
      <label class="field"><span>Encargado MTS</span><input class="input" name="responsible" maxlength="120" list="ulist" value="${v('responsible')}"><datalist id="ulist">${S.users.filter((u) => u.active).map((u) => `<option value="${esc(u.name)}">`).join('')}</datalist></label>
      <label class="field"><span>Prioridad</span><select class="input" name="priority">${['baja', 'media', 'alta'].map((p) => `<option value="${p}" ${(r ? r.priority : 'media') === p ? 'selected' : ''}>${p[0].toUpperCase() + p.slice(1)}</option>`).join('')}</select></label>
      ${kind === 'mantencion' ? `
      <label class="field"><span>Frecuencia</span><select class="input" name="frequency">${Object.entries(FREQ).map(([k, l]) => `<option value="${k}" ${(r ? r.frequency || 'mensual' : 'mensual') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="field"><span>Próxima mantención</span><input class="input mono" type="date" name="nextDate" value="${v('nextDate') || (r ? '' : todayYmd())}"></label>
      <label class="field"><span>Inicio del contrato</span><input class="input mono" type="date" name="startDate" value="${v('startDate')}"></label>
      <label class="field"><span>Término del contrato (opcional)</span><input class="input mono" type="date" name="endDate" value="${v('endDate')}"></label>` : `
      <label class="field"><span>${kind === 'proyecto' ? 'Fecha de inicio' : 'Fecha de visita'}</span><input class="input mono" type="date" name="startDate" value="${v('startDate')}"></label>
      <label class="field"><span>${kind === 'proyecto' ? 'Entrega estimada' : 'Fecha de respuesta'}</span><input class="input mono" type="date" name="endDate" value="${v('endDate')}"></label>`}
      <label class="field span2"><span>Descripción / alcance</span><textarea class="input" name="description" maxlength="4000" placeholder="${kind === 'proyecto' ? 'Qué se instalará, cantidades, consideraciones…' : kind === 'mantencion' ? 'Qué incluye cada mantención: revisión de cámaras, limpieza, grabación, respaldo, informe…' : 'Qué solicita el cliente, qué hay que revisar en la visita…'}">${v('description')}</textarea></label>
      <label class="field span2"><span>Datos de red (gateway, rango IP, VLAN, DDNS, acceso remoto…)</span><textarea class="input mono" name="network" maxlength="2000" style="min-height:80px;font-size:13px" placeholder="Gateway 192.168.1.1 · Rango 192.168.1.100-150 · VLAN 20">${v('network')}</textarea></label>
      <p class="err span2" id="rf-err"></p>
    </form>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" form="rf">${r ? 'Guardar cambios' : 'Crear'}</button>`,
    onMount: (el, close) => {
      el.querySelector('#rf').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = el.querySelector('.foot .primary'); btn.disabled = true;
        try {
          const body = { ...formData(e.target), kind };
          const d = r ? await api(`/api/records/${r.id}`, { method: 'PATCH', body }) : await api('/api/records', { method: 'POST', body });
          close();
          toast(r ? 'Cambios guardados' : `${d.record.code} creado`);
          if (r) route(); else location.hash = `#/r/${d.record.id}`;
        } catch (ex) { el.querySelector('#rf-err').textContent = ex.message; btn.disabled = false; }
      });
    },
  });
}

// ───────────────────────── Ficha de un proyecto / levantamiento ─────────────────────────
let REC = null; // datos del registro abierto
async function viewRecord(id, keepScroll = false) {
  const y = window.scrollY;
  const [d] = await Promise.all([api(`/api/records/${id}`), refreshUsers(), S.records.length ? null : refreshRecords()]);
  if (!REC || REC.record.id !== id) { S.tab = 'bitacora'; S.composer = { type: ENTRY_TYPES_BY_KIND[d.record.kind][0], photos: [] }; }
  if (!REC || REC.record.id !== id) window.mtsWatchRecord(id, () => { if (REC && REC.record.id === id && !document.querySelector('.overlay, .lightbox')) reloadRecord(); });
  REC = d;
  const r = d.record; const K = KIND[r.kind];
  const statuses = STATUSES[r.kind];
  const curIdx = statuses.indexOf(r.status);
  const linked = r.toProyecto ? S.records.find((x) => x.id === r.toProyecto) : null;
  const origin = r.fromLevantamiento ? S.records.find((x) => x.id === r.fromLevantamiento) : null;

  // Línea de estados
  const pipe = r.kind === 'levantamiento' ? levPipe(r) : statuses.map((s, i) => {
    let cls = '';
    if (r.kind === 'mantencion') {
      cls = r.status === s ? 'cur' : '';
    } else if (r.kind === 'levantamiento' && (s === 'aprobado' || s === 'rechazado')) {
      if (r.status === s) cls = 'cur';
      else if ((r.status === 'aprobado' || r.status === 'rechazado')) cls = 'off';
    } else if (i < curIdx || (r.kind === 'levantamiento' && curIdx >= 2 && i < 2)) cls = 'done';
    else if (i === curIdx) cls = 'cur';
    if (r.kind === 'proyecto' && s === 'finalizado' && r.status === 'finalizado') cls = 'done cur';
    const m = STATUS_META[s];
    const sym = r.kind === 'mantencion' ? (r.status === s ? ICON.check : String(i + 1).padStart(2, '0')) : cls.includes('done') ? ICON.check : s === 'rechazado' && cls.includes('cur') ? ICON.x : s === 'aprobado' && cls.includes('cur') ? ICON.check : String(i + 1).padStart(2, '0');
    return `<button class="step ${cls} ${isAdmin() && r.status !== s ? 'can' : ''}" style="--c:${m.c}" data-s="${s}" ${isAdmin() ? '' : 'tabindex="-1"'} title="${isAdmin() && r.status !== s ? 'Cambiar a: ' + esc(m.label) : esc(m.label)}">
      <span class="dot">${sym}</span><span class="nm">${esc(m.label)}</span></button>`;
  }).join('');

  const lastChange = r.statusHistory[r.statusHistory.length - 1];
  const photosCount = d.photos.length;

  shell(K.route, `
    <a class="crumb" href="#/${K.route}">${ICON.back} ${K.many}</a>
    <section class="rec-h panel hud">
      <div class="top">
        <div class="grow" style="min-width:240px">
          <div class="row wrap" style="gap:10px"><span class="label">${esc(r.code)} · ${K.one}</span>${chip(r.status)}${r.priority === 'alta' ? '<span class="tag" style="--c:var(--red)">Prioridad alta</span>' : ''}</div>
          <h1 style="margin-top:8px">${esc(r.name)}</h1>
        </div>
        ${isAdmin() ? `<div class="row wrap">
          ${r.kind === 'levantamiento' && r.status === 'aprobado' && !linked ? `<button class="btn primary" id="convert">${ICON.proj} Crear proyecto</button>` : ''}
          <button class="btn" id="edit">${ICON.edit} Editar</button>
          <button class="btn danger icon" id="del" title="Eliminar" aria-label="Eliminar">${ICON.trash}</button></div>` : ''}
      </div>
      <div class="facts">
        ${r.client ? `<span>${ICON.build}${esc(r.client)}</span>` : ''}
        ${r.address ? `<span>${ICON.pin}<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address)}" target="_blank" rel="noopener">${esc(r.address)}</a></span>` : ''}
        ${r.responsible ? `<span>${ICON.user}${esc(r.responsible)}</span>` : ''}
        ${r.kind === 'mantencion' ? `<span>${ICON.wrench}${esc(FREQ[r.frequency] || 'Sin frecuencia')}</span><span>${ICON.cal}Próxima: <b style="color:var(--ink);margin-left:4px">${r.nextDate ? esc(fYmd(r.nextDate)) : '—'}</b>${dueInfo(r) ? `<span class="tag" style="--c:${dueInfo(r).c};margin-left:8px">${esc(dueInfo(r).text)}</span>` : ''}</span><span>${ICON.check}Última: ${r.lastDate ? esc(fYmd(r.lastDate)) : 'sin registro'}</span>` : r.startDate ? `<span>${ICON.cal}${esc(fYmd(r.startDate))}${r.endDate ? ' → ' + esc(fYmd(r.endDate)) : ''}</span>` : ''}
        ${linked ? `<span>${ICON.proj}Proyecto generado: <a href="#/r/${linked.id}">${esc(linked.code)}</a></span>` : ''}
        ${origin ? `<span>${ICON.lev}Viene del levantamiento <a href="#/r/${origin.id}">${esc(origin.code)}</a></span>` : ''}
      </div>
      <div class="pipe">${pipe}</div>
      <div class="pipe-note">Último cambio de estado: ${esc(userById(lastChange.by).name)} · ${esc(fDateTime(lastChange.at))}${isAdmin() ? ' · Toca un estado para cambiarlo' : ''}</div>
    </section>

    <nav class="tabs" role="tablist">
      ${[
        ['bitacora', ICON.msg, 'Bitácora', d.entries.length],
        ['equipos', ICON.chip, 'Equipos e IPs', d.equipment.length],
        ['fotos', ICON.img, 'Fotos', photosCount],
        ['ficha', ICON.info, 'Ficha', ''],
        ['historial', ICON.clock, 'Historial', ''],
      ].map(([k, ic, lb, n]) => `<button role="tab" data-tab="${k}" class="${S.tab === k ? 'on' : ''}">${ic}${lb}${n !== '' ? ` <span>${n}</span>` : ''}</button>`).join('')}
    </nav>
    <div id="tab"></div>`);

  app.querySelectorAll('.tabs button').forEach((b) => (b.onclick = () => { S.tab = b.dataset.tab; app.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('on', x === b)); drawTab(); }));
  if (isAdmin()) {
    app.querySelectorAll('.step.can, .opt.can').forEach((b) => (b.onclick = () => statusModal(r, b.dataset.s)));
    document.getElementById('edit').onclick = () => recordForm(r.kind, r);
    document.getElementById('del').onclick = async () => {
      if (await confirmModal({ title: `Eliminar ${K.one.toLowerCase()}`, text: `Se eliminará <b>${esc(r.code)} · ${esc(r.name)}</b> con toda su bitácora, equipos y fotos. Esta acción no se puede deshacer.`, okLabel: 'Eliminar definitivamente', danger: true })) {
        try { await api(`/api/records/${r.id}`, { method: 'DELETE' }); toast('Registro eliminado'); location.hash = `#/${K.route}`; } catch (e) { toastErr(e); }
      }
    };
    const cv = document.getElementById('convert');
    if (cv) cv.onclick = async () => {
      if (await confirmModal({ title: 'Crear proyecto', text: `Se creará un proyecto nuevo con los datos de <b>${esc(r.name)}</b>, incluyendo los equipos levantados.`, okLabel: 'Crear proyecto' })) {
        try { const x = await api(`/api/records/${r.id}/convert`, { method: 'POST', body: {} }); toast(`${x.record.code} creado`); location.hash = `#/r/${x.record.id}`; } catch (e) { toastErr(e); }
      }
    };
  }
  drawTab();
  if (keepScroll) window.scrollTo(0, y);
}
const reloadRecord = () => viewRecord(REC.record.id, true);

// Línea de estados del levantamiento: 1 → 2 → (Aprobado | Rechazado) → Finalizado
function levPipe(r) {
  const rank = { visita_pendiente: 0, visita_realizada: 1, aprobado: 2, rechazado: 2, finalizado: 3 }[r.status];
  const decided = r.status === 'aprobado' || r.status === 'rechazado' ? r.status
    : r.status === 'finalizado' ? ([...r.statusHistory].reverse().find((h) => h.status === 'aprobado' || h.status === 'rechazado') || {}).status : null;
  const can = (s) => isAdmin() && r.status !== s;
  const step = (s, idx) => {
    const m = STATUS_META[s];
    const cls = idx < rank ? 'done' : idx === rank ? 'cur' : '';
    const sym = cls === 'done' || (s === 'finalizado' && cls === 'cur') ? ICON.check : String(idx + 1).padStart(2, '0');
    return `<button class="step ${cls} ${can(s) ? 'can' : ''}" style="--c:${m.c}" data-s="${s}" ${isAdmin() ? '' : 'tabindex="-1"'} title="${can(s) ? 'Cambiar a: ' + esc(m.label) : esc(m.label)}"><span class="dot">${sym}</span><span class="nm">${esc(m.label)}</span></button>`;
  };
  const dc = decided ? STATUS_META[decided].c : 'var(--line-2)';
  const dCls = rank > 2 ? 'done' : rank === 2 ? 'cur' : '';
  const opt = (s) => `<button class="opt ${decided === s ? 'on' : ''} ${can(s) ? 'can' : ''}" style="--c:${STATUS_META[s].c}" data-s="${s}" ${isAdmin() ? '' : 'tabindex="-1" disabled'}>${s === 'aprobado' ? ICON.check : ICON.x}${esc(STATUS_META[s].label)}</button>`;
  const decision = `<div class="step branch ${dCls}" style="--c:${dc}"><span class="dot">${decided === 'aprobado' ? ICON.check : decided === 'rechazado' ? ICON.x : '03'}</span><span class="opts">${opt('aprobado')}${opt('rechazado')}</span></div>`;
  return step('visita_pendiente', 0) + step('visita_realizada', 1) + decision + step('finalizado', 3);
}

function statusModal(r, s) {
  const m = STATUS_META[s];
  openModal({
    title: 'Cambiar estado',
    body: `<div class="row wrap" style="gap:12px">${chip(r.status)}<span class="dim">${ICON.arrow.replace('<svg', '<svg style="width:18px;height:18px"')}</span>${chip(s)}</div>
      ${r.kind === 'levantamiento' && s === 'aprobado' ? (r.toProyecto && S.records.some((x) => x.id === r.toProyecto) ? '<div class="note">Este levantamiento ya tiene su proyecto creado; no se creará otro.</div>' : '<div class="note"><b>Se creará automáticamente un proyecto nuevo</b> con la información de este levantamiento y sus equipos registrados.</div>') : ''}
      <label class="field"><span>Nota (opcional)</span><textarea class="input" id="sn" maxlength="300" placeholder="Ej: Material recibido completo, se agenda instalación para el lunes"></textarea></label>
      <p class="err" id="se"></p>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" id="sok" style="background:${m.c};border-color:${m.c}">Cambiar a ${esc(m.label)}</button>`,
    onMount: (el, close) => {
      el.querySelector('#sok').onclick = async () => {
        try {
          await api(`/api/records/${r.id}/status`, { method: 'POST', body: { status: s, note: el.querySelector('#sn').value } });
          close(); toast(`Estado: ${m.label}`);
          await refreshRecords().catch(() => {});
          await reloadRecord();
          if (r.kind === 'levantamiento' && s === 'aprobado' && REC.record.toProyecto && !r.toProyecto) {
            const pr = S.records.find((x) => x.id === REC.record.toProyecto);
            toast(`Proyecto ${pr ? pr.code : ''} creado automáticamente en Proyectos`, 'var(--accent)');
          }
        } catch (e) { el.querySelector('#se').textContent = e.message; }
      };
    },
  });
}

function drawTab() {
  const box = document.getElementById('tab');
  ({ bitacora: tabLog, equipos: tabEquip, fotos: tabPhotos, ficha: tabInfo, historial: tabHistory })[S.tab](box);
}

// ── Bitácora ──
function tabLog(box) {
  const { entries, photos } = REC;
  const C = S.composer;
  const byId = Object.fromEntries(photos.map((p) => [p.id, p]));
  const list = [...entries].reverse();
  let lastDay = '';
  const items = list.map((e) => {
    const u = userById(e.userId); const tm = ENTRY_META[e.type] || ENTRY_META.comentario;
    const ph = (e.photos || []).map((id) => byId[id]).filter(Boolean);
    const dk = dayKey(e.at);
    const sep = dk !== lastDay ? `<div class="day-sep">${esc(fDayLong(e.at))}</div>` : '';
    lastDay = dk;
    const canEdit = isAdmin() || e.userId === S.me.id;
    return `${sep}<article class="entry panel" data-id="${e.id}">
      <div class="entry-h">${avatar(u, 'lg')}
        <div class="who grow" style="min-width:0"><div><b>${esc(u.name)}</b>${roleTag(u)} <span class="tag" style="--c:${tm.c};margin-left:4px">${esc(tm.label)}</span></div>
          <div class="when">${esc(fDateTime(e.at))}${e.editedAt ? ` <span class="ed">· editado ${esc(fTime(e.editedAt))}</span>` : ''}</div></div>
        <div class="tools">${canEdit && e.text ? `<button class="btn ghost icon sm" data-edit title="Editar" aria-label="Editar">${ICON.edit}</button>` : ''}${isAdmin() ? `<button class="btn ghost icon sm" data-del title="Eliminar" aria-label="Eliminar">${ICON.trash}</button>` : ''}</div>
      </div>
      ${e.text ? `<div class="txt">${richText(e.text)}</div>` : ''}
      ${ph.some((p) => !isDoc(p)) ? `<div class="pgrid">${ph.filter((p) => !isDoc(p)).map((p) => `<button data-ph="${p.id}" aria-label="Ver foto"><img loading="lazy" src="${esc(p.url)}" alt=""></button>`).join('')}</div>` : ''}
      ${docList(ph.filter(isDoc))}
    </article>`;
  }).join('');

  box.innerHTML = `
    <section class="composer panel hud">
      <div class="types">${ENTRY_TYPES_BY_KIND[REC.record.kind].map((k) => [k, ENTRY_META[k]]).map(([k, m]) => `<button data-type="${k}" style="--c:${m.c}" class="${C.type === k ? 'on' : ''}">${esc(m.label)}</button>`).join('')}</div>
      <label class="sr" for="ct">Escribe un registro</label>
      <textarea class="input" id="ct" maxlength="5000" placeholder="${C.type === 'mantencion' ? 'Qué se revisó: cámaras operativas, grabación, limpieza, ajustes realizados… (al publicar se calcula la próxima fecha)' : C.type === 'avance' ? 'Qué se avanzó hoy: puntos instalados, cableado, configuración…' : C.type === 'incidencia' ? 'Describe el problema encontrado…' : C.type === 'material' ? 'Material usado o faltante: cantidades, modelos…' : 'Escribe un comentario para el equipo…'}">${esc(C.draft || '')}</textarea>
      <div class="thumbs" id="thumbs"></div>
      <div class="actions">
        <label class="btn" style="cursor:pointer">${ICON.cam} Fotos o PDF<input type="file" id="cf" accept="image/*,application/pdf,.pdf" multiple hidden></label>
        <span class="dim grow" style="font-size:12.5px">Se publicará como <b style="color:var(--ink)">${esc(S.me.name)}</b> con fecha y hora</span>
        <button class="btn primary" id="cs">Publicar</button>
      </div>
    </section>
    <div class="entries">${items || `<div class="empty panel">${ICON.msg}<p>Aún no hay registros en la bitácora.<br><span class="dim">Los avances diarios, comentarios y fotos aparecerán aquí.</span></p></div>`}</div>`;

  const drawThumbs = () => {
    box.querySelector('#thumbs').innerHTML = C.photos.map((p, i) => `<div class="th ${p.pdf ? 'pdf' : ''}">${p.pdf ? `${ICON.pdf}<small>${esc(p.name)}</small>` : `<img src="${p}" alt="">`}<button data-rm="${i}" aria-label="Quitar">×</button></div>`).join('');
    box.querySelectorAll('[data-rm]').forEach((b) => (b.onclick = () => { C.photos.splice(Number(b.dataset.rm), 1); drawThumbs(); }));
  };
  drawThumbs();
  box.querySelector('#ct').addEventListener('input', (e) => { C.draft = e.target.value; });
  box.querySelectorAll('[data-type]').forEach((b) => (b.onclick = () => { C.type = b.dataset.type; tabLog(box); }));
  box.querySelector('#cf').addEventListener('change', async (e) => {
    const files = [...e.target.files].slice(0, 12 - C.photos.length);
    for (const f of files) {
      try { C.photos.push(f.type === 'application/pdf' || /\.pdf$/i.test(f.name) ? await readPdf(f) : await resizeImage(f)); } catch (ex) { toastErr(ex); }
    }
    e.target.value = ''; drawThumbs();
  });
  box.querySelector('#cs').onclick = async (ev) => {
    const text = box.querySelector('#ct').value.trim();
    if (!text && !C.photos.length) return toast('Escribe algo o agrega una foto o PDF', 'var(--amber)');
    ev.target.disabled = true; ev.target.textContent = C.photos.length ? 'Subiendo archivos…' : 'Publicando…';
    try {
      await api(`/api/records/${REC.record.id}/entries`, { method: 'POST', body: { type: C.type, text, photos: C.photos } });
      C.photos = []; C.draft = '';
      toast('Publicado'); reloadRecord();
    } catch (e) { toastErr(e); ev.target.disabled = false; ev.target.textContent = 'Publicar'; }
  };
  box.querySelectorAll('[data-ph]').forEach((b) => (b.onclick = () => {
    const entryEl = b.closest('.entry'); const e = REC.entries.find((x) => x.id === entryEl.dataset.id);
    const ph = e.photos.map((id) => byId[id]).filter((p) => p && !isDoc(p));
    lightbox(ph, ph.findIndex((p) => p.id === b.dataset.ph));
  }));
  box.querySelectorAll('[data-edit]').forEach((b) => (b.onclick = () => {
    const e = REC.entries.find((x) => x.id === b.closest('.entry').dataset.id);
    openModal({
      title: 'Editar registro',
      body: `<textarea class="input" id="et" maxlength="5000" style="min-height:140px">${esc(e.text)}</textarea><p class="err" id="ee"></p>`,
      foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" id="eok">Guardar</button>`,
      onMount: (el, close) => {
        el.querySelector('#eok').onclick = async () => {
          try { await api(`/api/entries/${e.id}`, { method: 'PATCH', body: { text: el.querySelector('#et').value } }); close(); toast('Registro editado'); reloadRecord(); }
          catch (ex) { el.querySelector('#ee').textContent = ex.message; }
        };
      },
    });
  }));
  box.querySelectorAll('[data-del]').forEach((b) => (b.onclick = async () => {
    const id = b.closest('.entry').dataset.id;
    if (await confirmModal({ title: 'Eliminar registro', text: 'Se eliminará este registro de la bitácora junto con sus fotos.', okLabel: 'Eliminar', danger: true })) {
      try { await api(`/api/entries/${id}`, { method: 'DELETE' }); toast('Registro eliminado'); reloadRecord(); } catch (e) { toastErr(e); }
    }
  }));
}

// ── Equipos e IPs ──
function tabEquip(box) {
  const eqs = REC.equipment;
  let q = '';
  box.innerHTML = `
    <div class="toolbar">
      <label class="search"><span class="sr">Buscar equipo</span>${ICON.search}<input class="input" id="eq" placeholder="Buscar IP, modelo, ubicación…"></label>
      <span class="grow"></span>
      <button class="btn" id="eqxls" ${eqs.length ? '' : 'disabled'}>${ICON.xls} Exportar Excel</button>
      <button class="btn primary" id="eqadd">${ICON.plus} Agregar equipo</button>
    </div>
    <div id="eqlist"></div>`;
  const canEdit = (e) => isAdmin() || e.createdBy === S.me.id;
  const ipCell = (e) => e.ip ? `<span class="ip">${esc(e.ip)}${e.port ? `<span class="dim">:${esc(e.port)}</span>` : ''}<button data-copy="${esc(e.ip)}" title="Copiar IP" aria-label="Copiar IP">${ICON.copy}</button><a href="http://${esc(e.ip)}${e.port ? ':' + esc(e.port) : ''}" target="_blank" rel="noopener" title="Abrir en el navegador" style="color:var(--dim);display:inline-grid">${ICON.ext.replace('<svg', '<svg style="width:14px;height:14px"')}</a></span>` : '<span class="dim">—</span>';
  const pwCell = (e) => e.username || e.password ? `<span class="pw"><span>${esc(e.username || '—')}</span><span class="dim">/</span><span data-pw="${esc(e.password || '')}">${e.password ? '••••••' : '—'}</span>${e.password ? `<button data-reveal title="Mostrar clave" aria-label="Mostrar clave">${ICON.eye}</button>` : ''}</span>` : '<span class="dim">—</span>';
  const draw = () => {
    const ql = q.toLowerCase();
    const shown = eqs.filter((e) => !ql || Object.values(e).some((v) => typeof v === 'string' && v.toLowerCase().includes(ql)));
    const el = box.querySelector('#eqlist');
    if (!eqs.length) { el.innerHTML = `<div class="empty panel">${ICON.chip}<p>No hay equipos registrados.<br><span class="dim">Agrega cámaras, NVR, switches, antenas… con su IP y ubicación.</span></p></div>`; return; }
    const actions = (e) => `${canEdit(e) ? `<button class="btn ghost icon sm" data-e="${e.id}" title="Editar" aria-label="Editar">${ICON.edit}</button>` : ''}${isAdmin() ? `<button class="btn ghost icon sm" data-d="${e.id}" title="Eliminar" aria-label="Eliminar">${ICON.trash}</button>` : ''}`;
    el.innerHTML = `
      <div class="panel tbl-wrap"><table class="tbl"><thead><tr><th>Equipo</th><th>Marca / modelo</th><th>IP</th><th>Ubicación</th><th>Usuario / clave</th><th>MAC / serie</th><th>Registró</th><th></th></tr></thead><tbody>
      ${shown.map((e) => `<tr data-id="${e.id}"><td><b>${esc(e.type || '—')}</b>${e.notes ? `<div class="dim" style="font-size:12px;max-width:220px;white-space:normal">${richText(e.notes)}</div>` : ''}</td><td>${esc([e.brand, e.model].filter(Boolean).join(' ') || '—')}</td><td>${ipCell(e)}</td><td>${esc(e.location || '—')}</td><td>${pwCell(e)}</td><td class="mono" style="font-size:12px">${esc(e.mac || '')}${e.serial ? `<div class="dim">${esc(e.serial)}</div>` : ''}</td><td class="dim" style="font-size:12px;white-space:nowrap">${esc(userById(e.createdBy).name.split(' ')[0])}<div class="mono">${esc(fDate(e.createdAt))}</div></td><td style="white-space:nowrap">${actions(e)}</td></tr>`).join('')}
      </tbody></table>${!shown.length ? '<p class="dim" style="text-align:center;padding:20px">Sin resultados</p>' : ''}</div>
      <div class="eq-cards">${shown.map((e) => `<div class="eq-card panel" data-id="${e.id}"><div class="row"><b class="grow">${esc(e.type || 'Equipo')}</b>${actions(e)}</div>
        <dl><dt>IP</dt><dd>${ipCell(e)}</dd>${e.brand || e.model ? `<dt>Modelo</dt><dd>${esc([e.brand, e.model].filter(Boolean).join(' '))}</dd>` : ''}${e.location ? `<dt>Ubicación</dt><dd>${esc(e.location)}</dd>` : ''}${e.username || e.password ? `<dt>Acceso</dt><dd>${pwCell(e)}</dd>` : ''}${e.mac ? `<dt>MAC</dt><dd class="mono">${esc(e.mac)}</dd>` : ''}${e.serial ? `<dt>Serie</dt><dd class="mono">${esc(e.serial)}</dd>` : ''}${e.notes ? `<dt>Notas</dt><dd>${richText(e.notes)}</dd>` : ''}<dt>Registró</dt><dd class="dim">${esc(userById(e.createdBy).name)} · ${esc(fDate(e.createdAt))}</dd></dl></div>`).join('')}</div>`;
    el.querySelectorAll('[data-copy]').forEach((b) => (b.onclick = () => copyText(b.dataset.copy)));
    el.querySelectorAll('[data-reveal]').forEach((b) => (b.onclick = () => { const s = b.previousElementSibling; s.textContent = s.textContent === '••••••' ? s.dataset.pw : '••••••'; }));
    el.querySelectorAll('[data-e]').forEach((b) => (b.onclick = () => equipForm(eqs.find((x) => x.id === b.dataset.e))));
    el.querySelectorAll('[data-d]').forEach((b) => (b.onclick = async () => {
      if (await confirmModal({ title: 'Eliminar equipo', text: 'Se eliminará este equipo de la lista.', okLabel: 'Eliminar', danger: true })) {
        try { await api(`/api/equipment/${b.dataset.d}`, { method: 'DELETE' }); toast('Equipo eliminado'); reloadRecord(); } catch (e) { toastErr(e); }
      }
    }));
  };
  draw();
  box.querySelector('#eq').addEventListener('input', (e) => { q = e.target.value; draw(); });
  box.querySelector('#eqadd').onclick = () => equipForm(null);
  box.querySelector('#eqxls').onclick = () => exportEquipment();
}
function equipForm(eq) {
  const v = (k) => esc(eq ? eq[k] || '' : '');
  openModal({
    title: eq ? 'Editar equipo' : 'Agregar equipo', wide: true,
    body: `<form id="ef" class="grid2">
      <label class="field"><span>Tipo de equipo *</span><input class="input" name="type" list="etypes" required maxlength="60" placeholder="Cámara IP, NVR, Switch…" value="${v('type')}"><datalist id="etypes">${EQUIP_TYPES.map((t) => `<option value="${t}">`).join('')}</datalist></label>
      <label class="field"><span>Ubicación</span><input class="input" name="location" maxlength="120" placeholder="Acceso principal, rack sala TI…" value="${v('location')}"></label>
      <label class="field"><span>Marca</span><input class="input" name="brand" list="ebrands" maxlength="60" value="${v('brand')}"><datalist id="ebrands">${['Hikvision', 'Dahua', 'TP-Link', 'Ubiquiti', 'IMOU', 'Fluke', 'Ezviz', 'Uniview'].map((t) => `<option value="${t}">`).join('')}</datalist></label>
      <label class="field"><span>Modelo</span><input class="input mono" name="model" maxlength="80" value="${v('model')}"></label>
      <label class="field"><span>Dirección IP</span><input class="input mono" name="ip" maxlength="60" placeholder="192.168.1.64" value="${v('ip')}"></label>
      <label class="field"><span>Puerto (web)</span><input class="input mono" name="port" maxlength="40" placeholder="80" value="${v('port')}"></label>
      <label class="field"><span>Usuario del equipo</span><input class="input mono" name="username" maxlength="60" autocomplete="off" placeholder="admin" value="${v('username')}"></label>
      <label class="field"><span>Clave del equipo</span><input class="input mono" name="password" maxlength="80" autocomplete="new-password" value="${v('password')}"></label>
      <label class="field"><span>MAC</span><input class="input mono" name="mac" maxlength="40" value="${v('mac')}"></label>
      <label class="field"><span>N° de serie</span><input class="input mono" name="serial" maxlength="80" value="${v('serial')}"></label>
      <label class="field span2"><span>Notas</span><textarea class="input" name="notes" maxlength="500" style="min-height:70px">${v('notes')}</textarea></label>
      <p class="err span2" id="ee"></p>
    </form>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" form="ef">${eq ? 'Guardar' : 'Agregar'}</button>`,
    onMount: (el, close) => {
      el.querySelector('#ef').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const body = formData(e.target);
          if (eq) await api(`/api/equipment/${eq.id}`, { method: 'PATCH', body });
          else await api(`/api/records/${REC.record.id}/equipment`, { method: 'POST', body });
          close(); toast(eq ? 'Equipo actualizado' : 'Equipo agregado'); reloadRecord();
        } catch (ex) { el.querySelector('#ee').textContent = ex.message; }
      });
    },
  });
}

// ── Fotos ──
function tabPhotos(box) {
  const all = [...REC.photos].reverse();
  const ph = all.filter((p) => !isDoc(p));
  const docs = all.filter(isDoc);
  const docsHtml = docs.length ? `<h3 class="label" style="margin:0 0 10px">Documentos PDF</h3><div class="docs" style="margin-bottom:22px">${docs.map((p) => `<div class="doc">${ICON.pdf}<a href="${esc(p.url)}" target="_blank" rel="noopener"><span>${esc(docName(p))}</span></a><span class="mono dim" style="font-size:11px">${esc(userById(p.userId).name.split(' ')[0])} · ${esc(fDate(p.at))}</span>${isAdmin() ? `<button class="btn ghost icon sm" data-del="${p.id}" style="width:26px;height:26px" aria-label="Eliminar PDF">${ICON.trash}</button>` : ''}</div>`).join('')}</div>` : '';
  box.innerHTML = !all.length ? '' : docsHtml + (ph.length ? `<h3 class="label" style="margin:0 0 10px">Fotos</h3>` : '');
  box.innerHTML += ph.length ? `<div class="gallery">${ph.map((p, i) => `<figure class="panel"><button data-i="${i}" aria-label="Ver foto"><img loading="lazy" src="${esc(p.url)}" alt=""></button>
    <figcaption>${esc(userById(p.userId).name.split(' ')[0])}<span class="mono">${esc(fDate(p.at))} ${esc(fTime(p.at))}</span>${isAdmin() ? `<button class="btn ghost icon sm" data-del="${p.id}" style="width:26px;height:26px" aria-label="Eliminar foto">${ICON.trash}</button>` : ''}</figcaption></figure>`).join('')}</div>`
    : all.length ? '' : `<div class="empty panel">${ICON.img}<p>Aún no hay fotos ni documentos.<br><span class="dim">Las fotos y PDF se suben desde la Bitácora, junto a un comentario o avance.</span></p><button class="btn" id="go">${ICON.cam} Ir a la bitácora</button></div>`;
  box.querySelectorAll('[data-i]').forEach((b) => (b.onclick = () => lightbox(ph, Number(b.dataset.i))));
  const go = box.querySelector('#go'); if (go) go.onclick = () => app.querySelector('[data-tab="bitacora"]').click();
  box.querySelectorAll('[data-del]').forEach((b) => (b.onclick = async () => {
    if (await confirmModal({ title: 'Eliminar archivo', text: 'El archivo se eliminará definitivamente.', okLabel: 'Eliminar', danger: true })) {
      try { await api(`/api/photos/${b.dataset.del}`, { method: 'DELETE' }); toast('Archivo eliminado'); reloadRecord(); } catch (e) { toastErr(e); }
    }
  }));
}

// ── Ficha ──
function tabInfo(box) {
  const r = REC.record;
  const row = (k, v, raw = false) => `<div><dt>${k}</dt><dd>${v ? (raw ? v : esc(v)) : '<span class="dim">—</span>'}</dd></div>`;
  box.innerHTML = `<section class="panel"><div class="panel-h"><h2 class="grow">Ficha ${KIND[r.kind].del}</h2>${isAdmin() ? `<button class="btn sm" id="ed2">${ICON.edit} Editar</button>` : '<span class="label">Solo lectura</span>'}</div>
    <div class="panel-b"><dl class="dl">
      ${row('Código', `<span class="mono">${esc(r.code)}</span>`, true)}
      ${row('Nombre', r.name)}
      ${row('Cliente', r.client)}
      ${row('Dirección', r.address ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address)}" target="_blank" rel="noopener">${esc(r.address)}</a>` : '', true)}
      ${row('Contacto', r.contact)}
      ${row('Teléfono', r.contactPhone ? `<a class="mono" href="tel:${esc(r.contactPhone.replace(/\s/g, ''))}">${esc(r.contactPhone)}</a>` : '', true)}
      ${row('Encargado MTS', r.responsible)}
      ${row('Prioridad', r.priority ? r.priority[0].toUpperCase() + r.priority.slice(1) : '')}
      ${r.kind === 'mantencion' ? `${row('Frecuencia', FREQ[r.frequency] || '')}${row('Próxima mantención', fYmd(r.nextDate))}${row('Última realizada', fYmd(r.lastDate))}${row('Inicio contrato', fYmd(r.startDate))}${row('Término contrato', fYmd(r.endDate))}` : `${row(r.kind === 'proyecto' ? 'Inicio' : 'Fecha visita', fYmd(r.startDate))}${row(r.kind === 'proyecto' ? 'Entrega estimada' : 'Fecha respuesta', fYmd(r.endDate))}`}
      ${row('Descripción', r.description ? richText(r.description) : '', true)}
      ${row('Datos de red', r.network ? `<span class="mono" style="font-size:13px">${richText(r.network)}</span>` : '', true)}
      ${row('Creado', `${esc(userById(r.createdBy).name)} · ${esc(fDateTime(r.createdAt))}`, true)}
    </dl></div></section>`;
  const b = box.querySelector('#ed2'); if (b) b.onclick = () => recordForm(r.kind, r);
}

// ── Historial ──
function tabHistory(box) {
  const r = REC.record;
  box.innerHTML = `<div class="dash" style="grid-template-columns:1fr 1fr">
    <section class="panel"><div class="panel-h"><h2>Cambios de estado</h2></div><div class="panel-b"><div class="tl">
      ${[...r.statusHistory].reverse().map((h) => `<div class="tl-i" style="--c:${STATUS_META[h.status].c}"><div>${chip(h.status)}</div>
        <div style="margin-top:6px;font-size:14px"><b>${esc(userById(h.by).name)}</b></div>${h.note ? `<div class="muted" style="font-size:13.5px">${richText(h.note)}</div>` : ''}<div class="d">${esc(fDateTime(h.at))}</div></div>`).join('')}
    </div></div></section>
    <section class="panel"><div class="panel-h"><h2>Actividad</h2></div><div class="panel-b" style="padding-top:4px"><div class="feed">
      ${REC.activity.map((a) => { const u = userById(a.userId); return `<div class="feed-i">${avatar(u)}<div style="min-width:0"><div class="t"><b>${esc(u.name)}</b> ${esc(a.action)}</div>${a.detail ? `<div class="x">${esc(prettyDetail(a.detail))}</div>` : ''}<div class="d">${esc(fDateTime(a.at))}</div></div></div>`; }).join('') || '<p class="dim">Sin actividad</p>'}
    </div></div></section></div>`;
  if (window.innerWidth < 1100) box.firstElementChild.style.gridTemplateColumns = '1fr';
}

// ───────────────────────── Usuarios (solo administrador) ─────────────────────────
async function viewUsers() {
  await Promise.all([refreshUsers(), S.records.length ? null : refreshRecords()]);
  const users = [...S.users].sort((a, b) => (b.active - a.active) || (a.role === b.role ? a.name.localeCompare(b.name) : a.role === 'admin' ? -1 : 1));
  shell('usuarios', `
    <div class="page-h"><div class="grow"><span class="label">${users.filter((u) => u.active).length} activo(s)</span><h1>Usuarios</h1></div>
      <button class="btn" id="bk" title="Descarga una copia de todos los datos (sin fotos)">${ICON.down} Respaldo</button>
      <button class="btn primary" id="nu">${ICON.plus} Nuevo usuario</button></div>
    <div class="note" style="margin-bottom:16px"><b>Administrador:</b> crea y edita proyectos y levantamientos, cambia estados, crea usuarios y elimina contenido. <b>Técnico:</b> comenta, sube fotos, registra avances y equipos; no puede cambiar estados ni borrar.</div>
    <section class="panel">${users.map((u) => `<div class="urow ${u.active ? '' : 'off'}" data-id="${u.id}">${avatar(u, 'lg')}
      <div class="info"><b>${esc(u.name)}</b> ${roleTag(u)}${u.owner ? ' <span class="tag" style="--c:var(--amber)">Principal</span>' : ''}${!u.active ? ' <span class="tag" style="--c:var(--red)">Desactivado</span>' : ''}
        <div class="mono">${esc(u.username)}${u.cargo ? ' · ' + esc(u.cargo) : ''}${u.phone ? ' · ' + esc(u.phone) : ''}</div>
        <div class="dim" style="font-size:12px">${u.lastLogin ? 'Último ingreso: ' + esc(fDateTime(u.lastLogin)) : 'Nunca ha ingresado'}</div></div>
      <button class="btn sm" data-edit>${ICON.edit} Editar</button>
      ${!u.owner || S.me.owner ? `<button class="btn sm" data-pw>${ICON.key} Clave</button>` : ''}
      ${!u.owner && u.id !== S.me.id ? `<button class="btn sm ${u.active ? 'danger' : ''}" data-tog>${u.active ? 'Desactivar' : 'Activar'}</button>` : ''}
    </div>`).join('')}</section>`);
  document.getElementById('nu').onclick = () => userForm(null);
  document.getElementById('bk').onclick = async (ev) => {
    ev.target.disabled = true;
    try {
      const data = await api('/api/backup');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
      a.download = `mts-respaldo-${dayKey(new Date().toISOString())}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      toast('Respaldo descargado');
    } catch (e) { toastErr(e); }
    ev.target.disabled = false;
  };
  app.querySelectorAll('.urow').forEach((row) => {
    const u = S.users.find((x) => x.id === row.dataset.id);
    row.querySelector('[data-edit]').onclick = () => userForm(u);
    const pw = row.querySelector('[data-pw]'); if (pw) pw.onclick = () => resetPw(u);
    const tg = row.querySelector('[data-tog]');
    if (tg) tg.onclick = async () => {
      if (u.active && !(await confirmModal({ title: 'Desactivar usuario', text: `<b>${esc(u.name)}</b> ya no podrá ingresar. Sus comentarios y fotos se mantienen.`, okLabel: 'Desactivar', danger: true }))) return;
      try { await api(`/api/users/${u.id}`, { method: 'PATCH', body: { active: !u.active } }); toast(u.active ? 'Usuario desactivado' : 'Usuario activado'); viewUsers(); } catch (e) { toastErr(e); }
    };
  });
}
function genPassword() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const r = crypto.getRandomValues(new Uint32Array(10));
  return 'Mts' + [...r].slice(0, 7).map((x) => a[x % a.length]).join('');
}
function userForm(u) {
  const v = (k) => esc(u ? u[k] || '' : '');
  openModal({
    title: u ? 'Editar usuario' : 'Nuevo usuario', wide: true,
    body: `<form id="uf" class="grid2">
      <label class="field"><span>Nombre completo *</span><input class="input" name="name" required maxlength="80" value="${v('name')}"></label>
      <label class="field"><span>Usuario de acceso *</span><input class="input mono" name="username" ${u ? 'disabled' : 'required'} maxlength="30" autocapitalize="characters" spellcheck="false" placeholder="Ej: JPEREZ" value="${v('username')}"></label>
      ${u ? '' : `<label class="field span2"><span>Contraseña inicial *</span><div class="row"><input class="input mono grow" name="password" required minlength="6" maxlength="80" value="${genPassword()}"><button type="button" class="btn" id="gen">Generar</button><button type="button" class="btn icon" id="cp" aria-label="Copiar">${ICON.copy}</button></div></label>`}
      <label class="field"><span>Cargo</span><input class="input" name="cargo" maxlength="80" placeholder="Técnico instalador" value="${v('cargo')}"></label>
      <label class="field"><span>Teléfono</span><input class="input mono" name="phone" maxlength="30" value="${v('phone')}"></label>
      <label class="field span2"><span>Correo</span><input class="input" type="email" name="email" maxlength="120" value="${v('email')}"></label>
      ${u && u.owner ? '' : `<div class="field span2"><span>Permisos</span><div class="perm">
        <label><input type="radio" name="role" value="tecnico" ${!u || u.role === 'tecnico' ? 'checked' : ''}><div><b>Técnico</b><small>Puede ver todo, comentar, subir fotos, registrar avances y equipos. No cambia estados ni borra.</small></div></label>
        <label><input type="radio" name="role" value="admin" ${u && u.role === 'admin' ? 'checked' : ''}><div><b>Administrador</b><small>Mismas facultades que tu usuario: crea proyectos, cambia estados, crea usuarios y elimina contenido.</small></div></label>
      </div></div>`}
      <p class="err span2" id="ue"></p>
    </form>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" form="uf">${u ? 'Guardar' : 'Crear usuario'}</button>`,
    onMount: (el, close) => {
      const g = el.querySelector('#gen'); if (g) g.onclick = () => { el.querySelector('[name=password]').value = genPassword(); };
      const c = el.querySelector('#cp'); if (c) c.onclick = () => copyText(el.querySelector('[name=password]').value);
      el.querySelector('#uf').addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = formData(e.target);
        try {
          if (u) await api(`/api/users/${u.id}`, { method: 'PATCH', body });
          else await api('/api/users', { method: 'POST', body });
          close();
          if (!u) {
            openModal({
              title: 'Usuario creado',
              body: `<p style="margin:0">Entrega estos datos a <b>${esc(body.name)}</b>:</p>
                <div class="panel" style="padding:14px 16px"><div class="label">Usuario</div><div class="mono" style="font-size:18px">${esc(body.username.toUpperCase().replace(/\s+/g, ''))}</div>
                <div class="label" style="margin-top:10px">Contraseña</div><div class="mono" style="font-size:18px">${esc(body.password)}</div></div>
                <p class="dim" style="margin:0;font-size:13px">Puede cambiar su clave en "Mi cuenta" después de ingresar.</p>`,
              foot: `<button class="btn primary" data-close>Listo</button>`,
            });
          } else toast('Usuario actualizado');
          viewUsers();
        } catch (ex) { el.querySelector('#ue').textContent = ex.message; }
      });
    },
  });
}
function resetPw(u) {
  openModal({
    title: 'Cambiar contraseña',
    body: `<p style="margin:0" class="muted">Nueva contraseña para <b style="color:var(--ink)">${esc(u.name)}</b> (${esc(u.username)})</p>
      <div class="row"><input class="input mono grow" id="np" minlength="6" value="${genPassword()}"><button class="btn" id="gen">Generar</button><button class="btn icon" id="cp" aria-label="Copiar">${ICON.copy}</button></div><p class="err" id="pe"></p>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" id="ok">Guardar contraseña</button>`,
    onMount: (el, close) => {
      el.querySelector('#gen').onclick = () => { el.querySelector('#np').value = genPassword(); };
      el.querySelector('#cp').onclick = () => copyText(el.querySelector('#np').value);
      el.querySelector('#ok').onclick = async () => {
        try { await api(`/api/users/${u.id}`, { method: 'PATCH', body: { password: el.querySelector('#np').value } }); close(); toast('Contraseña actualizada'); }
        catch (e) { el.querySelector('#pe').textContent = e.message; }
      };
    },
  });
}

// ───────────────────────── Mi cuenta ─────────────────────────
function viewProfile() {
  const u = S.me;
  shell('perfil', `
    <div class="page-h"><div class="grow"><span class="label">Perfil</span><h1>Mi cuenta</h1></div></div>
    <div class="dash" style="grid-template-columns:1fr 1fr">
      <section class="panel hud"><div class="panel-b row" style="gap:16px;align-items:flex-start">${avatar(u, 'lg')}
        <div><h2>${esc(u.name)}</h2><div class="mono dim" style="font-size:13px;margin-top:2px">${esc(u.username)}</div>
        <div style="margin-top:10px">${roleTag(u)}${u.cargo ? ` <span class="muted" style="font-size:13.5px;margin-left:6px">${esc(u.cargo)}</span>` : ''}</div>
        <p class="muted" style="font-size:13.5px;margin:14px 0 0">${u.role === 'admin' ? 'Tienes acceso completo: proyectos, estados, usuarios y eliminación de contenido.' : 'Puedes comentar, registrar avances y equipos, y subir fotos en todos los proyectos y levantamientos.'}</p></div></div></section>
      <section class="panel"><div class="panel-h"><h2>Cambiar contraseña</h2></div><div class="panel-b">
        <form id="pf" style="display:grid;gap:14px">
          <label class="field"><span>Contraseña actual</span><input class="input" type="password" name="current" required autocomplete="current-password"></label>
          <label class="field"><span>Nueva contraseña</span><input class="input" type="password" name="password" required minlength="6" autocomplete="new-password"></label>
          <label class="field"><span>Repetir nueva contraseña</span><input class="input" type="password" name="password2" required minlength="6" autocomplete="new-password"></label>
          <p class="err" id="pfe"></p>
          <button class="btn primary">Actualizar contraseña</button>
        </form></div></section>
    </div>`);
  if (window.innerWidth < 1100) app.querySelector('.dash').style.gridTemplateColumns = '1fr';
  document.getElementById('pf').addEventListener('submit', async (e) => {
    e.preventDefault();
    const b = formData(e.target); const err = document.getElementById('pfe');
    if (b.password !== b.password2) { err.textContent = 'Las contraseñas nuevas no coinciden'; return; }
    try { await api('/api/me/password', { method: 'POST', body: b }); e.target.reset(); err.textContent = ''; toast('Contraseña actualizada'); }
    catch (ex) { err.textContent = ex.message; }
  });
}

// ───────────────────────── Exportar equipos a Excel ─────────────────────────
let xlsxLoading = null;
function loadXlsx() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (!xlsxLoading) xlsxLoading = new Promise((resolve, reject) => {
    const sc = document.createElement('script');
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    sc.onload = () => resolve(window.XLSX);
    sc.onerror = () => { xlsxLoading = null; reject(new Error('No se pudo cargar el generador de Excel. Revisa tu conexión.')); };
    document.head.appendChild(sc);
  });
  return xlsxLoading;
}
function exportEquipment() {
  const r = REC.record;
  openModal({
    title: 'Exportar equipos a Excel',
    body: `<p class="muted" style="margin:0">Se descargará un archivo Excel con los <b style="color:var(--ink)">${REC.equipment.length} equipo(s)</b> de ${esc(r.code)} · ${esc(r.name)}.</p>
      <div class="perm">
        <label><input type="radio" name="xmode" value="cliente" checked><div><b>Para el cliente</b><small>Sin usuarios ni claves de los equipos.</small></div></label>
        <label><input type="radio" name="xmode" value="interno"><div><b>Uso interno</b><small>Incluye usuario y clave de cada equipo. No lo compartas fuera de MTS.</small></div></label>
      </div><p class="err" id="xe"></p>`,
    foot: `<button class="btn" data-close>Cancelar</button><button class="btn primary" id="xok">${ICON.down} Descargar Excel</button>`,
    onMount: (el, close) => {
      el.querySelector('#xok').onclick = async (ev) => {
        ev.target.disabled = true;
        try {
          const XLSX = await loadXlsx();
          const withCreds = el.querySelector('input[name=xmode]:checked').value === 'interno';
          const head = ['N°', 'Equipo', 'Marca', 'Modelo', 'IP', 'Puerto', 'Ubicación', 'MAC', 'N° de serie'].concat(withCreds ? ['Usuario', 'Clave'] : []).concat(['Notas']);
          const rows = REC.equipment.map((e, i) => [i + 1, e.type, e.brand, e.model, e.ip, e.port, e.location, e.mac, e.serial].concat(withCreds ? [e.username, e.password] : []).concat([e.notes]));
          const aoa = [
            ['MTS SECURITY SPA · Listado de equipos'],
            [`${r.code} · ${r.name}`],
            [`Cliente: ${r.client || '—'}${r.address ? '   ·   Dirección: ' + r.address : ''}`],
            [`Generado: ${fDateTime(new Date().toISOString())} por ${S.me.name}`],
            [],
            head,
            ...rows,
          ];
          const ws = XLSX.utils.aoa_to_sheet(aoa);
          ws['!cols'] = head.map((h) => ({ wch: ({ 'N°': 5, Equipo: 18, IP: 16, Puerto: 8, Ubicación: 24, Notas: 30, 'N° de serie': 20, MAC: 18 })[h] || 14 }));
          ws['!merges'] = [0, 1, 2, 3].map((rr) => ({ s: { r: rr, c: 0 }, e: { r: rr, c: head.length - 1 } }));
          ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 5, c: 0 }, e: { r: 5 + rows.length, c: head.length - 1 } }) };
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Equipos');
          const safe = `${r.code} ${r.name}`.replace(/[\\/:*?"<>|]+/g, '').slice(0, 80);
          XLSX.writeFile(wb, `Equipos ${safe}${withCreds ? ' (interno)' : ''}.xlsx`);
          close(); toast('Excel descargado');
        } catch (e) { el.querySelector('#xe').textContent = e.message; ev.target.disabled = false; }
      };
    },
  });
}

// ───────────────────────── Avisos (notificaciones) ─────────────────────────
const unreadTotal = () => (isAdmin() ? S.notif.unread : 0) + S.ment.unread;
function updateBadges() {
  const n = unreadTotal();
  document.querySelectorAll('.nbadge').forEach((b) => { b.textContent = n > 99 ? '99+' : n; b.classList.toggle('hidden', !n); });
  document.title = (n ? `(${n}) ` : '') + 'MTS Operaciones';
}
// ── Menciones ──
const MENT_CTX = { comentario: 'un comentario', avance: 'un avance diario', incidencia: 'una incidencia', material: 'un registro de material', mantencion: 'una mantención', estado: 'un cambio de estado', ficha: 'la ficha', equipo: 'las notas de un equipo' };
async function refreshMentions() {
  try { const d = await api('/api/mentions'); S.ment.items = d.items; S.ment.unread = d.unread; updateBadges(); } catch { /* sin menciones */ }
}
function mentionItem(m) {
  const u = userById(m.byUser);
  return `<a class="nitem ${m.unread ? 'unread' : ''}" href="#/r/${m.recordId}" data-ment="${m.id}">${avatar(u)}<div style="min-width:0;flex:1">
    <div class="t"><b>${esc(u.name)}</b> te mencionó en ${esc(MENT_CTX[m.context] || 'un registro')}</div>
    <div class="x">${m.record ? `${esc(m.record.code)} · ${esc(m.record.name)}` : ''}</div>
    ${m.snippet ? `<div class="nt">${richText(m.snippet.slice(0, 200))}${m.snippet.length > 200 ? '…' : ''}</div>` : ''}
    <div class="d">${esc(fDateTime(m.at))}</div></div></a>`;
}
function mentionsPanel() {
  const items = S.ment.items.slice(0, 8);
  if (!items.length) return '';
  return `<section class="panel hud ment-panel" style="margin-bottom:18px">
    <div class="panel-h"><h2 class="grow">${ICON.bell} Te mencionaron${S.ment.unread ? ` <span class="nbadge" style="position:static;margin-left:6px">${S.ment.unread}</span>` : ''}</h2>
      ${S.ment.unread ? '<button class="btn sm ghost" id="ment-all">Marcar todas como leídas</button>' : ''}</div>
    <div class="nlist" style="margin:0;max-height:none">${items.map(mentionItem).join('')}</div></section>`;
}
function bindMentionLinks(root, after) {
  root.querySelectorAll('[data-ment]').forEach((a) => a.addEventListener('click', () => {
    const m = S.ment.items.find((x) => x.id === a.dataset.ment);
    if (m && m.unread) { m.unread = false; S.ment.unread = Math.max(0, S.ment.unread - 1); updateBadges(); api('/api/mentions/seen', { method: 'POST', body: { id: m.id } }).catch(() => {}); }
    if (after) after();
  }));
}
function onNewMention(m) {
  const u = userById(m.byUser);
  const rec = S.records.find((x) => x.id === m.recordId);
  toast(`${u.name} te mencionó${rec ? ' en ' + rec.code : ''}`, 'var(--accent)');
  browserNotify(`${u.name} te mencionó${rec ? ' · ' + rec.name : ''}`, String(m.snippet || '').slice(0, 180), m.recordId, 'm-' + m.id);
  refreshMentions().then(() => { if ((location.hash || '#/panel').startsWith('#/panel')) viewDashboard().catch(() => {}); });
}
async function refreshNotifications() {
  try { const d = await api('/api/notifications'); S.notif.items = d.items; S.notif.unread = d.unread; updateBadges(); } catch { /* sin avisos */ }
}
const notifSupported = () => 'Notification' in window;
function browserNotify(title, body, recordId, tag) {
  if (!notifSupported() || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, { body, icon: 'img/logo.png', tag });
    n.onclick = () => { window.focus(); if (recordId) location.hash = `#/r/${recordId}`; n.close(); };
  } catch { /* algunos celulares no permiten avisos fuera de la app */ }
}
function onNewEntry(e) {
  if (!isAdmin() || e.userId === S.me.id) return;
  S.notif.unread++; updateBadges();
  const u = userById(e.userId);
  const rec = S.records.find((x) => x.id === e.recordId);
  const tm = ENTRY_META[e.type] || ENTRY_META.comentario;
  const where = rec ? `${rec.code} · ${rec.name}` : 'un proyecto';
  const isInc = e.type === 'incidencia';
  toast(`${isInc ? '⚠ ' : ''}${u.name}: ${tm.label.toLowerCase()} en ${where}`, isInc ? 'var(--red)' : 'var(--cyan)');
  if (document.hidden || isInc) browserNotify(`${isInc ? '⚠ Incidencia' : tm.label} · ${rec ? rec.name : 'MTS'}`, `${u.name}: ${e.text || 'subió fotos'}`.slice(0, 180), e.recordId, e.id);
  refreshNotifications();
}
function startNotifications() {
  refreshMentions();
  window.mtsWatchMentions(S.me.id, onNewMention);
  if (!isAdmin()) { window.mtsWatchAllEntries(null); return; }
  refreshNotifications();
  window.mtsWatchAllEntries(onNewEntry);
}
async function openNotifications() {
  await Promise.all([isAdmin() ? refreshNotifications() : null, refreshMentions()]);
  const items = S.notif.items;
  const perm = notifSupported() ? Notification.permission : 'unsupported';
  const permBox = perm === 'granted' ? `<div class="note">${ICON.check.replace('<svg', '<svg style="width:15px;height:15px;vertical-align:-2px;margin-right:6px"')}<b>Avisos del navegador activados.</b> Te llegará un aviso aunque tengas la plataforma minimizada o en otra pestaña.</div>`
    : perm === 'denied' ? `<div class="note">Los avisos del navegador están bloqueados. Para activarlos, toca el candado junto a la dirección de la página y permite <b>Notificaciones</b>.</div>`
    : perm === 'unsupported' ? `<div class="note">Este navegador no permite avisos. Los verás aquí y en la campana mientras la plataforma esté abierta.</div>`
    : `<div class="note row wrap" style="gap:10px"><span class="grow">Activa los avisos del navegador para enterarte aunque la plataforma esté minimizada.</span><button class="btn sm primary" id="nperm">${ICON.bell} Activar avisos</button></div>`;
  const list = items.length ? items.map((e) => {
    const u = userById(e.userId); const tm = ENTRY_META[e.type] || ENTRY_META.comentario;
    return `<a class="nitem ${e.unread ? 'unread' : ''}" href="#/r/${e.recordId}" data-close-nav>${avatar(u)}<div style="min-width:0;flex:1">
      <div class="t"><b>${esc(u.name)}</b> <span class="tag" style="--c:${tm.c}">${esc(tm.label)}</span></div>
      <div class="x">${e.record ? `${esc(e.record.code)} · ${esc(e.record.name)}` : ''}</div>
      ${e.text ? `<div class="nt">${richText(e.text.slice(0, 160))}${e.text.length > 160 ? '…' : ''}</div>` : ''}
      <div class="d">${esc(fDateTime(e.at))}</div></div></a>`;
  }).join('') : `<div class="empty" style="padding:30px 10px">${ICON.bell}<p>Sin avisos todavía.<br><span class="dim">Aquí aparecerá todo lo que registre tu equipo en los proyectos.</span></p></div>`;
  const ments = S.ment.items.length ? `<div class="label" style="margin:14px 0 6px">Menciones</div><div class="nlist" style="margin:0 -18px 14px;max-height:34vh">${S.ment.items.slice(0, 20).map(mentionItem).join('')}</div>` : '';
  const total = unreadTotal();
  openModal({
    title: `Avisos${total ? ` · ${total} nuevo${total === 1 ? '' : 's'}` : ''}`,
    body: isAdmin() ? `${permBox}${ments}${ments ? '<div class="label" style="margin:0 0 6px">Actividad del equipo</div>' : ''}<div class="nlist">${list}</div>`
      : `${permBox}${ments || `<div class="empty" style="padding:30px 10px">${ICON.bell}<p>Sin menciones todavía.<br><span class="dim">Cuando alguien escriba @${esc(S.me.username)} en un comentario, aparecerá aquí.</span></p></div>`}`,
    onMount: (el, close) => {
      const pb = el.querySelector('#nperm');
      if (pb) pb.onclick = async () => {
        const res = await Notification.requestPermission();
        if (res === 'granted') { toast('Avisos activados'); browserNotify('MTS Operaciones', 'Así se verán los avisos de tu equipo.', null, 'test'); }
        close(); openNotifications();
      };
      el.querySelectorAll('[data-close-nav]').forEach((a) => a.addEventListener('click', () => close()));
      bindMentionLinks(el, close);
    },
  });
  if (isAdmin() && S.notif.unread) { api('/api/notifications/seen', { method: 'POST' }).then(() => { S.notif.unread = 0; updateBadges(); }).catch(() => {}); }
}

// ───────────────────────── Aviso al iniciar sesión ─────────────────────────
async function welcomeNotice() {
  await refreshMentions();
  const n = S.ment.unread;
  openModal({
    title: 'Aviso',
    body: `<div style="text-align:center;padding:6px 4px">
      <div style="width:56px;height:56px;margin:0 auto 14px;border-radius:50%;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent)">${ICON.bell.replace('<svg', '<svg style="width:28px;height:28px"')}</div>
      <p style="margin:0 0 10px;font-size:16px;line-height:1.5">Por favor revisar la <b>campanita de notificaciones</b> si es que fuiste mencionado en algún proyecto.</p>
      <p class="muted" style="margin:0">Atentamente, su jefecito Matías :)</p>
      ${n ? `<div class="note" style="margin-top:16px;text-align:left">Tienes <b>${n} mención${n === 1 ? '' : 'es'} sin leer</b>.</div>` : ''}
    </div>`,
    foot: `<button class="btn" data-close>Entendido</button><button class="btn primary" id="wn-open">${ICON.bell} Ver notificaciones</button>`,
    onMount: (el, close) => { el.querySelector('#wn-open').onclick = () => { close(); openNotifications(); }; },
  });
}

// ───────────────────────── Autocompletar @menciones ─────────────────────────
// Funciona en cualquier cuadro de texto de la plataforma: al escribir @ aparece la lista de usuarios.
const mentionPop = { el: null, field: null, start: 0, list: [], i: 0 };
const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function mentionQuery(f) {
  const pos = f.selectionStart; if (pos == null) return null;
  const m = /(^|[^\w@])@([A-Za-z0-9_.\-\u00C0-\u017F]*)$/.exec(f.value.slice(0, pos));
  return m ? { start: pos - m[2].length - 1, q: m[2] } : null;
}
function closeMentionPop() { if (mentionPop.el) mentionPop.el.remove(); mentionPop.el = null; mentionPop.field = null; }
function drawMentionPop() {
  const { list, i, field } = mentionPop;
  if (!mentionPop.el) { mentionPop.el = document.createElement('div'); mentionPop.el.className = 'mention-pop'; document.body.appendChild(mentionPop.el); }
  const el = mentionPop.el;
  el.innerHTML = `<div class="mp-h">Mencionar a…</div>` + list.map((u, k) => `<button type="button" class="mp-i ${k === i ? 'on' : ''}" data-k="${k}">${avatar(u)}<span><b>${esc(u.name)}</b><small>@${esc(u.username)} · ${u.role === 'admin' ? 'Administrador' : 'Técnico'}</small></span></button>`).join('');
  const r = field.getBoundingClientRect();
  const h = Math.min(260, 34 + list.length * 50);
  const below = window.innerHeight - r.bottom > h + 8 || r.top < h + 8;
  el.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 300)) + 'px';
  el.style.top = (below ? r.bottom + 4 : r.top - h - 4) + 'px';
  el.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('mousedown', (ev) => { ev.preventDefault(); pickMention(Number(b.dataset.k)); }));
}
function pickMention(k) {
  const f = mentionPop.field; const u = mentionPop.list[k]; if (!f || !u) return;
  const end = f.selectionStart;
  const ins = '@' + u.username + ' ';
  f.value = f.value.slice(0, mentionPop.start) + ins + f.value.slice(end);
  const p = mentionPop.start + ins.length; f.setSelectionRange(p, p);
  closeMentionPop();
  f.dispatchEvent(new Event('input', { bubbles: true }));
  f.focus();
}
document.addEventListener('input', (e) => {
  const f = e.target;
  if (!S.me || f.tagName !== 'TEXTAREA') return;
  const q = mentionQuery(f);
  if (!q) { if (mentionPop.field === f) closeMentionPop(); return; }
  const n = norm(q.q);
  const list = S.users.filter((u) => u.active && u.id !== S.me.id && (!n || norm(u.username).includes(n) || norm(u.name).split(/\s+/).some((w) => w.startsWith(n)) || norm(u.name).includes(n))).slice(0, 6);
  if (!list.length) { closeMentionPop(); return; }
  Object.assign(mentionPop, { field: f, start: q.start, list, i: 0 });
  drawMentionPop();
});
document.addEventListener('keydown', (e) => {
  if (!mentionPop.el || e.target !== mentionPop.field) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = mentionPop.list.length; mentionPop.i = (mentionPop.i + (e.key === 'ArrowDown' ? 1 : n - 1)) % n; drawMentionPop(); }
  else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); pickMention(mentionPop.i); }
  else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMentionPop(); }
}, true);
document.addEventListener('focusout', (e) => { if (e.target === mentionPop.field) setTimeout(closeMentionPop, 120); });
window.addEventListener('resize', closeMentionPop);
document.addEventListener('scroll', (e) => { if (mentionPop.el && !mentionPop.el.contains(e.target)) closeMentionPop(); }, true);

// ───────────────────────── Inicio ─────────────────────────
async function boot() {
  if (!window.mtsConfigured) {
    app.innerHTML = `<div class="login-form" style="min-height:100vh"><div class="login-card panel hud"><img class="logo" src="img/logo.png" alt=""><h2>Falta configurar</h2>
      <p class="muted" style="text-align:center">Completa el archivo <b class="mono">config.js</b> con la URL y la clave pública (anon) de tu proyecto Supabase.</p></div></div>`;
    return;
  }
  try {
    const d = await api('/api/me');
    S.me = d.user;
  } catch { return renderLogin(); }
  await Promise.all([refreshUsers(), refreshRecords().catch(() => {})]);
  startNotifications();
  if (!location.hash || location.hash === '#/') location.hash = '#/panel';
  else route();
}
boot();
