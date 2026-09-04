const weapons = [
  ['ak47_light.png', 'AK-47', 557, 311, '56%', '15%', '61,777'],
  ['m4a1_silencer_light.png', 'M4A1-S', 426, 202, '47%', '16%', '48,473'],
  ['usp_silencer_light.png', 'USP-S', 153, 99, '65%', '16%', '19,368'],
  ['famas_light.png', 'FAMAS', 93, 48, '52%', '17%', '10,599'],
  ['glock_light.png', 'Glock-18', 90, 48, '53%', '15%', '11,892'],
  ['m4a1_light.png', 'M4A4', 71, 36, '51%', '15%', '7,609'],
  ['awp_light.png', 'AWP', 65, 12, '18%', '29%', '6,047'],
  ['galilar_light.png', 'Galil AR', 39, 20, '51%', '15%', '4,769'],
  ['tec9_light.png', 'Tec-9', 31, 16, '52%', '15%', '3,693'],
  ['mp9_light.png', 'MP9', 25, 14, '56%', '11%', '3,967'],
];

const maps = [
  ['de_dust2_v2.png', 'Dust2', 84, '31%', '0.64', '60', '0.74', '62%'],
  ['de_mirage.png', 'Mirage', 34, '38%', '0.62', '61', '0.73', '62%'],
  ['de_inferno.png', 'Inferno', 24, '29%', '0.44', '47', '0.53', '56%'],
  ['de_nuke.png', 'Nuke', 14, '36%', '0.53', '51', '0.63', '62%'],
  ['de_ancient.png', 'Ancient', 6, '17%', '0.43', '37', '0.41', '52%'],
  ['de_train.png', 'Train', 4, '75%', '0.50', '53', '0.64', '64%'],
  ['de_vertigo_1.png', 'Vertigo', 4, '50%', '0.61', '50', '0.60', '53%'],
  ['de_cache.png', 'Cache', 4, '25%', '0.50', '59', '0.59', '55%'],
  ['de_overpass.png', 'Overpass', 2, '50%', '0.68', '53', '0.72', '60%'],
  ['cs_office.png', 'Office', 1, '100%', '0.42', '54', '0.65', '69%'],
];

const matches = [
  ['de_cache.png', 'CACHE', '2 : 13', 'L', '0.42', '10', '22', '4', '43'],
  ['de_overpass.png', 'OVERPASS', '4 : 13', 'L', '0.51', '12', '21', '3', '48'],
  ['de_dust2_v2.png', 'DUST II', '7 : 13', 'L', '0.65', '15', '19', '5', '57'],
  ['de_inferno.png', 'INFERNO', '7 : 13', 'L', '0.54', '14', '20', '6', '51'],
  ['de_mirage.png', 'MIRAGE', '4 : 13', 'L', '0.48', '12', '22', '4', '45'],
  ['de_ancient.png', 'ANCIENT', '12 : 12', 'D', '0.74', '22', '20', '7', '68'],
  ['de_mirage.png', 'MIRAGE', '13 : 4', 'W', '1.08', '24', '13', '8', '82'],
  ['de_cache.png', 'CACHE', '3 : 13', 'L', '0.44', '11', '21', '3', '41'],
  ['de_dust2_v2.png', 'DUST II', '9 : 13', 'L', '0.61', '18', '22', '4', '55'],
  ['de_nuke.png', 'NUKE', '12 : 6', 'W', '0.91', '21', '16', '8', '77'],
];

const staticUrl = 'https://static.csstats.gg/images';
const imageUrl = (folder, file) => `${staticUrl}/${folder}/${file}`;

