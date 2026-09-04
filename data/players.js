/* ============================================================
   DATA LAYER — player registry, normalized snapshots, sources
   ------------------------------------------------------------
   Pure logic, no DOM. Every page loads this file first and talks
   through `window.PlayerData`.

   Architecture
   ------------
   Home / Search  ->  PlayerData.search() over REGISTRY + "recent"
   Player profile ->  PlayerData.load(id): tries CSStats live JSON,
                      falls back to the local SNAPSHOT store, then to
                      a bare profile. Never throws on network errors.
   Avatars        ->  Steam CDN is tried first, CSStats image second,
                      local placeholder last (profile survives if
                      either external service is down).
   Compare        ->  ComparisonEngine.metrics is a modular table:
                      add/remove rows to adjust what is compared and
                      how much it weighs. No UI code touches it.

   Adding a new player later = append one entry to SNAPSHOTS with
   their CSStats numbers. Everything else follows automatically
   (search, profile page, compare, widgets).
   ============================================================ */
(function (global) {
  'use strict';

  const CDN = 'https://static.csstats.gg/images';

  /* ------------------------------------------------------------
     NORMALIZED SNAPSHOTS
     One object per player. Fields below mirror the CSStats page.
     Percentages are stored as numbers 0-100; display formatting
     happens in the UI layer.
     ------------------------------------------------------------ */

  const SNAPSHOTS = {
    /* Arshi — real snapshot supplied by the owner (Sept 2026) */
    '76561199524171843': {
      source: 'snapshot',
      profile: {
        steamid: '76561199524171843',
        name: '\u2718 \uD835\uDC02\uD835\uDC2B\uD835\uDC26\uD835\uDC1F\uD835\uDC22',
        namePlain: 'Arshi',
        steamUrl: 'https://steamcommunity.com/profiles/76561199524171843',
        csstatsUrl: 'https://csstats.gg/player/76561199524171843',
        steamAvatarHash: 'a861eeff5261636d6fc23597162c57e40326b61a',
        dossier: true,
        tracking: 'inactive',
        lastActive: '2mo ago',
        tags: ['VALVE', '5V5', 'COMPETITIVE'],
        comp: { lastActive: '2mo ago', games: 54, wins: 54, currentRank: 0, bestRank: 0, multiplicity: 6 },
        premier: { season: 'PREMIER S5', wins: 0, current: null, best: null, seasons: [['S4 2026', 1, null, null], ['S3 2025', 4, null, null]] }
      },
      totals: { played: 183, won: 60, lost: 110, tied: 13, kills: 1669, deaths: 2844, assists: 647, headshots: 861, rounds: 3448, damage: 195088 },
      rates: { kd: 0.59, rating: 0.68, winRate: 33, hs: 52, adr: 57, kast: 60 },
      clutch: { rate: 10, rows: [
        { label: '1v1', rate: 49, w: 17, l: 18 }, { label: '1v2', rate: 17, w: 11, l: 53 },
        { label: '1v3', rate: 0, w: 0, l: 74 }, { label: '1v4', rate: 1, w: 1, l: 79 }, { label: '1v5', rate: 0, w: 0, l: 43 }] },
      entry: { rate: 38, t: 38, ct: 37, attempt: 17, perRound: 6 },
      weapons: [
        { icon: 'ak47_light.png', name: 'AK-47', kills: 557, hs: 311, hsRate: '56%', acc: '15%', damage: '61,777' },
        { icon: 'm4a1_silencer_light.png', name: 'M4A1-S', kills: 426, hs: 202, hsRate: '47%', acc: '16%', damage: '48,473' },
        { icon: 'usp_silencer_light.png', name: 'USP-S', kills: 153, hs: 99, hsRate: '65%', acc: '16%', damage: '19,368' },
        { icon: 'famas_light.png', name: 'FAMAS', kills: 93, hs: 48, hsRate: '52%', acc: '17%', damage: '10,599' },
        { icon: 'glock_light.png', name: 'Glock-18', kills: 90, hs: 48, hsRate: '53%', acc: '15%', damage: '11,892' },
        { icon: 'm4a1_light.png', name: 'M4A4', kills: 71, hs: 36, hsRate: '51%', acc: '15%', damage: '7,609' },
        { icon: 'awp_light.png', name: 'AWP', kills: 65, hs: 12, hsRate: '18%', acc: '29%', damage: '6,047' },
        { icon: 'galilar_light.png', name: 'Galil AR', kills: 39, hs: 20, hsRate: '51%', acc: '15%', damage: '4,769' },
        { icon: 'tec9_light.png', name: 'Tec-9', kills: 31, hs: 16, hsRate: '52%', acc: '15%', damage: '3,693' },
        { icon: 'mp9_light.png', name: 'MP9', kills: 25, hs: 14, hsRate: '56%', acc: '11%', damage: '3,967' },
        { icon: 'mac10_light.png', name: 'MAC-10', kills: 23, hs: 11, hsRate: '48%', acc: '12%', damage: '3,474' },
        { icon: 'p250_light.png', name: 'P250', kills: 18, hs: 8, hsRate: '44%', acc: '9%', damage: '1,816' },
        { icon: 'ssg08_light.png', name: 'SSG 08', kills: 16, hs: 12, hsRate: '75%', acc: '19%', damage: '2,368' },
        { icon: 'mp7_light.png', name: 'MP7', kills: 14, hs: 5, hsRate: '36%', acc: '17%', damage: '2,184' },
        { icon: 'deagle_light.png', name: 'Desert Eagle', kills: 10, hs: 7, hsRate: '70%', acc: '23%', damage: '1,148' }
      ],
      maps: [
        { icon: 'de_dust2_v2.png', folder: 'maps/icons', name: 'Dust2', games: 84, wr: '31%', kd: '0.64', adr: '60', rating: '0.74', kast: '62%' },
        { icon: 'de_mirage.png', folder: 'maps/icons/cs2', name: 'Mirage', games: 34, wr: '38%', kd: '0.62', adr: '61', rating: '0.73', kast: '62%' },
        { icon: 'de_inferno.png', folder: 'maps/icons/cs2', name: 'Inferno', games: 24, wr: '29%', kd: '0.44', adr: '47', rating: '0.53', kast: '56%' },
        { icon: 'de_nuke.png', folder: 'maps/icons/cs2', name: 'Nuke', games: 14, wr: '36%', kd: '0.53', adr: '51', rating: '0.63', kast: '62%' },
        { icon: 'de_ancient.png', folder: 'maps/icons', name: 'Ancient', games: 6, wr: '17%', kd: '0.43', adr: '37', rating: '0.41', kast: '52%' },
        { icon: 'de_train.png', folder: 'maps/icons/cs2', name: 'Train', games: 4, wr: '75%', kd: '0.50', adr: '53', rating: '0.64', kast: '64%' },
        { icon: 'de_vertigo_1.png', folder: 'maps/icons', name: 'Vertigo', games: 4, wr: '50%', kd: '0.61', adr: '50', rating: '0.60', kast: '53%' },
        { icon: 'de_cache.png', folder: 'maps/icons/cs2', name: 'Cache', games: 4, wr: '25%', kd: '0.50', adr: '59', rating: '0.59', kast: '55%' },
        { icon: 'de_overpass.png', folder: 'maps/icons/cs2', name: 'Overpass', games: 2, wr: '50%', kd: '0.68', adr: '53', rating: '0.72', kast: '60%' },
        { icon: 'cs_office.png', folder: 'maps/icons/cs2', name: 'Office', games: 1, wr: '100%', kd: '0.42', adr: '54', rating: '0.65', kast: '69%' }
      ],
      matches: [
        { icon: 'de_cache.png', folder: 'maps/icons/cs2', name: 'CACHE', score: '2 : 13', result: 'L', rating: '0.42', k: '10', d: '22', a: '4', adr: '43' },
        { icon: 'de_overpass.png', folder: 'maps/icons/cs2', name: 'OVERPASS', score: '4 : 13', result: 'L', rating: '0.51', k: '12', d: '21', a: '3', adr: '48' },
        { icon: 'de_dust2_v2.png', folder: 'maps/icons', name: 'DUST II', score: '7 : 13', result: 'L', rating: '0.65', k: '15', d: '19', a: '5', adr: '57' },
        { icon: 'de_inferno.png', folder: 'maps/icons/cs2', name: 'INFERNO', score: '7 : 13', result: 'L', rating: '0.54', k: '14', d: '20', a: '6', adr: '51' },
        { icon: 'de_mirage.png', folder: 'maps/icons/cs2', name: 'MIRAGE', score: '4 : 13', result: 'L', rating: '0.48', k: '12', d: '22', a: '4', adr: '45' },
        { icon: 'de_ancient.png', folder: 'maps/icons', name: 'ANCIENT', score: '12 : 12', result: 'D', rating: '0.74', k: '22', d: '20', a: '7', adr: '68' },
        { icon: 'de_mirage.png', folder: 'maps/icons/cs2', name: 'MIRAGE', score: '13 : 4', result: 'W', rating: '1.08', k: '24', d: '13', a: '8', adr: '82' },
        { icon: 'de_cache.png', folder: 'maps/icons/cs2', name: 'CACHE', score: '3 : 13', result: 'L', rating: '0.44', k: '11', d: '21', a: '3', adr: '41' },
        { icon: 'de_dust2_v2.png', folder: 'maps/icons', name: 'DUST II', score: '9 : 13', result: 'L', rating: '0.61', k: '18', d: '22', a: '4', adr: '55' },
        { icon: 'de_nuke.png', folder: 'maps/icons/cs2', name: 'NUKE', score: '12 : 6', result: 'W', rating: '0.91', k: '21', d: '16', a: '8', adr: '77' }
      ]
    },

    /* _$a\/@gE- — real CSStats snapshot supplied by the owner */
    '76561199556226328': {
      source: 'snapshot',
      profile: {
        steamid: '76561199556226328',
        name: '_$a\\/@gE-',
        namePlain: '_$a\\/@gE-',
        steamUrl: 'https://steamcommunity.com/profiles/76561199556226328',
        csstatsUrl: 'https://csstats.gg/player/76561199556226328',
        steamAvatarHash: null,
        dossier: false,
        tracking: 'off',
        lastActive: '1w ago',
        tags: ['VALVE', '5V5'],
        comp: { lastActive: '1w ago', games: 155, wins: null, currentRank: null, bestRank: null, multiplicity: 2 },
        premier: { season: 'PREMIER S5', wins: 25, current: 14999, best: 17230, seasons: [['S4 2026', 8, null, null], ['S3 2025', 24, 11189, 12001], ['S2 2025', 7, null, null], ['S1 2023', 15, 4273, 4548]] }
      },
      totals: { played: 198, won: 89, lost: 96, tied: 13, kills: 3267, deaths: 2589, assists: 680, headshots: 1646, rounds: 3890, damage: 337677 },
      rates: { kd: 1.26, rating: 1.24, winRate: 45, hs: 50, adr: 87, kast: 71 },
      clutch: { rate: 22, rows: [
        { label: '1v1', rate: 64, w: 78, l: 44 }, { label: '1v2', rate: 27, w: 49, l: 133 },
        { label: '1v3', rate: 13, w: 23, l: 151 }, { label: '1v4', rate: 4, w: 7, l: 152 }, { label: '1v5', rate: 1, w: 1, l: 77 }] },
      entry: { rate: 60, t: 58, ct: 63, attempt: 14, perRound: 9 },
      weapons: [
        { icon: 'ak47_light.png', name: 'AK-47', kills: 1041, hs: 618, hsRate: '59%', acc: '17%', damage: '104,808' },
        { icon: 'm4a1_silencer_light.png', name: 'M4A1-S', kills: 651, hs: 325, hsRate: '50%', acc: '20%', damage: '64,019' },
        { icon: 'awp_light.png', name: 'AWP', kills: 451, hs: 66, hsRate: '15%', acc: '41%', damage: '40,169' },
        { icon: 'usp_silencer_light.png', name: 'USP-S', kills: 242, hs: 182, hsRate: '75%', acc: '21%', damage: '23,379' },
        { icon: 'glock_light.png', name: 'Glock-18', kills: 157, hs: 107, hsRate: '68%', acc: '20%', damage: '17,054' },
        { icon: 'mac10_light.png', name: 'MAC-10', kills: 93, hs: 53, hsRate: '57%', acc: '16%', damage: '10,330' },
        { icon: 'm4a1_light.png', name: 'M4A4', kills: 79, hs: 40, hsRate: '51%', acc: '20%', damage: '8,384' },
        { icon: 'mp9_light.png', name: 'MP9', kills: 67, hs: 31, hsRate: '46%', acc: '20%', damage: '7,689' },
        { icon: 'ssg08_light.png', name: 'SSG 08', kills: 61, hs: 33, hsRate: '54%', acc: '25%', damage: '9,443' },
        { icon: 'galilar_light.png', name: 'Galil AR', kills: 58, hs: 26, hsRate: '45%', acc: '18%', damage: '6,410' },
        { icon: 'tec9_light.png', name: 'Tec-9', kills: 49, hs: 28, hsRate: '57%', acc: '18%', damage: '5,310' },
        { icon: 'p90_light.png', name: 'P90', kills: 45, hs: 24, hsRate: '53%', acc: '19%', damage: '5,137' },
        { icon: 'deagle_light.png', name: 'Desert Eagle', kills: 39, hs: 28, hsRate: '72%', acc: '22%', damage: '4,004' },
        { icon: 'mp7_light.png', name: 'MP7', kills: 12, hs: 6, hsRate: '50%', acc: '17%', damage: '1,368' },
        { icon: 'fiveseven_light.png', name: 'Five-SeveN', kills: 11, hs: 7, hsRate: '64%', acc: '19%', damage: '1,065' }
      ],
      maps: [
        { icon: 'de_dust2_v2.png', folder: 'maps/icons', name: 'Dust2', games: 51, wr: '43%', kd: '1.19', adr: '82', rating: '1.17', kast: '71%' },
        { icon: 'de_mirage.png', folder: 'maps/icons/cs2', name: 'Mirage', games: 43, wr: '53%', kd: '1.25', adr: '86', rating: '1.22', kast: '72%' },
        { icon: 'de_inferno.png', folder: 'maps/icons/cs2', name: 'Inferno', games: 25, wr: '40%', kd: '1.31', adr: '89', rating: '1.31', kast: '74%' },
        { icon: 'de_nuke.png', folder: 'maps/icons/cs2', name: 'Nuke', games: 22, wr: '41%', kd: '1.29', adr: '89', rating: '1.28', kast: '73%' },
        { icon: 'de_train.png', folder: 'maps/icons/cs2', name: 'Train', games: 13, wr: '38%', kd: '1.09', adr: '74', rating: '1.08', kast: '72%' },
        { icon: 'de_ancient.png', folder: 'maps/icons', name: 'Ancient', games: 12, wr: '33%', kd: '1.24', adr: '89', rating: '1.26', kast: '72%' },
        { icon: 'de_anubis.png', folder: 'maps/icons/cs2', name: 'Anubis', games: 10, wr: '40%', kd: '1.35', adr: '83', rating: '1.29', kast: '76%' },
        { icon: 'de_cache.png', folder: 'maps/icons/cs2', name: 'Cache', games: 6, wr: '50%', kd: '1.59', adr: '92', rating: '1.44', kast: '80%' },
        { icon: 'de_vertigo_1.png', folder: 'maps/icons', name: 'Vertigo', games: 5, wr: '60%', kd: '1.31', adr: '79', rating: '1.14', kast: '71%' },
        { icon: 'cs_office.png', folder: 'maps/icons/cs2', name: 'Office', games: 3, wr: '67%', kd: '2.59', adr: '140', rating: '2.04', kast: '79%' },
        { icon: 'de_overpass.png', folder: 'maps/icons/cs2', name: 'Overpass', games: 3, wr: '33%', kd: '1.08', adr: '87', rating: '1.27', kast: '76%' }
      ],
      matches: []
    }
  };

  /* ------------------------------------------------------------
     RECENT VIEWS (localStorage) — makes profiles that were opened
     by steam id searchable later, so search is never hardcoded.
     ------------------------------------------------------------ */
  const RECENT_KEY = 'dossier-recent-v1';
  const LS = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  /* ------------------------------------------------------------
     STEAM ID PARSING — accepts 17-digit ids, 76561..., profile URLs
     ------------------------------------------------------------ */
  // Steam IDs are ~7.6e16 — beyond Number.MAX_SAFE_INTEGER, so any
  // id3/STEAM_0 conversion has to happen in BigInt to stay exact.
  const STEAM_BASE = 76561197960265728n;
  function parseSteamId(input) {
    const text = String(input || '').trim();
    if (!text) return null;
    const long = text.match(/(7656119\d{10})/);
    if (long) return long[1];
    // SteamID3 [U:1:123456] -> steamid64 (id3 already carries the doubled account)
    const id3 = text.match(/\[U:1:(\d+)\]/i);
    if (id3) return String(STEAM_BASE + BigInt(id3[1]));
    // SteamID2 STEAM_0:a:b -> steamid64
    const short = text.match(/^STEAM_0:(\d):(\d+)$/i);
    if (short) return String(STEAM_BASE + (BigInt(short[2]) * 2n) + BigInt(short[1]));
    if (/^7656119\d{10}$/.test(text)) return text;
    return null;
  }

  function hasSnapshot(id) { return Object.prototype.hasOwnProperty.call(SNAPSHOTS, id); }

  /* ------------------------------------------------------------
     AVATAR SOURCES — Steam first, CSStats second, never fatal.
     Candidate order is exactly the priority chain the UI follows.
     ------------------------------------------------------------ */
  function avatarCandidates(profile) {
    const list = [];
    // 1) Steam CDN (preferred — usually the freshest picture)
    if (profile.steamAvatarHash) list.push('https://avatars.steamstatic.com/' + profile.steamAvatarHash + '_full.jpg');
    else if (profile.avatarSteam) list.push(profile.avatarSteam);
    // 2) CSStats-served picture (same avatars CDN when present)
    if (profile.avatarCs) list.push(profile.avatarCs);
    // 3) any avatar returned by a live source
    if (profile.avatarLive) list.push(profile.avatarLive);
    return list;
  }

  function profileMeta(id) {
    const snap = SNAPSHOTS[id];
    if (!snap) return null;
    return {
      steamid: id,
      name: snap.profile.name,
      namePlain: snap.profile.namePlain || snap.profile.name,
      dossier: !!snap.profile.dossier,
      avatarSteam: snap.profile.steamAvatarHash ? 'https://avatars.steamstatic.com/' + snap.profile.steamAvatarHash + '_full.jpg' : null,
      avatarCs: snap.profile.avatarCs || null,
      tracking: snap.profile.tracking || 'off',
      hasStats: true,
      source: 'snapshot',
      steamUrl: snap.profile.steamUrl,
      csstatsUrl: snap.profile.csstatsUrl
    };
  }

  function rememberRecent(id, extra) {
    let recent = LS.get(RECENT_KEY) || [];
    recent = recent.filter((r) => r.steamid !== id);
    const base = profileMeta(id) || {};
    recent.unshift({
      steamid: id,
      name: (extra && extra.name) || base.name || id,
      avatarSteam: (extra && extra.avatarSteam) || base.avatarSteam || null,
      dossier: !!(extra && extra.dossier) || !!base.dossier,
      hasStats: !!(extra && extra.hasStats) || !!base.hasStats
    });
    LS.set(RECENT_KEY, recent.slice(0, 12));
  }

  function recentProfiles() {
    return (LS.get(RECENT_KEY) || []).map((r) => ({
      steamid: r.steamid,
      name: r.name,
      namePlain: r.name,
      dossier: !!r.dossier,
      avatarSteam: r.avatarSteam || null,
      avatarCs: null,
      hasStats: !!r.hasStats,
      source: 'recent'
    }));
  }

  /* ------------------------------------------------------------
     SEARCH — registry + recent, matched by name or steam id.
     Returns profile cards in a display-friendly shape.
     ------------------------------------------------------------ */
  function allIndexed() {
    const seen = {};
    const out = [];
    Object.keys(SNAPSHOTS).forEach((id) => { seen[id] = true; out.push(profileMeta(id)); });
    recentProfiles().forEach((r) => { if (!seen[r.steamid]) { seen[r.steamid] = true; out.push(r); } });
    return out;
  }

  function scoreHit(profile, q) {
    const query = q.toLowerCase();
    const name = String(profile.name || '').toLowerCase();
    const plain = String(profile.namePlain || profile.name || '').toLowerCase();
    if (plain.indexOf(query) === 0 || name.indexOf(query) === 0) return 100;
    if (plain.indexOf(query) !== -1 || name.indexOf(query) !== -1) return 60;
    if (String(profile.steamid).indexOf(query) !== -1) return 80;
    return 0;
  }

  function searchProfiles(query) {
    const q = String(query || '').trim();
    const results = [];
    if (!q) return results;
    allIndexed().forEach((p) => {
      const s = scoreHit(p, q);
      if (s > 0) results.push(Object.assign({ score: s }, p));
    });
    results.sort((a, b) => b.score - a.score || (a.name > b.name ? 1 : -1));
    return results.slice(0, 8);
  }

  /* ------------------------------------------------------------
     LIVE SOURCE — best effort. Public CSStats JSON can be behind
     auth/CORS, so a miss is normal and never an error: the loader
     silently drops to the local snapshot. Kept as a separate
     provider so a future key/proxy can slot in without touching
     the pages.
     ------------------------------------------------------------ */
  const API_TIMEOUT_MS = 3500;

  function fetchLive(id) {
    return new Promise((resolve) => {
      if (typeof fetch !== 'function') return resolve(null);
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = setTimeout(() => { if (ctrl) ctrl.abort(); resolve(null); }, API_TIMEOUT_MS);
      fetch('https://api.csstats.gg/player/' + id + '?game=cs2', { signal: ctrl ? ctrl.signal : undefined })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          clearTimeout(timer);
          if (!json || (!json.name && !json.id)) return resolve(null);
          resolve(json);
        })
        .catch(() => { clearTimeout(timer); resolve(null); });
    });
  }

  async function loadProfile(id, opts) {
    const options = opts || {};

    // Fast path — the local snapshot renders instantly; the CSStats
    // page it mirrors is the source of truth for the stored numbers.
    if (hasSnapshot(id)) {
      const snapshot = SNAPSHOTS[id];
      rememberRecent(id, {
        name: snapshot.profile.name,
        avatarSteam: snapshot.profile.steamAvatarHash ? 'https://avatars.steamstatic.com/' + snapshot.profile.steamAvatarHash + '_full.jpg' : null,
        dossier: !!snapshot.profile.dossier,
        hasStats: true
      });
      return { profile: snapshot.profile, snapshot, source: snapshot.source, known: true };
    }

    // Unknown ID — attempt a live CSStats lookup (short timeout, never fatal).
    if (options.live !== false) {
      const live = await fetchLive(id);
      if (live && live.name) {
        const snapshot = {
          source: 'live',
          profile: {
            steamid: id,
            name: live.name || id,
            namePlain: live.name || id,
            steamUrl: 'https://steamcommunity.com/profiles/' + id,
            csstatsUrl: 'https://csstats.gg/player/' + id,
            steamAvatarHash: null,
            avatarLive: live.avatar || live.avatarMedium || null,
            dossier: false,
            tracking: 'off',
            lastActive: null,
            tags: [],
            comp: { games: null, wins: null, currentRank: null, bestRank: null },
            premier: null
          },
          totals: {}, rates: {}, clutch: { rate: null, rows: [] }, entry: { rate: null },
          weapons: [], maps: [], matches: []
        };
        rememberRecent(id, { name: snapshot.profile.name, avatarSteam: null, dossier: false, hasStats: false });
        return { profile: snapshot.profile, snapshot, source: 'live', known: true };
      }
    }

    rememberRecent(id, { name: id, hasStats: false });
    return { profile: null, snapshot: null, source: null, known: false };
  }

  /* ------------------------------------------------------------
     COMPARISON ENGINE — modular scoring.
     -----------------------------------------------------------------
     `metrics` is the single place to tune what a matchup measures.
     Each metric: label, weight, higherIsBetter, value(snapshot)
     (numeric or null), format(value). Rows with a null on either
     side are reported but excluded from the weighted score.
     ------------------------------------------------------------ */
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

  const COMPARISON_METRICS = [
    { key: 'rating', label: 'HLTV RATING', weight: 4, higherIsBetter: true, value: (s) => num(s.rates && s.rates.rating), fmt: (v) => (v === null ? '—' : v.toFixed(2)) },
    { key: 'kd', label: 'K/D RATIO', weight: 4, higherIsBetter: true, value: (s) => num(s.rates && s.rates.kd), fmt: (v) => (v === null ? '—' : v.toFixed(2)) },
    { key: 'adr', label: 'ADR', weight: 3, higherIsBetter: true, value: (s) => num(s.rates && s.rates.adr), fmt: (v) => (v === null ? '—' : String(Math.round(v))) },
    { key: 'winRate', label: 'WIN RATE', weight: 3, higherIsBetter: true, value: (s) => num(s.rates && s.rates.winRate), fmt: (v) => (v === null ? '—' : v + '%') },
    { key: 'kast', label: 'KAST', weight: 2, higherIsBetter: true, value: (s) => num(s.rates && s.rates.kast), fmt: (v) => (v === null ? '—' : v + '%') },
    { key: 'hs', label: 'HEADSHOT %', weight: 2, higherIsBetter: true, value: (s) => num(s.rates && s.rates.hs), fmt: (v) => (v === null ? '—' : v + '%') },
    { key: 'clutch', label: 'CLUTCH 1vX', weight: 2, higherIsBetter: true, value: (s) => num(s.clutch && s.clutch.rate), fmt: (v) => (v === null ? '—' : v + '%') },
    { key: 'entry', label: 'ENTRY SUCCESS', weight: 2, higherIsBetter: true, value: (s) => num(s.entry && s.entry.rate), fmt: (v) => (v === null ? '—' : v + '%') },
    { key: 'kills', label: 'KILLS', weight: 1, higherIsBetter: true, value: (s) => num(s.totals && s.totals.kills), fmt: (v) => (v === null ? '—' : String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')) },
    { key: 'damage', label: 'DAMAGE', weight: 1, higherIsBetter: true, value: (s) => num(s.totals && s.totals.damage), fmt: (v) => (v === null ? '—' : String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')) }
  ];

  function compareProfiles(aSnap, bSnap) {
    const rows = COMPARISON_METRICS.map((m) => {
      const va = m.value(aSnap);
      const vb = m.value(bSnap);
      const applicable = va !== null && vb !== null;
      let better = null;
      if (applicable) {
        if (va === vb) better = 'tie';
        else better = (va > vb) === m.higherIsBetter ? 'a' : 'b';
      }
      return { key: m.key, label: m.label, weight: m.weight, fmt: m.fmt, va, vb, better, applicable };
    });

    let weightA = 0; let weightB = 0; let total = 0; let decided = 0;
    rows.forEach((r) => {
      if (!r.applicable || r.better === 'tie') return;
      total += r.weight; decided += 1;
      if (r.better === 'a') weightA += r.weight; else weightB += r.weight;
    });

    const shareA = total ? Math.round((weightA / total) * 100) : 50;
    const shareB = 100 - shareA;
    return {
      rows,
      metricsUsed: rows.filter((r) => r.applicable).length,
      decided,
      weighted: { total, a: weightA, b: weightB },
      shareA, shareB,
      verdict: !decided
        ? { kind: 'empty', text: 'No shared statistics to compare yet.' }
        : shareA === shareB
          ? { kind: 'tie', text: 'Dead even — neither player leads.' }
          : shareA > shareB
            ? { kind: 'a', text: 'A leads on the weighted metrics.' }
            : { kind: 'b', text: 'B leads on the weighted metrics.' }
    };
  }

  global.PlayerData = {
    CDN,
    SNAPSHOTS,
    parseSteamId,
    hasSnapshot,
    profileMeta,
    avatarCandidates,
    searchProfiles,
    recentProfiles,
    loadProfile,
    fetchLive,
    COMPARISON_METRICS,
    compareProfiles
  };
})(typeof window !== 'undefined' ? window : this);
