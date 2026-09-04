/* ============================================================
   ARSHI DOSSIER — dedicated page driver.
   ------------------------------------------------------------
   Data:    Arshi's snapshot lives in data/players.js (single
            source of truth — compare/profile/widgets reuse it).
   Shared:  theme, handoff, reveals, rank SVGs and toasts come
            from js/common.js. This file only drives the
            dashboard's tables, tabs, filters and refresh state.
   ============================================================ */
(function () {
  'use strict';
  const PD = window.PlayerData;
  const CSO = window.CSO;
  const ARSHI_ID = '76561199524171843';
  const snap = PD.SNAPSHOTS[ARSHI_ID];

  const weapons = snap.weapons.map((w) => [w.icon, w.name, w.kills, w.hs, w.hsRate, w.acc, w.damage]);
  const maps = snap.maps.map((m) => [m.icon, m.name, m.games, m.wr, m.kd, m.adr, m.rating, m.kast]);
  const matches = snap.matches.map((g) => [g.icon, g.name, g.score, g.result, g.rating, g.k, g.d, g.a, g.adr]);

  const $ = (sel) => document.querySelector(sel);
  const staticUrl = 'https://static.csstats.gg/images';
  const imageUrl = (folder, file) => `${staticUrl}/${folder}/${file}`;

  function renderWeapons() {
    const root = $('#weapon-table');
    if (!root) return;
    root.innerHTML = `<div class="data-row header weapon-data" style="--i:0"><span></span><span>WEAPON</span><span>KILLS</span><span>HEADSHOTS</span><span>HS%</span><span>ACCURACY</span><span>DAMAGE</span></div>${weapons.map(([file, name, kills, hs, hsRate, accuracy, damage], i) => `<div class="data-row weapon-data" style="--i:${i + 1}"><img src="${imageUrl('weapons', file)}" alt="${name}"/><strong>${name}</strong><b>${kills}</b><span>${hs}</span><em>${hsRate}</em><span>${accuracy}</span><span>${damage}</span></div>`).join('')}`;
  }

  function mapIcon(row) {
    const folder = (row[0] === 'de_dust2_v2.png' || row[0] === 'de_ancient.png') ? 'maps/icons' : 'maps/icons/cs2';
    return imageUrl(folder, row[0]);
  }

  function renderMaps() {
    const root = $('#map-table');
    if (!root) return;
    root.innerHTML = `<div class="data-row header map-data" style="--i:0"><span>MAP</span><span>GAMES</span><span>WIN RATE</span><span>K/D</span><span>ADR</span><span>RATING</span><span>KAST</span></div>${maps.map(([file, name, games, winRate, kd, adr, rating, kast], i) => `<div class="data-row map-data" style="--i:${i + 1}"><strong><img src="${mapIcon([file])}" alt="${name}"/> ${name}</strong><b>${games}</b><em>${winRate}</em><span>${kd}</span><span>${adr}</span><span>${rating}</span><span>${kast}</span></div>`).join('')}`;
  }

  function renderMatches() {
    const root = $('#matches-table');
    if (!root) return;
    root.innerHTML = `<div class="data-row header match-data" style="--i:0"><span>MAP</span><span>SCORE</span><span>RESULT</span><span>RATING</span><span>K</span><span>D</span><span>A</span><span>ADR</span></div>${matches.map(([file, name, score, result, rating, kills, deaths, assists, adr], i) => `<div class="data-row match-data ${result === 'L' ? 'loss' : ''}" style="--i:${i + 1}"><strong><img src="${mapIcon([file])}" alt="${name}"/> ${name}</strong><span>${score}</span><span class="result">${result === 'D' ? 'TIE' : result === 'W' ? 'WIN' : 'LOSS'}</span><span>${rating}</span><b>${kills}</b><span>${deaths}</span><span>${assists}</span><span>${adr}</span></div>`).join('')}`;
  }

  function renderRankSystem() {
    const currentRank = 0; // Silver I — the dossier's placement
    const symbol = $('#rank-symbol-icon');
    const ladder = $('#rank-ladder');
    if (symbol) symbol.innerHTML = CSO.rankIcon(currentRank);
    if (ladder) CSO.renderLadder(ladder, currentRank);
  }

  // Steam-first avatar chain (steam CDN -> csstats asset -> local placeholder)
  function wirePortrait() {
    const img = $('#portrait-main');
    if (!img || !PD) return;
    const profile = snap.profile;
    const candidates = PD.avatarCandidates(profile);
    if (!candidates.length) candidates.push(profile.avatarCs || CSO.PLACEHOLDER);
    CSO.wireAvatar(img, candidates);
  }

  /* ---- views + interactions -------------------------------- */
  function selectView(viewName) {
    document.querySelectorAll('.tab').forEach((tab) => {
      const isActive = tab.dataset.view === viewName;
      tab.classList.toggle('active', isActive);
      if (isActive) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
    document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.dataset.panel === viewName));
    const labels = { overview: 'ALL TIME // 183 GAMES', weapons: 'ALL WEAPONS // 2,111 KILLS', maps: 'ALL MAPS // 13 TRACKED', matches: 'RECENT // 10 GAMES' };
    const labelEl = $('#view-label');
    if (labelEl) labelEl.textContent = labels[viewName];
    window.history.replaceState(null, '', `#${viewName}`);
  }

  const tabs = $('#tabs');
  if (tabs) {
    tabs.addEventListener('click', (event) => {
      const tab = event.target.closest('.tab');
      if (tab) selectView(tab.dataset.view);
    });
  }
  document.querySelectorAll('[data-view-target]').forEach((button) => button.addEventListener('click', () => selectView(button.dataset.viewTarget)));

  const filterBtn = $('#filter-button');
  if (filterBtn) {
    filterBtn.addEventListener('click', (event) => {
      const filters = ['FILTER: ALL ▾', 'FILTER: VALVE ▾', 'FILTER: FACEIT ▾'];
      const next = (filters.indexOf(event.currentTarget.textContent) + 1) % filters.length;
      event.currentTarget.textContent = filters[next];
    });
  }

  const refreshBtn = $('#refresh-button');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', (event) => {
      const button = event.currentTarget;
      button.classList.add('is-refreshing');
      button.disabled = true;
      const sync = $('#last-sync');
      if (sync) sync.textContent = 'SYNCING...';
      setTimeout(() => {
        button.classList.remove('is-refreshing');
        button.disabled = false;
        if (sync) sync.textContent = 'SYNCED JUST NOW';
        CSO.toast('Snapshot refreshed');
      }, 700);
    });
  }

  renderWeapons();
  renderMaps();
  renderMatches();
  renderRankSystem();
  wirePortrait();

  const initialView = window.location.hash.replace('#', '');
  if (['overview', 'weapons', 'maps', 'matches'].includes(initialView)) selectView(initialView);
})();