/* ============================================================
   CS2 RANK SYSTEM — inline SVG emblems + rank ladder
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
  { name: 'The Global Elite', num: '', tier: 'global' },
];

const RANK_TIERS = {
  silver:  { light: '#d9dde2', dark: '#7f8891', crest: '' },
  nova:    { light: '#f4d97e', dark: '#a9811f', crest: 'star4' },
  mg:      { light: '#70e0b0', dark: '#1c8a5e', crest: 'wings' },
  mge:     { light: '#70e0b0', dark: '#1c8a5e', crest: 'wings-star' },
  dmg:     { light: '#84bafb', dark: '#2a6fc2', crest: 'star5' },
  eagle:   { light: '#c29efb', dark: '#6136c9', crest: 'eagle' },
  lem:     { light: '#e39cfb', dark: '#8f35c4', crest: 'eagle' },
  supreme: { light: '#ff8ba0', dark: '#ab2c48', crest: 'laurel' },
  global:  { light: '#ffe57a', dark: '#c1931f', crest: 'globe' },
};

const SHIELD_PATH = 'M16 1.5 L28.5 5.6 V16.3 C28.5 24.9 23.4 30.9 16 34.2 C8.6 30.9 3.5 24.9 3.5 16.3 V5.6 Z';

const RANK_CRESTS = {
  star4: '<path d="M16 6.6 L17.9 10 L21.3 11.9 L17.9 13.8 L16 17.2 L14.1 13.8 L10.7 11.9 L14.1 10 Z" fill="#fff" opacity=".92"/>',
  star5: '<path d="M16 6.4 L18.1 10.1 L22.2 10.6 L19.3 13.4 L19.9 17.5 L16 15.6 L12.1 17.5 L12.7 13.4 L9.8 10.6 L13.9 10.1 Z" fill="#fff" opacity=".92"/>',
  wings: '<path d="M5.2 12.4 L12.4 9.6 L12.4 11.9 L7.4 13.7 Z" fill="#fff" opacity=".85"/><path d="M26.8 12.4 L19.6 9.6 L19.6 11.9 L24.6 13.7 Z" fill="#fff" opacity=".85"/>',
  'wings-star': '<path d="M5.2 13.4 L12.4 10.6 L12.4 12.9 L7.4 14.7 Z" fill="#fff" opacity=".85"/><path d="M26.8 13.4 L19.6 10.6 L19.6 12.9 L24.6 14.7 Z" fill="#fff" opacity=".85"/><path d="M16 7.2 L17.5 10 L20.6 10.4 L18.5 12.5 L19 15.6 L16 14 L13 15.6 L13.5 12.5 L11.4 10.4 L14.5 10 Z" fill="#fff" opacity=".95"/>',
  eagle: '<path d="M16 11.2 L19 14.6 L16 13.2 L13 14.6 Z" fill="#fff" opacity=".95"/><path d="M13 14.6 L8.2 10.8 L11.8 15.2 Z" fill="#fff" opacity=".85"/><path d="M19 14.6 L23.8 10.8 L20.2 15.2 Z" fill="#fff" opacity=".85"/><circle cx="16" cy="9.7" r="1.2" fill="#fff"/>',
  laurel: '<circle cx="16" cy="11.6" r="4.3" fill="none" stroke="#fff" stroke-width=".95" stroke-dasharray="2.6 1.5" opacity=".9"/><path d="M16 8.3 L17.3 10.7 L19.9 11.1 L18.1 12.9 L18.6 15.6 L16 14.3 L13.4 15.6 L13.9 12.9 L12.1 11.1 L14.7 10.7 Z" fill="#fff" opacity=".95"/>',
  globe: '<circle cx="16" cy="11.4" r="4.5" fill="#fff" opacity=".95"/><ellipse cx="16" cy="11.4" rx="4.5" ry="1.75" fill="none" stroke="#7a5d0e" stroke-width=".75" opacity=".85"/><path d="M16 6.9 V15.9" stroke="#7a5d0e" stroke-width=".75" opacity=".85"/>',
};

function rankIcon(index) {
  const rank = RANKS[index];
  const tier = RANK_TIERS[rank.tier];
  const gid = `rank-grad-${index}`;
  const numeral = rank.num ? `<text x="16" y="26.6" text-anchor="middle" font-family="Barlow Condensed, Arial, sans-serif" font-size="9" font-weight="800" fill="#fff" opacity=".96">${rank.num}</text>` : '';
  return `<svg class="rank-ico" viewBox="0 0 32 36" role="img" aria-label="${rank.name}"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${tier.light}"/><stop offset="1" stop-color="${tier.dark}"/></linearGradient></defs><path d="${SHIELD_PATH}" fill="url(#${gid})" stroke="rgba(0,0,0,.4)" stroke-width=".8"/><path d="${SHIELD_PATH}" fill="none" stroke="${tier.light}" stroke-opacity=".5" stroke-width=".8" transform="translate(16 18) scale(.84) translate(-16 -18)"/>${RANK_CRESTS[tier.crest] || ''}${numeral}</svg>`;
}

function renderRankSystem() {
  const currentRank = 0; // Silver I — the dossier's placement
  const symbol = document.querySelector('#rank-symbol-icon');
  const ladder = document.querySelector('#rank-ladder');
  if (symbol) symbol.innerHTML = rankIcon(currentRank);
  if (ladder) {
    ladder.innerHTML = RANKS.map((rank, i) => `<span class="ladder-item ${i === currentRank ? 'current' : ''}" style="--i:${i}" title="${rank.name}">${rankIcon(i)}</span>`).join('');
  }
}

function renderWeapons() {
  const root = document.querySelector('#weapon-table');
  root.innerHTML = `<div class="data-row header weapon-data" style="--i:0"><span></span><span>WEAPON</span><span>KILLS</span><span>HEADSHOTS</span><span>HS%</span><span>ACCURACY</span><span>DAMAGE</span></div>${weapons.map(([file, name, kills, hs, hsRate, accuracy, damage], i) => `<div class="data-row weapon-data" style="--i:${i + 1}"><img src="${imageUrl('weapons', file)}" alt="${name}"/><strong>${name}</strong><b>${kills}</b><span>${hs}</span><em>${hsRate}</em><span>${accuracy}</span><span>${damage}</span></div>`).join('')}`;
}

function renderMaps() {
  const root = document.querySelector('#map-table');
  root.innerHTML = `<div class="data-row header map-data" style="--i:0"><span>MAP</span><span>GAMES</span><span>WIN RATE</span><span>K/D</span><span>ADR</span><span>RATING</span><span>KAST</span></div>${maps.map(([file, name, games, winRate, kd, adr, rating, kast], i) => `<div class="data-row map-data" style="--i:${i + 1}"><strong><img src="${imageUrl('maps/icons/cs2', file)}" alt="${name}"/> ${name}</strong><b>${games}</b><em>${winRate}</em><span>${kd}</span><span>${adr}</span><span>${rating}</span><span>${kast}</span></div>`).join('')}`;
}

function renderMatches() {
  const root = document.querySelector('#matches-table');
  root.innerHTML = `<div class="data-row header match-data" style="--i:0"><span>MAP</span><span>SCORE</span><span>RESULT</span><span>RATING</span><span>K</span><span>D</span><span>A</span><span>ADR</span></div>${matches.map(([file, name, score, result, rating, kills, deaths, assists, adr], i) => `<div class="data-row match-data ${result === 'L' ? 'loss' : ''}" style="--i:${i + 1}"><strong><img src="${imageUrl(file === 'de_dust2_v2.png' || file === 'de_ancient.png' ? 'maps/icons' : 'maps/icons/cs2', file)}" alt="${name}"/> ${name}</strong><span>${score}</span><span class="result">${result === 'D' ? 'TIE' : result === 'W' ? 'WIN' : 'LOSS'}</span><span>${rating}</span><b>${kills}</b><span>${deaths}</span><span>${assists}</span><span>${adr}</span></div>`).join('')}`;
}

/* ============================================================
   THEME SYSTEM
   ============================================================ */
