/* ============================================================
   COMPARE PAGE — two slots, weighted verdict.
   Purely drives UI; scoring lives in PlayerData.compareProfiles
   (data/players.js, COMPARISON_METRICS).
   ============================================================ */
(function () {
  'use strict';
  const PD = window.PlayerData;
  const CSO = window.CSO;
  const esc = CSO.escapeHtml;
  const byId = (id) => document.getElementById(id);
  const ACCENT = { a: 'sakura', b: 'aqua' };

  const state = { a: null, b: null }; // { id, profile, snapshot, known }
  const pickers = {};

  async function loadSlot(id) {
    if (!id) return { id: null, profile: null, snapshot: null, known: false };
    if (PD.hasSnapshot(id)) {
      const snap = PD.SNAPSHOTS[id];
      return { id, profile: snap.profile, snapshot: snap, known: true };
    }
    // Try live (short window) so a CSStats-known id can still render.
    const loaded = await PD.loadProfile(id);
    return { id, profile: loaded.profile, snapshot: loaded.snapshot, known: loaded.known };
  }

  function setSlot(slot, entry) {
    state[slot] = entry;
    const other = slot === 'a' ? 'b' : 'a';
    if (state[other] && state[other].id === entry.id && state[other].known) {
      // keep both slots honest — never mirror the same card silently
    }
    syncUrl();
    renderSlot(slot);
    renderOutput();
  }

  function syncUrl() {
    const a = state.a && state.a.id ? state.a.id : '';
    const b = state.b && state.b.id ? state.b.id : '';
    try { window.history.replaceState(null, '', 'compare.html?a=' + a + '&b=' + b); } catch (e) { /* file:// edge */ }
  }

  /* ------------------------------------------------------------
     SLOT RENDERING
     ------------------------------------------------------------ */
  function candidateAvatar(profile) {
    const list = PD.avatarCandidates(profile);
    return list[0] || CSO.PLACEHOLDER;
  }

  function renderSlot(slot) {
    const panel = byId('slot-' + slot);
    const entry = state[slot];
    const body = panel.querySelector('.slot-body');
    const clearBtn = panel.querySelector('.slot-clear');
    const pickerHost = body.querySelector('.slot-picker');
    const placeholder = body.querySelector('.slot-placeholder');
    let summary = body.querySelector('.slot-summary');
    const isB = slot === 'b';

    clearBtn.hidden = !entry || !entry.known;

    if (entry && entry.known && entry.profile) {
      if (!summary) {
        summary = document.createElement('div');
        summary.className = 'slot-summary';
        body.insertBefore(summary, pickerHost);
      }
      placeholder.hidden = true;
      pickerHost.hidden = true;
      const p = entry.profile;
      const r = entry.snapshot && entry.snapshot.rates ? entry.snapshot.rates : {};
      const t = entry.snapshot && entry.snapshot.totals ? entry.snapshot.totals : {};
      summary.innerHTML = `
        <img class="vs-avatar" id="vs-avatar-${slot}" alt="" src="${esc(candidateAvatar(p))}" data-candidates="${esc(PD.avatarCandidates(p).join('|'))}"/>
        <div class="vs-summary-copy">
          <b>${esc(p.name)}</b>
          <span>${esc(String(p.steamid).slice(-6) || p.steamid)} · ${p.dossier ? 'DOSSIER' : 'TRACKED'}</span>
          <div class="vs-summary-pills">
            <i>K/D ${r.kd == null ? '—' : r.kd.toFixed(2)}</i><i>RATING ${r.rating == null ? '—' : r.rating.toFixed(2)}</i>
            <i>${t.won == null ? 'WIN —' : t.won + ' WINS'}</i><i>${t.played == null ? '—' : t.played + ' GAMES'}</i>
          </div>
        </div>
        <div class="vs-summary-actions">
          ${isB ? '<a class="text-button vs-swap" href="#" title="Swap players">⇄ SWAP</a>' : ''}
          <a class="text-button" href="${esc(p.dossier ? 'arshi.html' : 'player.html?id=' + p.steamid)}">OPEN ↗</a>
        </div>`;
      const avatar = summary.querySelector('#vs-avatar-' + slot);
      CSO.wireAvatar(avatar, PD.avatarCandidates(p));
      const swap = summary.querySelector('.vs-swap');
      if (swap) CSO.on(swap, 'click', (e) => { e.preventDefault(); swapSlots(); });
      summary.hidden = false;
    } else {
      if (entry && !entry.known) {
        placeholder.hidden = false;
        placeholder.innerHTML = `<b>NOT IN REGISTRY</b><span>${esc(String(entry.id).slice(-6))} — add their stats to data/players.js to compare.</span>`;
      } else {
        placeholder.hidden = false;
        placeholder.innerHTML = isB ? 'CHOOSE PLAYER B <span>⌕</span>' : 'CHOOSE PLAYER A <span>⌕</span>';
      }
      if (summary) summary.hidden = true;
      pickerHost.hidden = true;
    }
  }

  function swapSlots() {
    const tmp = state.a;
    state.a = state.b;
    state.b = tmp;
    syncUrl();
    renderSlot('a');
    renderSlot('b');
    renderOutput();
  }

  /* ------------------------------------------------------------
     PICKER (mount once per slot)
     ------------------------------------------------------------ */
  function setupPicker(slot) {
    const panel = byId('slot-' + slot);
    const body = panel.querySelector('.slot-body');
    const placeholder = body.querySelector('.slot-placeholder');
    const pickerHost = body.querySelector('.slot-picker');
    placeholder.setAttribute('role', 'button');
    placeholder.tabIndex = 0;

    const openPicker = () => {
      placeholder.hidden = true;
      pickerHost.hidden = false;
      const input = pickerHost.querySelector('input');
      const results = pickerHost.querySelector('.search-results');
      pickers[slot] = CSO.mountSearch(input, results, {
        onPick: (profile) => {
          pickerHost.hidden = true;
          const entry = profile ? PD.profileMeta(profile.steamid) || profile : null;
          setSlot(slot, {
            id: profile ? profile.steamid : null,
            profile: entry ? (PD.hasSnapshot(profile.steamid) ? PD.SNAPSHOTS[profile.steamid].profile : profile) : null,
            snapshot: entry && PD.hasSnapshot(profile.steamid) ? PD.SNAPSHOTS[profile.steamid] : null,
            known: !!entry
          });
        }
      });
      input.value = '';
      input.focus();
    };
    CSO.on(placeholder, 'click', openPicker);
    CSO.on(placeholder, 'keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(); } });

    const clearBtn = panel.querySelector('.slot-clear');
    CSO.on(clearBtn, 'click', () => {
      setSlot(slot, { id: null, profile: null, snapshot: null, known: false });
    });
  }

  /* ------------------------------------------------------------
     OUTPUT — verdict + metric scoreboard
     ------------------------------------------------------------ */
  function renderOutput() {
    const out = byId('vs-output');
    const a = state.a;
    const b = state.b;

    if (!a || !a.known || !b || !b.known || !a.snapshot || !b.snapshot) {
      out.hidden = true;
      return;
    }
    out.hidden = false;

    const same = a.id === b.id;
    const result = same ? null : PD.compareProfiles(a.snapshot, b.snapshot);
    renderVerdict(a, b, result, same);
    renderRows(a, b, result);
  }

  function renderVerdict(a, b, result, same) {
    const verdict = byId('verdict');
    if (same) {
      verdict.className = 'verdict panel tie';
      verdict.innerHTML = `<div class="verdict-mark">＝</div><div class="verdict-copy"><p class="eyebrow">VERDICT</p><h2>Same player, same mirror</h2><p>Both slots hold ${esc(a.profile.name)}. Clear one slot and pick a different player to score the duel.</p></div>`;
      return;
    }
    const nameA = a.profile.name;
    const nameB = b.profile.name;
    const shareA = result.shareA;
    const shareB = result.shareB;
    const lead = shareA >= shareB ? 'a' : 'b';
    const leadName = lead === 'a' ? nameA : nameB;
    const otherName = lead === 'a' ? nameB : nameA;
    const leadShare = lead === 'a' ? shareA : shareB;

    let headline;
    let note;
    if (!result.decided) {
      headline = 'Nothing to tally';
      note = 'Neither profile exposes overlapping numeric stats, so no weighted score is possible yet.';
    } else if (shareA === shareB) {
      headline = 'Dead even';
      note = 'The weighted metrics balance out exactly — ' + shareA + ' / ' + shareB + '.';
    } else {
      headline = `${leadName} is ${leadShare}% better than ${otherName}`;
      note = `Weighted split ${shareA}% / ${shareB}% across ${result.decided} decisive metrics (${result.metricsUsed} compared).`;
    }

    verdict.className = 'verdict panel ' + (lead === 'a' ? 'lead-a' : lead === 'b' ? 'lead-b' : 'tie');
    verdict.innerHTML = `
      <div class="verdict-mark">${same ? '＝' : lead === 'a' ? 'A' : lead === 'b' ? 'B' : '—'}</div>
      <div class="verdict-copy">
        <p class="eyebrow">VERDICT ${result && result.decided ? '// ' + result.decided + ' METRICS DECIDED' : ''}</p>
        <h2>${esc(headline)}</h2>
        <p>${esc(note)}</p>
        <div class="vs-meter" aria-hidden="true"><i class="m-a" style="width:${shareA}%"></i><i class="m-b" style="width:${shareB}%"></i></div>
        <div class="vs-meter-labels"><span class="la">${esc(nameA)} · ${shareA}%</span><span class="lb">${esc(nameB)} · ${shareB}%</span></div>
      </div>`;
  }

  function renderRows(a, b, result) {
    const note = byId('vs-table-note');
    note.textContent = (result ? result.metricsUsed : 0) + ' METRICS WITH DATA · WEIGHTS ×1–×4';
    const rowsHost = byId('vs-rows');

    if (!result || !result.decided) {
      rowsHost.innerHTML = `<div class="vs-none"><span>NO OVERLAPPING STATS</span><p>Add numeric totals to both snapshots in <code>data/players.js</code> and this board fills itself in.</p></div>`;
      return;
    }

    rowsHost.innerHTML = result.rows.map((r) => {
      const stateCls = !r.applicable ? 'na' : r.better === 'tie' ? 'tie' : r.better === 'a' ? 'win-a' : 'win-b';
      const mark = (side) => {
        if (!r.applicable) return '';
        if (r.better === 'tie') return '<i class="vs-eq">＝</i>';
        if (r.better === side) return '<i class="vs-tick">✓</i>';
        return '';
      };
      return `<div class="vs-row ${stateCls}">
        <div class="vs-cell side-a">${mark('a')}<b>${esc(r.fmt(r.va))}</b><span>${esc(a.profile.name)}</span></div>
        <div class="vs-cell metric"><span>${esc(r.label)}</span><em>×${r.weight}</em></div>
        <div class="vs-cell side-b">${mark('b')}<b>${esc(r.fmt(r.vb))}</b><span>${esc(b.profile.name)}</span></div>
      </div>`;
    }).join('');
  }

  /* ------------------------------------------------------------
     BOOT
     ------------------------------------------------------------ */
  async function boot() {
    const navInput = byId('nav-search');
    const navResults = byId('nav-search-results');
    if (navInput && navResults) CSO.mountSearch(navInput, navResults, { onPick: CSO.openProfile });

    setupPicker('a');
    setupPicker('b');

    const aId = CSO.qs('a');
    const bId = CSO.qs('b');
    if (aId) state.a = await loadSlot(aId);
    if (bId) state.b = await loadSlot(bId);
    renderSlot('a');
    renderSlot('b');
    renderOutput();
    requestAnimationFrame(() => CSO.initReveals());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { boot(); });
  else boot();
})();
