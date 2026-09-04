/* ============================================================
   COMMON UI LAYER — theme system, skeleton handoff, reveals,
   toasts, CS2 rank SVGs, avatar fallback chain, universal search.
   ------------------------------------------------------------
   Loaded on every page (classic script, file:// friendly).
   Talks to `window.PlayerData` (data/players.js) but never to
   the network itself. Each page then runs its own init script.
   ============================================================ */
(function (global) {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
  const on = (el, ev, fn, opts) => { if (el) el.addEventListener(ev, fn, opts); };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function qs(name) {
    return new URLSearchParams(global.location.search).get(name);
  }

  /* ============================================================
     THEME SYSTEM (shared across every page)
     ============================================================ */
  const THEMES = {
    midnight: { label: 'MIDNIGHT', a: '#f07aa5', b: '#8eddd5', meta: '#080d1b' },
    daybreak: { label: 'DAYBREAK', a: '#d64545', b: '#0e7a72', meta: '#f4efe6' },
    synthwave: { label: 'SYNTHWAVE', a: '#ff3ecf', b: '#21e6ff', meta: '#0d0416' },
    forest: { label: 'FOREST', a: '#e8914f', b: '#7fd8a4', meta: '#0a130d' },
    terminal: { label: 'TERMINAL', a: '#ffb64d', b: '#cfe3a8', meta: '#0b0a07' }
  };
  const VALID_THEMES = Object.keys(THEMES);
  const STORE_KEY = 'arshi-theme';

  let currentTheme = 'midnight';
  function themeName() { return currentTheme; }
  function readStored() {
    try { const t = localStorage.getItem(STORE_KEY); return VALID_THEMES.indexOf(t) !== -1 ? t : 'midnight'; }
    catch (e) { return 'midnight'; }
  }
  function storeTheme(name) { try { localStorage.setItem(STORE_KEY, name); } catch (e) { /* ignore */ } }

  function initTheme() {
    currentTheme = readStored();
    const doc = document.documentElement;
    doc.setAttribute('data-theme', currentTheme);
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEMES[currentTheme].meta);

    const toggle = $('#theme-toggle');
    const menu = $('#theme-menu');
    const label = $('#theme-toggle-label');
    if (!toggle || !menu) return;

    const apply = (name) => {
      currentTheme = name;
      doc.setAttribute('data-theme', name);
      const t = THEMES[name];
      if (label) label.textContent = t.label;
      const swatch = $('.theme-swatch', toggle);
      if (swatch) { swatch.style.setProperty('--a', t.a); swatch.style.setProperty('--b', t.b); }
      if (meta) meta.setAttribute('content', t.meta);
      $$('[data-theme]', menu).forEach((item) => item.classList.toggle('active', item.dataset.theme === name));
      storeTheme(name);
    };
    apply(currentTheme);

    on(toggle, 'click', (event) => {
      event.stopPropagation();
      const open = !menu.classList.contains('open');
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    on(menu, 'click', (event) => {
      const item = event.target.closest('[data-theme]');
      if (!item) return;
      apply(item.dataset.theme);
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.theme-switch')) { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* ============================================================
     TOAST
     ============================================================ */
  function toast(message) {
    let el = $('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el.__t);
    el.__t = setTimeout(() => el.classList.remove('show'), 2400);
  }

  /* ============================================================
     COUNT-UP + SCROLL REVEALS
     ============================================================ */
  function animateNumber(el) {
    const small = el.querySelector('small');
    const node = small ? el.firstChild : el;
    const raw = (node.textContent || '').trim();
    const value = parseFloat(raw);
    if (!Number.isFinite(value)) return;
    const decimals = (raw.split('.')[1] || '').length;
    const duration = 1200;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      node.textContent = (value * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
      else node.textContent = raw;
    };
    requestAnimationFrame(step);
  }

  let revealObserver = null;
  function initReveals() {
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          el.classList.add('in-view');
          revealObserver.unobserve(el);
          const strong = el.matches('.metric-card') ? el.querySelector(':scope > strong') : null;
          if (strong) animateNumber(strong);
        });
      }, { threshold: 0.12 });
    }
    // Idempotent: late-injected panels (e.g. dynamic profiles) are
    // picked up here without double-observing already-animated ones.
    $$('.panel, .notice-bar, .command-strip, .data-row, .reveal').forEach((el) => {
      if (!el.classList.contains('in-view')) revealObserver.observe(el);
    });
  }

  /* ============================================================
     SKELETON → CONTENT HANDSHAKE
     Pages without a skeleton flip straight to .is-loaded.
     ============================================================ */
  function revealPage() {
    document.body.classList.add('is-loaded');
    const skeleton = $('#skeleton');
    const reduced = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (skeleton && !reduced) {
      skeleton.classList.add('hide');
      setTimeout(() => { if (skeleton.parentNode) skeleton.parentNode.removeChild(skeleton); }, 620);
      setTimeout(() => requestAnimationFrame(initReveals), 340);
    } else {
      if (skeleton) skeleton.remove();
      requestAnimationFrame(initReveals);
    }
  }

  function initHandoff() {
    const reduced = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !$('#skeleton')) revealPage();
    else setTimeout(revealPage, 950);
  }

  /* ============================================================
     CS2 RANK EMBLEMS (inline SVG) — shared with every profile
     ============================================================ */
  const RANKS = [
    { name: 'Silver I', num: 'I', tier: 'silver' },
    { name: 'Silver II', num: 'II', tier: 'silver' },
    { name: 'Silver III', num: 'III', tier: 'silver' },
    { name: 'Silver IV', num: 'IV', tier: 'silver' },
    { name: 'Gold Nova I', num: 'I', tier: 'nova' },
    { name: 'Gold Nova II', num: 'II', tier: 'nova' },
    { name: 'Gold Nova III', num: 'III', tier: 'nova' },
    { name: 'Gold Nova IV', num: 'IV', tier: 'nova' },
    { name: 'Master Guardian I', num: 'I', tier: 'mg' },
    { name: 'Master Guardian II', num: 'II', tier: 'mg' },
    { name: 'Master Guardian Elite', num: '', tier: 'mge' },
    { name: 'Distinguished Master Guardian', num: '', tier: 'dmg' },
    { name: 'Legendary Eagle', num: '', tier: 'eagle' },
    { name: 'Legendary Eagle Master', num: '', tier: 'lem' },
    { name: 'Supreme Master First Class', num: '', tier: 'supreme' },
    { name: 'The Global Elite', num: '', tier: 'global' }
  ];

  const RANK_TIERS = {
    silver: { light: '#d9dde2', dark: '#7f8891', crest: '' },
    nova: { light: '#f4d97e', dark: '#a9811f', crest: 'star4' },
    mg: { light: '#70e0b0', dark: '#1c8a5e', crest: 'wings' },
    mge: { light: '#70e0b0', dark: '#1c8a5e', crest: 'wings-star' },
    dmg: { light: '#84bafb', dark: '#2a6fc2', crest: 'star5' },
    eagle: { light: '#c29efb', dark: '#6136c9', crest: 'eagle' },
    lem: { light: '#e39cfb', dark: '#8f35c4', crest: 'eagle' },
    supreme: { light: '#ff8ba0', dark: '#ab2c48', crest: 'laurel' },
    global: { light: '#ffe57a', dark: '#c1931f', crest: 'globe' }
  };
  const SHIELD_PATH = 'M16 1.5 L28.5 5.6 V16.3 C28.5 24.9 23.4 30.9 16 34.2 C8.6 30.9 3.5 24.9 3.5 16.3 V5.6 Z';
  const RANK_CRESTS = {
    star4: '<path d="M16 6.6 L17.9 10 L21.3 11.9 L17.9 13.8 L16 17.2 L14.1 13.8 L10.7 11.9 L14.1 10 Z" fill="#fff" opacity=".92"/>',
    star5: '<path d="M16 6.4 L18.1 10.1 L22.2 10.6 L19.3 13.4 L19.9 17.5 L16 15.6 L12.1 17.5 L12.7 13.4 L9.8 10.6 L13.9 10.1 Z" fill="#fff" opacity=".92"/>',
    wings: '<path d="M5.2 12.4 L12.4 9.6 L12.4 11.9 L7.4 13.7 Z" fill="#fff" opacity=".85"/><path d="M26.8 12.4 L19.6 9.6 L19.6 11.9 L24.6 13.7 Z" fill="#fff" opacity=".85"/>',
    'wings-star': '<path d="M5.2 13.4 L12.4 10.6 L12.4 12.9 L7.4 14.7 Z" fill="#fff" opacity=".85"/><path d="M26.8 13.4 L19.6 10.6 L19.6 12.9 L24.6 14.7 Z" fill="#fff" opacity=".85"/><path d="M16 7.2 L17.5 10 L20.6 10.4 L18.5 12.5 L19 15.6 L16 14 L13 15.6 L13.5 12.5 L11.4 10.4 L14.5 10 Z" fill="#fff" opacity=".95"/>',
    eagle: '<path d="M16 11.2 L19 14.6 L16 13.2 L13 14.6 Z" fill="#fff" opacity=".95"/><path d="M13 14.6 L8.2 10.8 L11.8 15.2 Z" fill="#fff" opacity=".85"/><path d="M19 14.6 L23.8 10.8 L20.2 15.2 Z" fill="#fff" opacity=".85"/><circle cx="16" cy="9.7" r="1.2" fill="#fff"/>',
    laurel: '<circle cx="16" cy="11.6" r="4.3" fill="none" stroke="#fff" stroke-width=".95" stroke-dasharray="2.6 1.5" opacity=".9"/><path d="M16 8.3 L17.3 10.7 L19.9 11.1 L18.1 12.9 L18.6 15.6 L16 14.3 L13.4 15.6 L13.9 12.9 L12.1 11.1 L14.7 10.7 Z" fill="#fff" opacity=".95"/>',
    globe: '<circle cx="16" cy="11.4" r="4.5" fill="#fff" opacity=".95"/><ellipse cx="16" cy="11.4" rx="4.5" ry="1.75" fill="none" stroke="#7a5d0e" stroke-width=".75" opacity=".85"/><path d="M16 6.9 V15.9" stroke="#7a5d0e" stroke-width=".75" opacity=".85"/>'
  };

  function rankIcon(index) {
    const rank = RANKS[index];
    const tier = RANK_TIERS[rank.tier];
    const gid = 'rank-grad-' + index;
    const numeral = rank.num ? `<text x="16" y="26.6" text-anchor="middle" font-family="Barlow Condensed, Arial, sans-serif" font-size="9" font-weight="800" fill="#fff" opacity=".96">${rank.num}</text>` : '';
    return `<svg class="rank-ico" viewBox="0 0 32 36" role="img" aria-label="${escapeHtml(rank.name)}"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${tier.light}"/><stop offset="1" stop-color="${tier.dark}"/></linearGradient></defs><path d="${SHIELD_PATH}" fill="url(#${gid})" stroke="rgba(0,0,0,.4)" stroke-width=".8"/><path d="${SHIELD_PATH}" fill="none" stroke="${tier.light}" stroke-opacity=".5" stroke-width=".8" transform="translate(16 18) scale(.84) translate(-16 -18)"/>${RANK_CRESTS[tier.crest] || ''}${numeral}</svg>`;
  }

  function renderLadder(container, currentIndex) {
    if (!container) return;
    container.innerHTML = RANKS.map((rank, i) => `<span class="ladder-item ${i === currentIndex ? 'current' : ''}" style="--i:${i}" title="${escapeHtml(rank.name)}">${rankIcon(i)}</span>`).join('');
  }

  /* ============================================================
     CDN HELPERS for csstats images
     ============================================================ */
  const CDN = global.PlayerData ? global.PlayerData.CDN : 'https://static.csstats.gg/images';
  const weaponUrl = (file) => CDN + '/weapons/' + file;
  const mapUrl = (row) => {
    const folder = (row && row.folder) || 'maps/icons/cs2';
    return CDN + '/' + folder + '/' + row.icon;
  };

  /* ============================================================
     AVATAR CHAIN — Steam first → CSStats → local placeholder.
     Each candidate is tried as an <img src>; the first that loads
     wins. A dead external source only costs that attempt.
     ============================================================ */
  const PLACEHOLDER = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="#1a2338"/><circle cx="48" cy="37" r="16" fill="#3a4663"/><path d="M18 88c2-18 14-27 30-27s28 9 30 27z" fill="#3a4663"/><path d="M48 10a5 5 0 1 1 0 10 5 5 0 0 1 0-10z" fill="none"/></svg>'
  );

  const FALLBACK_AVATAR = { url: PLACEHOLDER, final: true };

  function wireAvatar(img, candidates) {
    if (!img) return;
    const list = (candidates || []).filter((u) => u && u.indexOf('http') === 0);
    if (!list.length) { img.src = PLACEHOLDER; img.classList.add('avatar-local'); return; }
    let i = 0;
    const tryNext = () => {
      if (i >= list.length) { img.src = PLACEHOLDER; img.classList.add('avatar-local'); return; }
      img.src = list[i++];
    };
    img.addEventListener('error', tryNext, { once: true });
    tryNext();
    img.classList.remove('avatar-local');
  }

  /* ============================================================
     PROFILE NAVIGATION (shared by search results everywhere)
     ============================================================ */
  function openProfile(profile) {
    if (!profile) return;
    if (profile.dossier) { global.location.href = 'arshi.html'; return; }
    const id = profile.steamid;
    global.location.href = id ? ('player.html?id=' + id) : 'index.html#search';
  }

  /* ============================================================
     UNIVERSAL SEARCH WIDGET — mount on any container pair.
     markup: <div class="search-widget"><input …/><div class="search-results" …></div></div>
     ============================================================ */
  function mountSearch(input, results, opts) {
    const options = opts || {};
    let open = false;
    let activeIndex = -1;
    let lastQuery = '';

    const close = () => { open = false; activeIndex = -1; results.classList.remove('open'); input.setAttribute('aria-expanded', 'false'); };
    const show = () => { open = true; results.classList.add('open'); input.setAttribute('aria-expanded', 'true'); };

    function render(items) {
      if (!items.length) {
        results.innerHTML = `<div class="search-empty"><b>NO MATCHES</b><span>Check the name, or paste a full Steam profile URL / 17-digit Steam ID.</span></div>`;
        show();
        return;
      }
      results.innerHTML = items.map((p, i) => {
        const avatar = p.avatarSteam || null;
        const tag = p.dossier ? 'DOSSIER' : p.hasStats ? 'TRACKED' : 'PROFILE';
        const idTail = p.steamid ? '…' + String(p.steamid).slice(-6) : '';
        return `<button type="button" class="search-hit" role="option" data-index="${i}" tabindex="-1">
          <img class="search-avatar" alt="" data-avatar="${escapeHtml(avatar || '')}" src="${escapeHtml(avatar || PLACEHOLDER)}"/>
          <span class="search-hit-copy"><b>${escapeHtml(p.name)}</b><small>${escapeHtml(idTail || 'STEAM ID')} · ${tag}${p.hasStats ? ' · SNAPSHOT' : ''}</small></span>
          <em>OPEN ↗</em>
        </button>`;
      }).join('');
      results.querySelectorAll('.search-hit').forEach((hit) => {
        on(hit, 'click', () => { close(); input.value = ''; options.onPick ? options.onPick(items[Number(hit.dataset.index)]) : openProfile(items[Number(hit.dataset.index)]); });
      });
      // wire avatars with the Steam-first fallback chain
      results.querySelectorAll('[data-avatar]').forEach((img) => {
        const url = img.getAttribute('data-avatar');
        if (!url) { img.src = PLACEHOLDER; return; }
        wireAvatar(img, [url]);
      });
      show();
    }

    function runSearch(q) {
      lastQuery = q;
      const results = global.PlayerData ? global.PlayerData.searchProfiles(q) : [];
      render(results);
    }

    on(input, 'input', () => {
      const q = input.value.trim();
      if (!q) { close(); results.innerHTML = ''; return; }
      clearTimeout(input.__t);
      input.__t = setTimeout(() => runSearch(q), 140);
    });

    on(input, 'keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault(); show();
        const items = results.querySelectorAll('.search-hit');
        if (items.length) { activeIndex = (activeIndex + 1) % items.length; items[activeIndex].focus(); }
      } else if (event.key === 'Escape') {
        close(); input.blur();
      } else if (event.key === 'Enter') {
        const items = results.querySelectorAll('.search-hit');
        if (items.length) { event.preventDefault(); items[0].click(); }
        else if (lastQuery) {
          // Let a raw Steam ID / URL through to the universal profile.
          const id = global.PlayerData ? global.PlayerData.parseSteamId(input.value) : null;
          if (id) { close(); global.location.href = 'player.html?id=' + id; }
        }
      }
    });

    document.addEventListener('click', (event) => {
      if (!input.contains(event.target) && !results.contains(event.target)) close();
    });

    if (input.value.trim()) runSearch(input.value.trim());
    return { close, runSearch };
  }

  /* ============================================================
     RANK ROW / LABEL FORMAT HELPERS
     ============================================================ */
  function rankLabel(index) {
    return (index === null || index === undefined) ? '—' : (RANKS[index] ? RANKS[index].name : String(index));
  }

  global.CSO = {
    $, $$, on, escapeHtml, qs, toast,
    THEMES, themeName, initTheme, initHandoff,
    animateNumber, initReveals, revealPage,
    RANKS, rankIcon, rankLabel, renderLadder,
    weaponUrl, mapUrl,
    PLACEHOLDER, wireAvatar, openProfile, mountSearch
  };

  /* boot the shared pieces */
  function boot() {
    initTheme();
    initHandoff();
    $$('a[href^="#"]').forEach((a) => {
      // smooth-scroll fallback for anchor links inside long pages
      on(a, 'click', (event) => {
        const target = $(a.getAttribute('href'));
        if (target) { event.preventDefault(); target.scrollIntoView({ behavior: global.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof window !== 'undefined' ? window : this);
