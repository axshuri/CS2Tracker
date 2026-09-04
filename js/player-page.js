/* ============================================================
   UNIVERSAL PLAYER PAGE — renders player.html?id=…
   Full dossier when opened directly; a compact single-widget
   view when opened as an embed (player.html?id=…&embed=profile
   or &embed=stats). Everything is data-driven from PlayerData —
   no player-specific code paths.
   ============================================================ */
(function () {
  'use strict';
  const PD = window.PlayerData;
  const CSO = window.CSO;
  const esc = CSO.escapeHtml;

  const byId = (id) => document.getElementById(id);
  const fmtInt = (n) => (n == null ? '—' : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  const fmtPct = (n) => (n == null ? '—' : n + '%');
  const ACCENTS = ['accent-pink', 'accent-cyan', 'accent-yellow', 'accent-violet'];
  let booted = false;

  async function boot() {
    if (booted) return;
    booted = true;
    const id = CSO.qs('id');
    const embed = CSO.qs('embed');
    const theme = CSO.qs('theme');
    if (theme && CSO.THEMES[theme]) document.documentElement.setAttribute('data-theme', theme);
    if (embed) document.body.setAttribute('data-embed', embed);

    const navInput = byId('nav-search');
    const navResults = byId('nav-search-results');
    if (navInput && navResults && !document.body.hasAttribute('data-embed')) {
      CSO.mountSearch(navInput, navResults, { onPick: CSO.openProfile });
    }

    const root = byId('player-root');
    const stage = byId('load-stage');

    if (!id) {
      root.hidden = false;
      root.innerHTML = renderNoId();
      if (stage) stage.hidden = true;
      return;
    }

    const { profile, snapshot, source, known } = await PD.loadProfile(id);
    if (stage) stage.hidden = true;
    root.hidden = false;
    const sourceEl = byId('profile-source');
    if (sourceEl) sourceEl.textContent = !known ? 'UNKNOWN ID' : source === 'live' ? 'LIVE · CSSTATS' : 'LOCAL SNAPSHOT';

    if (!known) {
      root.innerHTML = renderUnknown(id);
      return;
    }

    if (embed) {
      document.title = (profile.name || id) + ' · widget';
      root.innerHTML = embed === 'profile' ? renderEmbedProfile(profile, snapshot, source) : renderEmbedStats(profile, snapshot, source);
      wireRootAvatars(root);
      return;
    }

    document.title = profile.name + ' // PLAYER PROFILE';
    root.innerHTML = renderFull(profile, snapshot, source, id);
    mountFullInteractions(root, profile, snapshot, id);
    wireRootAvatars(root);
    // re-run reveals for the freshly injected panels
    requestAnimationFrame(() => CSO.initReveals());
  }

  /* ------------------------------------------------------------
     FULL DOSSIER VIEW
     ------------------------------------------------------------ */
  function renderFull(profile, snap, source, id) {
    const hero = heroMarkup(profile, snap, source, id);
    const stats = kpiMarkup(snap);
    const notice = noticeMarkup(profile, snap);
    const detail = snap ? detailMarkup(profile, snap) : '';
    return `<div class="profile-head-row">${hero}${rankMarkup(profile, snap)}</div>${notice}${stats}${detail}`;
  }

  function sourceChip(source) {
    if (source === 'live') return '<span class="source-chip live">LIVE · CSSTATS</span>';
    return '<span class="source-chip snapshot">LOCAL SNAPSHOT</span>';
  }

  function heroMarkup(profile, snap, source, id) {
    const avatarCandidates = CSO.PLAYER_AVATARS ? CSO.PLAYER_AVATARS(profile) : PD.avatarCandidates(profile);
    const first = avatarCandidates[0] || CSO.PLACEHOLDER;
    const tags = (profile.tags && profile.tags.length ? profile.tags : ['VALVE']).slice(0, 3);
    const dossier = profile.dossier ? '<a class="hero-cta primary" href="arshi.html">FULL DOSSIER ↗</a>' : '';
    return `<article class="uprofile-hero panel">
      <div class="profile-orbit orbit-one"></div>
      <div class="profile-orbit orbit-two"></div>
      <div class="portrait-wrap uprofile-avatar">
        <div class="portrait-ring"></div>
        <img class="portrait" id="profile-avatar" alt="Steam avatar of ${esc(profile.name)}" src="${esc(first)}" data-candidates="${esc(avatarCandidates.join('|'))}" />
        <span class="online-dot" title="Profile resolved"></span>
      </div>
      <div class="profile-copy uprofile-copy">
        <p class="eyebrow">PLAYER PROFILE <span>// ${esc(String(id || profile.steamid).slice(-4))}</span></p>
        <h1 class="uprofile-name">${esc(profile.name)}</h1>
        <div class="uprofile-links">
          <a class="steam-link" href="${esc(profile.steamUrl)}" target="_blank" rel="noreferrer">STEAM ID ${esc(profile.steamid)} <span>↗</span></a>
          <a class="steam-link cs" href="${esc(profile.csstatsUrl)}" target="_blank" rel="noreferrer">CSSTATS PAGE <span>↗</span></a>
        </div>
        <div class="profile-tags">${tags.map((t) => '<span>' + esc(t) + '</span>').join('')}${sourceChip(source)}</div>
      </div>
      <div class="uprofile-actions">
        ${dossier}
        <a class="hero-cta" href="compare.html?a=${esc(id || profile.steamid)}&b=">COMPARE ↗</a>
        <a class="hero-cta" href="widgets.html?player=${esc(id)}">EMBED CODE ↗</a>
      </div>
      <div class="profile-stamp"><span>CS2</span><b>TRACK</b></div>
    </article>`;
  }

  function rankMarkup(profile, snap) {
    const comp = profile.comp || {};
    const premier = profile.premier;
    const rows = [];

    if (typeof comp.currentRank === 'number') {
      rows.push(`<div class="rank-big">${CSO.rankIcon(comp.currentRank)}<div class="rank-big-copy"><b>${esc(CSO.rankLabel(comp.currentRank))}</b><span>Current placement${comp.games ? ' · ' + esc(fmtInt(comp.games)) + ' games' : ''}</span></div></div>`);
      rows.push(`<div class="rank-ladder-wrap"><div class="ladder-label"><span>RANK LADDER</span><b>${esc(CSO.rankLabel(comp.currentRank))}</b></div><div class="ladder-row" id="rank-ladder"></div></div>`);
    } else {
      rows.push(`<div class="rank-big"><div class="rank-unknown">?</div><div class="rank-big-copy"><b>RANK UNKNOWN</b><span>No rank emblem in this snapshot${comp.games ? ' · ' + esc(fmtInt(comp.games)) + ' competitive games tracked' : ''}</span></div></div>`);
    }
    if (premier) {
      rows.push(`<div class="rank-meta-row"><span>${esc(premier.season)}</span><b>${esc(premier.wins || 0)} WINS</b><span>CURRENT ${esc(premier.current != null ? fmtInt(premier.current) : '—')}</span><span>BEST ${esc(premier.best != null ? fmtInt(premier.best) : '—')}</span></div>`);
    }
    rows.push(`<div class="rank-footer"><span><i class="pulse"></i> ${esc((profile.tracking || 'OFF').toUpperCase())} TRACKING</span><span>LAST ACTIVE ${esc(profile.lastActive || '—')}</span></div>`);

    return `<article class="uprofile-rank panel">
      <div class="panel-heading"><span>RANK // COMPETITIVE</span><span class="season-chip">${esc(profile.comp && profile.comp.lastActive ? 'ACTIVE ' + profile.comp.lastActive : 'SEASON 5')}</span></div>
      ${rows.join('')}
    </article>`;
  }

  function noticeMarkup(profile, snap) {
    if (profile.tracking === 'inactive') {
      return `<div class="notice-bar"><span class="notice-icon">!</span><p><b>TRACKING INACTIVE.</b> This profile mirrors the CSStats page — a Valve match in the last 30 days is required to reactivate live tracking on CSStats' side.</p><a href="https://csstats.gg/getting-the-sharecode" target="_blank" rel="noreferrer">ADD MATCH ↗</a></div>`;
    }
    return `<div class="notice-bar"><span class="notice-icon">i</span><p><b>TRACKING NOT ENABLED.</b> ${esc(profile.name)} has not claimed this profile on CSStats, so stats may lag or stay partial.</p><a href="${esc(profile.csstatsUrl)}" target="_blank" rel="noreferrer">VIEW SOURCE ↗</a></div>`;
  }

  function kpiMarkup(snap) {
    const r = snap.rates || {};
    const t = snap.totals || {};
    const cards = [
      { label: 'K/D RATIO', glyph: '⌁', value: r.kd, dec: 2, accent: 0, foot: 'deaths ' + fmtInt(t.deaths), sub: 'survival index' },
      { label: 'HLTV RATING', glyph: '◈', value: r.rating, dec: 2, accent: 1, foot: fmtInt(t.kills) + ' kills', sub: 'impact index' },
      { label: 'WIN RATE', glyph: '◒', value: r.winRate, pct: true, accent: 2, foot: fmtInt(t.won) + ' WINS', sub: fmtInt(t.lost) + ' losses · ' + fmtInt(t.tied) + ' ties' },
      { label: 'HEADSHOT RATE', glyph: '✧', value: r.hs, pct: true, accent: 3, foot: fmtInt(t.headshots) + ' HS', sub: 'of ' + fmtInt(t.kills) + ' kills' }
    ];
    return `<section class="metric-grid uprofile-metrics">${cards.map((c) => {
      const val = c.value == null ? '—' : (c.pct ? Math.round(c.value) + '<small>%</small>' : Number(c.value).toFixed(c.dec || 0));
      return `<article class="metric-card panel ${ACCENTS[c.accent]}"><div class="metric-top"><span>${c.label}</span><span class="metric-glyph">${c.glyph}</span></div><strong>${val}</strong><div class="metric-bottom"><span class="delta">${esc(c.foot)}</span><span>${esc(c.sub)}</span></div></article>`;
    }).join('')}</section>`;
  }

  function detailMarkup(profile, snap) {
    const t = snap.totals || {};
    const clutch = snap.clutch;
    const entry = snap.entry;
    const hasClutch = clutch && Array.isArray(clutch.rows) && clutch.rows.length;

    const signals = [
      ['Games played', fmtInt(t.played), t.played != null],
      ['Rounds played', fmtInt(t.rounds), t.rounds != null],
      ['Damage dealt', fmtInt(t.damage), t.damage != null],
      ['Assists', fmtInt(t.assists), t.assists != null]
    ].filter((s) => s[2]);

    const signalRows = signals.map((s) => `<div><span>${s[0]}</span><b>${s[1]}</b></div>`).join('');

    const clutchRows = hasClutch
      ? '<div class="signal-list">' + clutch.rows.map((r) => `<div><span>${esc(r.label)} · ${fmtInt(r.w)}W / ${fmtInt(r.l)}L</span><b>${fmtPct(r.rate)}</b></div>`).join('') + '</div>'
      : '<div class="signal-list"><div><span>Clutch data</span><b>—</b></div></div>';

    const weapons = snap.weapons || [];
    const maps = snap.maps || [];
    const matches = snap.matches || [];

    return `<div class="content-grid uprofile-detail">
      <article class="chart-card panel">
        <div class="card-heading"><div><p class="eyebrow">SESSION SIGNALS</p><h2>Account snapshot</h2></div><span class="radar-icon">◎</span></div>
        <div class="signal-list uprofile-signals">${signalRows}</div>
        <div class="mini-radar uprofile-radar"><span class="radar-label r1">K/D ${(snap.rates && snap.rates.kd != null) ? snap.rates.kd.toFixed(2) : '—'}</span><div class="radar-shape"></div></div>
      </article>
      <article class="quick-card panel">
        <div class="card-heading"><div><p class="eyebrow">DECISIVE MOMENTS</p><h2>Clutch × entry</h2></div><span class="radar-icon">⚔</span></div>
        <div class="signal-list uprofile-signals">
          <div><span>Clutch success (1vX)</span><b>${fmtPct(clutch ? clutch.rate : null)}</b></div>
          <div><span>Entry success / round</span><b>${entry && entry.perRound != null ? fmtPct(entry.perRound) : '—'}</b></div>
          <div><span>Entry success (T / CT)</span><b>${entry ? fmtPct(entry.t) + ' / ' + fmtPct(entry.ct) : '—'}</b></div>
          <div><span>KAST</span><b>${fmtPct(snap.rates ? snap.rates.kast : null)}</b></div>
        </div>
        <div class="uprofile-clutch">${clutchRows}</div>
      </article>
    </div>
    <section class="table-card panel uprofile-tables">
      <div class="card-heading"><div><p class="eyebrow">ARMORY</p><h2>Weapon signature</h2></div><span class="table-note">${weapons.length ? 'TOP ' + weapons.length + ' BY KILLS' : 'NO DATA'}</span></div>
      <div class="weapon-table" id="uprofile-weapons">${weapons.length ? weaponsRows(weapons) : emptyRow('No weapon data in this snapshot.')}</div>
    </section>
    <section class="table-card panel uprofile-tables">
      <div class="card-heading"><div><p class="eyebrow">TERRITORY</p><h2>Map report</h2></div><span class="table-note">${maps.length + ' MAPS TRACKED'}</span></div>
      <div class="map-table" id="uprofile-maps">${maps.length ? mapsRows(maps) : emptyRow('No map data in this snapshot.')}</div>
    </section>
    ${matches.length ? `<section class="table-card panel uprofile-tables">
      <div class="card-heading"><div><p class="eyebrow">RECENT ENCOUNTERS</p><h2>Last games</h2></div><span class="table-note">${matches.length} GAMES</span></div>
      <div class="matches-table" id="uprofile-matches">${matchesRows(matches)}</div>
    </section>` : ''}`;
  }

  function weaponsRows(list) {
    const head = '<div class="data-row header weapon-data"><span></span><span>WEAPON</span><span>KILLS</span><span>HEADSHOTS</span><span>HS%</span><span>ACCURACY</span><span>DAMAGE</span></div>';
    const body = list.map((w, i) => `<div class="data-row weapon-data" style="--i:${i + 1}"><img src="${CSO.weaponUrl(w.icon)}" alt="${esc(w.name)}" loading="lazy"/><strong>${esc(w.name)}</strong><b>${fmtInt(w.kills)}</b><span>${fmtInt(w.hs)}</span><em>${esc(w.hsRate)}</em><span>${esc(w.acc)}</span><span>${esc(w.damage)}</span></div>`).join('');
    return head + body;
  }

  function mapsRows(list) {
    const head = '<div class="data-row header map-data"><span>MAP</span><span>GAMES</span><span>WIN RATE</span><span>K/D</span><span>ADR</span><span>RATING</span><span>KAST</span></div>';
    const body = list.map((m, i) => `<div class="data-row map-data" style="--i:${i + 1}"><strong><img src="${CSO.mapUrl(m)}" alt="${esc(m.name)}" loading="lazy"/> ${esc(m.name)}</strong><b>${fmtInt(m.games)}</b><em>${esc(m.wr)}</em><span>${esc(m.kd)}</span><span>${esc(m.adr)}</span><span>${esc(m.rating)}</span><span>${esc(m.kast)}</span></div>`).join('');
    return head + body;
  }

  function matchesRows(list) {
    const head = '<div class="data-row header match-data"><span>MAP</span><span>SCORE</span><span>RESULT</span><span>RATING</span><span>K</span><span>D</span><span>A</span><span>ADR</span></div>';
    const body = list.map((g, i) => `<div class="data-row match-data ${g.result === 'L' ? 'loss' : ''}" style="--i:${i + 1}"><strong><img src="${CSO.mapUrl(g)}" alt="${esc(g.name)}" loading="lazy"/> ${esc(g.name)}</strong><span>${esc(g.score)}</span><span class="result">${g.result === 'D' ? 'TIE' : g.result === 'W' ? 'WIN' : 'LOSS'}</span><span>${esc(g.rating)}</span><b>${esc(g.k)}</b><span>${esc(g.d)}</span><span>${esc(g.a)}</span><span>${esc(g.adr)}</span></div>`).join('');
    return head + body;
  }

  function emptyRow(message) {
    return `<div class="data-row" style="grid-template-columns:1fr;color:var(--muted)">${esc(message)}</div>`;
  }

  function renderNoId() {
    return `<article class="empty-state panel"><p class="eyebrow">UNIVERSAL PLAYER PROFILE</p><h2>No player selected</h2><p>Open a profile from search, or load one directly:<br/><code>player.html?id=STEAM_ID_64</code></p><a class="text-button" href="index.html#search">GO TO UNIVERSAL SEARCH ↗</a></article>`;
  }

  function renderUnknown(id) {
    return `<article class="empty-state panel">
      <p class="eyebrow">UNIVERSAL PLAYER PROFILE</p>
      <h2>${esc(id)} is not in the registry</h2>
      <p>A live CSStats lookup was attempted and the local snapshot store has no record for this Steam ID. If the player is tracked on CSStats, add their numbers to <code>data/players.js</code> — search, profiles, compare and widgets will pick them up immediately.</p>
      <div class="empty-actions">
        <a class="hero-cta" href="https://csstats.gg/player/${esc(id)}" target="_blank" rel="noreferrer">OPEN ON CSSTATS ↗</a>
        <a class="hero-cta" href="index.html#search">BACK TO SEARCH ↗</a>
      </div>
    </article>`;
  }

  /* ------------------------------------------------------------
     EMBED WIDGET VIEWS (compact, no chrome)
     ------------------------------------------------------------ */
  function renderEmbedProfile(profile, snap, source) {
    const candidates = PD.avatarCandidates(profile);
    const r = snap.rates || {};
    return `<article class="embed-widget widget-profile panel">
      <div class="widget-head"><img class="widget-avatar" id="embed-avatar" alt="" src="${esc(candidates[0] || CSO.PLACEHOLDER)}" data-candidates="${esc(candidates.join('|'))}"/><div><b>${esc(profile.name)}</b><span>CS2 · ${source === 'live' ? 'LIVE' : 'SNAPSHOT'}</span></div></div>
      <div class="widget-kpis"><div><span>K/D</span><b>${r.kd == null ? '—' : r.kd.toFixed(2)}</b></div><div><span>RATING</span><b>${r.rating == null ? '—' : r.rating.toFixed(2)}</b></div><div><span>WIN</span><b>${r.winRate == null ? '—' : r.winRate + '%'}</b></div><div><span>HS</span><b>${r.hs == null ? '—' : r.hs + '%'}</b></div></div>
      <div class="widget-foot"><span>by Midnight Field</span><a href="${esc(profile.csstatsUrl)}" target="_blank" rel="noreferrer">CSStats ↗</a></div>
    </article>`;
  }

  function renderEmbedStats(profile, snap, source) {
    const candidates = PD.avatarCandidates(profile);
    const r = snap.rates || {};
    const t = snap.totals || {};
    const rows = [
      ['K/D', r.kd == null ? '—' : r.kd.toFixed(2)], ['HLTV RATING', r.rating == null ? '—' : r.rating.toFixed(2)],
      ['WIN RATE', r.winRate == null ? '—' : r.winRate + '%'], ['HEADSHOT', r.hs == null ? '—' : r.hs + '%'],
      ['ADR', r.adr == null ? '—' : String(Math.round(r.adr))], ['KAST', r.kast == null ? '—' : r.kast + '%'],
      ['GAMES', t.played == null ? '—' : fmtInt(t.played)], ['KILLS', t.kills == null ? '—' : fmtInt(t.kills)]
    ];
    return `<article class="embed-widget widget-stats panel">
      <div class="widget-head"><img class="widget-avatar" id="embed-avatar" alt="" src="${esc(candidates[0] || CSO.PLACEHOLDER)}" data-candidates="${esc(candidates.join('|'))}"/><div><b>${esc(profile.name)}</b><span>statistics widget · ${source === 'live' ? 'LIVE' : 'SNAPSHOT'}</span></div></div>
      <div class="widget-grid">${rows.map((r2) => `<div><span>${r2[0]}</span><b>${r2[1]}</b></div>`).join('')}</div>
      <div class="widget-foot"><span>powered by Midnight Field</span><a href="${esc(profile.csstatsUrl)}" target="_blank" rel="noreferrer">view on CSStats ↗</a></div>
    </article>`;
  }

  /* ------------------------------------------------------------
     POST-RENDER WIRING
     ------------------------------------------------------------ */
  function wireRootAvatars(root) {
    root.querySelectorAll('img[data-candidates]').forEach((img) => {
      const list = (img.getAttribute('data-candidates') || '').split('|').filter(Boolean);
      CSO.wireAvatar(img, list);
    });
  }

  function mountFullInteractions(root, profile, snap, id) {
    const ladder = root.querySelector('#rank-ladder');
    if (ladder && profile.comp && typeof profile.comp.currentRank === 'number') CSO.renderLadder(ladder, profile.comp.currentRank);

    const cmpLinks = root.querySelectorAll('a[href*="compare.html?a="]');
    cmpLinks.forEach((a) => {
      if (!a.getAttribute('href').includes('&b=')) a.setAttribute('href', 'compare.html?a=' + id + '&b=');
    });
  }

  document.addEventListener('DOMContentLoaded', () => { boot(); });
  if (document.readyState !== 'loading') boot();
})();