const THEMES = {
  midnight: { label: 'MIDNIGHT', a: '#f07aa5', b: '#8eddd5', meta: '#080d1b' },
  daybreak: { label: 'DAYBREAK', a: '#d64545', b: '#0e7a72', meta: '#f4efe6' },
  synthwave: { label: 'SYNTHWAVE', a: '#ff3ecf', b: '#21e6ff', meta: '#0d0416' },
  forest: { label: 'FOREST', a: '#e8914f', b: '#7fd8a4', meta: '#0a130d' },
  terminal: { label: 'TERMINAL', a: '#ffb64d', b: '#cfe3a8', meta: '#0b0a07' },
};
const VALID_THEMES = Object.keys(THEMES);

const themeToggle = document.querySelector('#theme-toggle');
const themeMenu = document.querySelector('#theme-menu');
const themeLabel = document.querySelector('#theme-toggle-label');
const themeSwatch = themeToggle.querySelector('.theme-swatch');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const themeItems = [...themeMenu.querySelectorAll('[data-theme]')];

function applyTheme(name, persist = false) {
  const t = THEMES[name] || THEMES.midnight;
  document.documentElement.setAttribute('data-theme', name);
  themeLabel.textContent = t.label;
  themeSwatch.style.setProperty('--a', t.a);
  themeSwatch.style.setProperty('--b', t.b);
  themeMeta.setAttribute('content', t.meta);
  themeItems.forEach((item) => item.classList.toggle('active', item.dataset.theme === name));
  if (persist) {
    try { localStorage.setItem('arshi-theme', name); } catch (e) { /* storage unavailable */ }
  }
}

