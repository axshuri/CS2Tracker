/* ============================================================
   HOME — universal search console + registry stats
   ============================================================ */
(function () {
  'use strict';
  const PD = window.PlayerData;
  const CSO = window.CSO;

  function byId(id) { return document.getElementById(id); }

  const navSearch = CSO.mountSearch(byId('nav-search'), byId('nav-search-results'), { onPick: CSO.openProfile });
  const homeSearch = CSO.mountSearch(byId('home-search'), byId('home-search-results'), { onPick: CSO.openProfile });

  // quick-try chips fill and run the console
  document.querySelectorAll('.hint-chip').forEach((chip) => {
    CSO.on(chip, 'click', () => {
      const input = byId('home-search');
      input.value = chip.dataset.hint || chip.textContent.trim();
      input.focus();
      homeSearch.runSearch(input.value);
    });
  });

  const countEl = byId('registry-count');
  if (countEl && PD) countEl.textContent = String(Object.keys(PD.SNAPSHOTS).length);
})();
