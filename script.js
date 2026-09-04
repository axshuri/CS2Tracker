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

function renderWeapons() {
  const root = document.querySelector('#weapon-table');
  root.innerHTML = `<div class="data-row header weapon-data"><span></span><span>WEAPON</span><span>KILLS</span><span>HEADSHOTS</span><span>HS%</span><span>ACCURACY</span><span>DAMAGE</span></div>${weapons.map(([file, name, kills, hs, hsRate, accuracy, damage]) => `<div class="data-row weapon-data"><img src="${imageUrl('weapons', file)}" alt="${name}"/><strong>${name}</strong><b>${kills}</b><span>${hs}</span><em>${hsRate}</em><span>${accuracy}</span><span>${damage}</span></div>`).join('')}`;
}

function renderMaps() {
  const root = document.querySelector('#map-table');
  root.innerHTML = `<div class="data-row header map-data"><span>MAP</span><span>GAMES</span><span>WIN RATE</span><span>K/D</span><span>ADR</span><span>RATING</span><span>KAST</span></div>${maps.map(([file, name, games, winRate, kd, adr, rating, kast]) => `<div class="data-row map-data"><strong><img src="${imageUrl('maps/icons/cs2', file)}" alt="${name}"/> ${name}</strong><b>${games}</b><em>${winRate}</em><span>${kd}</span><span>${adr}</span><span>${rating}</span><span>${kast}</span></div>`).join('')}`;
}

function renderMatches() {
  const root = document.querySelector('#matches-table');
  root.innerHTML = `<div class="data-row header match-data"><span>MAP</span><span>SCORE</span><span>RESULT</span><span>RATING</span><span>K</span><span>D</span><span>A</span><span>ADR</span></div>${matches.map(([file, name, score, result, rating, kills, deaths, assists, adr]) => `<div class="data-row match-data ${result === 'L' ? 'loss' : ''}"><strong><img src="${imageUrl(file === 'de_dust2_v2.png' || file === 'de_ancient.png' ? 'maps/icons' : 'maps/icons/cs2', file)}" alt="${name}"/> ${name}</strong><span>${score}</span><span class="result">${result === 'D' ? 'TIE' : result === 'W' ? 'WIN' : 'LOSS'}</span><span>${rating}</span><b>${kills}</b><span>${deaths}</span><span>${assists}</span><span>${adr}</span></div>`).join('')}`;
}

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
const initialView = window.location.hash.replace('#', '');
if (['overview', 'weapons', 'maps', 'matches'].includes(initialView)) selectView(initialView);