function openThemeMenu(open) {
  themeMenu.classList.toggle('open', open);
  themeToggle.setAttribute('aria-expanded', String(open));
}

themeToggle.addEventListener('click', (event) => {
  event.stopPropagation();
  openThemeMenu(!themeMenu.classList.contains('open'));
});
themeMenu.addEventListener('click', (event) => {
  const item = event.target.closest('[data-theme]');
  if (!item) return;
  applyTheme(item.dataset.theme, true);
  openThemeMenu(false);
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.theme-switch')) openThemeMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') openThemeMenu(false);
});

let storedTheme = null;
try { storedTheme = localStorage.getItem('arshi-theme'); } catch (e) { /* ignore */ }
applyTheme(VALID_THEMES.includes(storedTheme) ? storedTheme : 'midnight');

/* ============================================================
   COUNT-UP NUMBERS
   ============================================================ */
function animateNumber(el) {
  const small = el.querySelector('small');
  const node = small ? el.firstChild : el;
  const raw = node.textContent.trim();
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

/* ============================================================
   SCROLL REVEALS (IntersectionObserver)
   ============================================================ */
let revealObserver = null;

function initReveals() {
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('in-view');
      revealObserver.unobserve(el);
      if (el.classList.contains('metric-card')) {
        const strong = el.querySelector(':scope > strong');
        if (strong) animateNumber(strong);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.panel, .notice-bar, .command-strip, .data-row').forEach((el) => revealObserver.observe(el));
}

/* ============================================================
   SKELETON → DASHBOARD HANDSHAKE
   ============================================================ */
const skeleton = document.querySelector('#skeleton');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function revealDashboard() {
  document.body.classList.add('is-loaded');
  if (skeleton) {
    skeleton.classList.add('hide');
    setTimeout(() => skeleton.remove(), 600);
  }
  setTimeout(() => { requestAnimationFrame(initReveals); }, 260);
}

if (reducedMotion) {
  document.body.classList.add('is-loaded');
  if (skeleton) skeleton.remove();
} else {
  setTimeout(revealDashboard, 950);
}

/* ============================================================
   VIEW SWITCHING + INTERACTIONS
   ============================================================ */
function selectView(viewName) {
  document.querySelectorAll('.tab').forEach((tab) => {
    const isActive = tab.dataset.view === viewName;
    tab.classList.toggle('active', isActive);
    if (isActive) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.dataset.panel === viewName));
  const labels = { overview: 'ALL TIME // 183 GAMES', weapons: 'ALL WEAPONS // 2,111 KILLS', maps: 'ALL MAPS // 13 TRACKED', matches: 'RECENT // 10 GAMES' };
  document.querySelector('#view-label').textContent = labels[viewName];
  window.history.replaceState(null, '', `#${viewName}`);
}

document.querySelector('#tabs').addEventListener('click', (event) => {
  const tab = event.target.closest('.tab');
  if (tab) selectView(tab.dataset.view);
});

document.querySelectorAll('[data-view-target]').forEach((button) => button.addEventListener('click', () => selectView(button.dataset.viewTarget)));

document.querySelector('#filter-button').addEventListener('click', (event) => {
  const filters = ['FILTER: ALL ▾', 'FILTER: VALVE ▾', 'FILTER: FACEIT ▾'];
  const next = (filters.indexOf(event.currentTarget.textContent) + 1) % filters.length;
  event.currentTarget.textContent = filters[next];
});

document.querySelector('#refresh-button').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const toast = document.querySelector('#toast');
  button.classList.add('is-refreshing');
  button.disabled = true;
  document.querySelector('#last-sync').textContent = 'SYNCING...';
  setTimeout(() => {
    button.classList.remove('is-refreshing');
    button.disabled = false;
    document.querySelector('#last-sync').textContent = 'SYNCED JUST NOW';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2300);
  }, 700);
});

renderWeapons();
renderMaps();
renderMatches();
renderRankSystem();
const initialView = window.location.hash.replace('#', '');
if (['overview', 'weapons', 'maps', 'matches'].includes(initialView)) selectView(initialView);