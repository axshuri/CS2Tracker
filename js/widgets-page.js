/* ============================================================
   WIDGETS PAGE — embed snippet workshop.
   ------------------------------------------------------------
   Extending widgets later = append an entry to WIDGET_TYPES
   (id, label, copy, iframe dims). The preview, code generator
   and copy flow are generic and will pick the new type up.
   Each widget is a self-contained <iframe> into player.html
   with &embed=<id>, so an external site only needs the snippet.
   ============================================================ */
(function () {
  'use strict';
  const PD = window.PlayerData;
  const CSO = window.CSO;
  const esc = CSO.escapeHtml;
  const byId = (id) => document.getElementById(id);

  const WIDGET_TYPES = [
    { id: 'profile', label: 'PROFILE BADGE', desc: 'A compact identity card — avatar, name, K/D, HLTV rating, win rate and headshot %. The primary "who is this player" widget.', width: 340, height: 190 },
    { id: 'stats', label: 'STATISTICS CARD', desc: 'An eight-stat scoreboard (K/D, rating, win rate, HS, ADR, KAST, games, kills) for forums, team pages and match threads.', width: 380, height: 300 }
  ];

  let current = null; // { id, profile }

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'midnight';
  }

  function widgetSrc(type) {
    if (!current) return '';
    return 'player.html?id=' + encodeURIComponent(current.id) + '&embed=' + type + '&theme=' + currentTheme();
  }

  function siteBase() {
    if (location.protocol === 'http:' || location.protocol === 'https:') {
      const parts = location.pathname.split('/');
      parts.pop();
      return location.origin + parts.join('/') + '/';
    }
    return ''; // opened via file:// — relative only
  }

  /* ------------------------------------------------------------
     STEP 1 — player chooser
     ------------------------------------------------------------ */
  function setupPlayerPicker() {
    const pickBtn = byId('wg-pick');
    const pickerHost = byId('wg-picker');
    const input = byId('wg-search');
    const results = byId('wg-search-results');
    let mounted = null;

    const open = () => {
      pickBtn.hidden = true;
      pickerHost.hidden = false;
      input.value = '';
      input.focus();
      if (mounted) mounted.close();
      mounted = CSO.mountSearch(input, results, {
        onPick: (profile) => {
          const meta = profile && PD.hasSnapshot(profile.steamid) ? PD.profileMeta(profile.steamid) : profile;
          if (!meta) return;
          current = { id: meta.steamid, profile: meta };
          pickerHost.hidden = true;
          pickBtn.hidden = false;
          pickBtn.innerHTML = `<img class="wg-avatar" alt="" src="${esc((PD.avatarCandidates(meta)[0]) || CSO.PLACEHOLDER)}" data-candidates="${esc(PD.avatarCandidates(meta).join('|'))}"/><b>${esc(meta.name)}</b><span>${esc(String(meta.steamid).slice(-6))} · ${meta.dossier ? 'DOSSIER' : 'TRACKED'}</span><em>CHANGE ⌕</em>`;
          const img = pickBtn.querySelector('.wg-avatar');
          CSO.wireAvatar(img, PD.avatarCandidates(meta));
          const note = byId('wg-player-note');
          note.hidden = false;
          note.innerHTML = '<b>' + esc(meta.name) + ' LOCKED IN.</b> Previews below are live — every widget auto-loads this player&rsquo;s current stats from the registry.';
          renderGallery();
        }
      });
    };
    CSO.on(pickBtn, 'click', open);
    CSO.on(pickBtn, 'keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  }

  /* ------------------------------------------------------------
     STEP 2 — gallery
     ------------------------------------------------------------ */
  function renderGallery() {
    const gallery = byId('widget-gallery');
    const msg = byId('wg-message');
    if (!current) { gallery.innerHTML = ''; if (msg) msg.hidden = false; return; }
    if (msg) msg.hidden = true;

    gallery.innerHTML = WIDGET_TYPES.map((t, i) => {
      const src = widgetSrc(t.id);
      return `<article class="widget-card panel" data-widget="${t.id}">
        <div class="card-heading"><div><p class="eyebrow">WIDGET 0${i + 1} // ${t.label}</p><h3>${t.label.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}</h3></div><span class="table-note">${t.width} × ${t.height} · IFRAME</span></div>
        <div class="widget-preview"><iframe src="${esc(src)}" width="${t.width}" height="${t.height}" loading="lazy" scrolling="no" title="${esc(t.label)} preview"></iframe></div>
        <p class="widget-desc">${esc(t.desc)}</p>
        <div class="empty-actions"><button class="hero-cta get-code" type="button" data-widget="${t.id}">GET EMBED CODE ↗</button></div>
      </article>`;
    }).join('');

    gallery.querySelectorAll('.get-code').forEach((btn) => {
      CSO.on(btn, 'click', () => openModal(btn.dataset.widget));
    });
    requestAnimationFrame(() => CSO.initReveals());
  }

  /* ------------------------------------------------------------
     STEP 3 — embed code modal
     ------------------------------------------------------------ */
  function openModal(typeId) {
    const type = WIDGET_TYPES.find((t) => t.id === typeId);
    if (!type || !current) return;
    const src = widgetSrc(typeId);
    const base = siteBase();
    const absolute = base ? base + src : src;
    const themed = '&theme=' + currentTheme();

    const code =
`<!-- ${type.label} · ${current.profile.name} — Midnight Field -->
<iframe
  src="${absolute}${base ? '' : ''}"
  style="width:${type.width}px;max-width:100%;height:${type.height}px;border:1px solid rgba(141,153,178,.28);border-radius:10px;background:#080d1b;overflow:hidden;"
  loading="lazy"
  scrolling="no"
  title="${current.profile.name} — ${type.label.toLowerCase()}">
</iframe>`;

    byId('embed-modal-title').textContent = type.label + ' — ' + current.profile.name;
    byId('embed-modal-desc').textContent = type.desc;
    const pre = byId('embed-code');
    pre.textContent = code;
    byId('embed-preview-link').setAttribute('href', absolute + (absolute.indexOf('&theme=') === -1 ? themed : ''));
    byId('embed-note').textContent = base
      ? 'Code above uses this site\'s address. Host the five HTML/CSS/JS files anywhere and the snippet keeps working.'
      : 'These files are open directly from disk (file://), which external websites cannot reach. Host them on any static host, then paste that URL in place of "player.html" in the snippet.';
    byId('embed-modal').hidden = false;
    document.body.classList.add('modal-open');
    const copyBtn = byId('embed-copy');
    copyBtn.dataset.code = code;
    byId('embed-modal-close').focus();
  }

  function closeModal() {
    byId('embed-modal').hidden = true;
    document.body.classList.remove('modal-open');
  }

  function copyCode(button) {
    const code = button.dataset.code || '';
    const done = () => {
      button.textContent = 'COPIED ✓';
      setTimeout(() => { button.textContent = 'COPY CODE'; }, 1800);
      CSO.toast('Embed code copied to clipboard');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(done).catch(() => fallbackCopy(code, done));
    } else fallbackCopy(code, done);
  }

  function fallbackCopy(code, done) {
    const ta = document.createElement('textarea');
    ta.value = code;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { CSO.toast('Select the code and copy manually'); }
    document.body.removeChild(ta);
  }

  /* ------------------------------------------------------------
     BOOT
     ------------------------------------------------------------ */
  async function boot() {
    const navInput = byId('nav-search');
    const navResults = byId('nav-search-results');
    if (navInput && navResults) CSO.mountSearch(navInput, navResults, { onPick: CSO.openProfile });

    setupPlayerPicker();

    CSO.on(byId('embed-modal-close'), 'click', closeModal);
    CSO.on(byId('embed-done'), 'click', closeModal);
    CSO.on(byId('embed-copy'), 'click', (e) => copyCode(e.currentTarget));
    CSO.on(byId('embed-modal'), 'click', (e) => { if (e.target === e.currentTarget) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    // preselect from ?player=
    const preset = CSO.qs('player');
    if (preset) {
      const profile = PD.profileMeta(preset);
      if (profile) {
        current = { id: profile.steamid, profile };
        const pickBtn = byId('wg-pick');
        pickBtn.innerHTML = `<img class="wg-avatar" alt="" src="${esc((PD.avatarCandidates(profile)[0]) || CSO.PLACEHOLDER)}" data-candidates="${esc(PD.avatarCandidates(profile).join('|'))}"/><b>${esc(profile.name)}</b><span>${esc(String(profile.steamid).slice(-6))} · ${profile.dossier ? 'DOSSIER' : 'TRACKED'}</span><em>CHANGE ⌕</em>`;
        const img = pickBtn.querySelector('.wg-avatar');
        CSO.wireAvatar(img, PD.avatarCandidates(profile));
        byId('wg-player-note').hidden = false;
        byId('wg-player-note').innerHTML = '<b>' + esc(profile.name) + ' LOCKED IN.</b> Previews below are live — every widget auto-loads this player&rsquo;s current stats from the registry.';
        renderGallery();
      }
    }
    requestAnimationFrame(() => CSO.initReveals());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { boot(); });
  else boot();
})();
