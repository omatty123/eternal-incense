/* ═══════════════════════════════════════════
   Eternal Incense — 영원한 향
   Memorial ritual calculator & incense shrine
   ═══════════════════════════════════════════ */

// ─── Firebase (Flower Offerings) ───

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAld8X2pej_on5kwnGLOYvVIgRUSgDOV-U",
  authDomain: "eternal-incense.firebaseapp.com",
  databaseURL: "https://eternal-incense-default-rtdb.firebaseio.com",
  projectId: "eternal-incense",
  storageBucket: "eternal-incense.firebasestorage.app",
  messagingSenderId: "1014197497498",
  appId: "1:1014197497498:web:33be4a4e21f9895c2f3923",
};

let flowerDb = null;
let flowersConnected = false;
const pendingFlowerOfferings = new Set();

function initFirebase() {
  if (!FIREBASE_CONFIG.databaseURL) return;
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    flowerDb = firebase.database();
    flowerDb.ref('.info/connected').on('value', snap => { flowersConnected = snap.val() === true; });
  } catch (e) {
    console.warn('Firebase init failed:', e);
  }
}

function getDailyFlowerCount(memorialId) {
  const key = 'flower-daily-' + memorialId;
  try {
    const data = JSON.parse(localStorage.getItem(key));
    if (data && data.date === new Date().toDateString()) return data.count;
    return 0;
  } catch { return 0; }
}

function recordFlowerOffered(memorialId) {
  const key = 'flower-daily-' + memorialId;
  const count = getDailyFlowerCount(memorialId) + 1;
  localStorage.setItem(key, JSON.stringify({ date: new Date().toDateString(), count }));
}

function canLeaveFlower(memorialId) {
  return getDailyFlowerCount(memorialId) < 3;
}

async function leaveFlower(memorialId) {
  if (!flowerDb || !flowersConnected) throw new Error('Flower offerings are not connected. Please try again in a moment.');
  if (!canLeaveFlower(memorialId)) throw new Error('Three flowers have already been offered today.');
  if (pendingFlowerOfferings.has(memorialId)) throw new Error('Your flower is still being offered.');
  pendingFlowerOfferings.add(memorialId);
  try {
    const result = await flowerDb.ref('flowers/' + memorialId).transaction(current => (current || 0) + 1);
    if (!result.committed) throw new Error('The flower was not saved. Please try again.');
    recordFlowerOffered(memorialId);
    return result.snapshot.val();
  } finally {
    pendingFlowerOfferings.delete(memorialId);
  }
}

function watchFlowers(memorialId, callback, onError = () => {}) {
  if (!flowerDb) { callback(0); return; }
  flowerDb.ref('flowers/' + memorialId).on('value', snap => {
    callback(snap.val() || 0);
  }, onError);
}

function unwatchFlowers(memorialId) {
  if (!flowerDb) return;
  flowerDb.ref('flowers/' + memorialId).off();
}

const ADDED_KEY = 'eternal-incense-added';
const HIDDEN_KEY = 'eternal-incense-hidden';
const PRAYER_KEY = 'eternal-incense-prayers';
const PRAYER_SEEDED_KEY = 'eternal-incense-prayers-seeded';

// Death day counts as day 1, so 49재 = death + 48 days, 백일 = death + 99 days
const RITUALS = [
  { key: '49day',  label: '49th Day',  korean: '사십구재', days: 48 },
  { key: '100day', label: '100th Day', korean: '백일',     days: 99 },
  { key: '1year',  label: '1 Year',    korean: '소상',     years: 1 },
  { key: '3year',  label: '3 Years',   korean: '대상',     years: 3 },
];

// ─── Permanent Memorial Data ───
// These are baked into the code. They cannot be lost.

const PERMANENT_MEMORIALS = [
  // People — most recent first
  { id: 'p-abdou',   name: 'Abdou Sarr',              deathDate: '2025-08-24', photo: 'images/abdou.png',  kind: 'person' },
  { id: 'p-jean',    name: 'Jean Compan',             deathDate: '2025-08-19', photo: 'images/jean.png',   kind: 'person' },
  { id: 'p-garth',   name: 'Garth Bond',              deathDate: '2025-07-09', photo: 'images/garth.png',  kind: 'person' },
  { id: 'p-mark',    name: 'Mark',                    deathDate: '2023-06-01', photo: 'images/mark.jpg',   kind: 'person' },
  { id: 'p-dad',     name: 'Dad',                      deathDate: '2022-09-22', photo: 'images/dad.jpg',    kind: 'person' },
  { id: 'p-duke',    name: 'Duke Howe',                deathDate: '2017-04-11', photo: 'images/duke.jpg',   kind: 'person' },
  { id: 'p-adam-shannon', name: 'Adam & Shannon',      deathDate: '2015-12-26', photo: 'images/adam-shannon.png', kind: 'person' },
  // Pets — most recent first
  { id: 'p-rhoda',   name: 'Rhoda Howe Rasmussen',    deathDate: '2026-02-26', photo: 'images/rhoda.jpg',  kind: 'pet' },
  { id: 'p-dae-dexi', name: 'Dae Dexi',                deathDate: '2026-09-18', photo: 'images/dexi-clean.png', kind: 'pet', weeklyRites: true, remembrance: 'Her long and happy life on this earth is complete. She has returned.' },
  { id: 'p-friday',  name: 'Friday',                  deathDate: '2025-06-13', photo: null,                kind: 'pet' },
  { id: 'p-bodi',    name: 'Bodi',                    deathDate: '2025-04-28', photo: 'images/bodi.jpg',   kind: 'pet' },
  { id: 'p-minnie',  name: 'Queen Minnie',            deathDate: '2024-08-26', photo: 'images/minnie.jpg', kind: 'pet' },
  { id: 'p-mateo',   name: 'Mateo Chomsisengphet',    deathDate: '2024-04-04', photo: null,                kind: 'pet', family: 'Chomsisengphet' },
  { id: 'p-bebe',    name: 'Bebe Chomsisengphet',    deathDate: null,         photo: 'images/bebe.jpg',   kind: 'pet', family: 'Chomsisengphet' },
  { id: 'p-louis',   name: 'Louis Chomsisengphet',   deathDate: null,         photo: 'images/louis.jpg',  kind: 'pet', family: 'Chomsisengphet' },
  { id: 'p-lola',    name: 'Lola Chomsisengphet',    deathDate: null,         photo: 'images/lola.png',   kind: 'pet', family: 'Chomsisengphet' },
  { id: 'p-harry',   name: 'Harry Ceballos',          deathDate: '2023-12-01', photo: 'images/harry.png',  kind: 'pet' },
];

const PERMANENT_PRAYERS = [
  { id: 'pp-1', category: 'Parents and especially sick parents', detail: "Mom's eyes" },
  { id: 'pp-2', category: 'Grieving Friends', detail: 'Sara, Magali' },
];

// Dae Dexi's early memorial observance includes a reminder every seven days
// before the established 49th-day rite. Other memorials retain the standard rites.
function getRitualsFor(memorial) {
  if (!memorial.weeklyRites) return RITUALS;
  const weekly = Array.from({ length: 6 }, (_, index) => ({
    key: `weekly-${index + 1}`,
    label: `${ordinal((index + 1) * 7)} Day`,
    korean: '칠일재',
    days: (index + 1) * 7 - 1,
  }));
  return [...weekly, ...RITUALS];
}

// Seven displayed observances use the same day-one-inclusive convention as 49재.
// weeklyRites still controls the established reminder/export schedule.
function getSevenDayObservances(memorial) {
  if (!memorial.deathDate) return [];
  return Array.from({ length: 7 }, (_, i) => ({
    key: i === 6 ? '49day' : `weekly-${i + 1}`,
    label: `${ordinal((i + 1) * 7)} Day`, korean: i === 6 ? '사십구재' : '칠일재',
    days: (i + 1) * 7 - 1,
  }));
}

// ─── Data Layer ───
// Permanent entries always show unless explicitly hidden.
// User-added entries live in localStorage alongside permanent ones.

function getHidden() {
  try { return JSON.parse(localStorage.getItem(HIDDEN_KEY)) || []; }
  catch { return []; }
}

function setHidden(ids) {
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(ids));
}

function getUserAdded() {
  try { return JSON.parse(localStorage.getItem(ADDED_KEY)) || []; }
  catch { return []; }
}

function setUserAdded(list) {
  localStorage.setItem(ADDED_KEY, JSON.stringify(list));
}

function loadMemorials() {
  const hidden = new Set(getHidden());
  const permanent = PERMANENT_MEMORIALS.filter(m => !hidden.has(m.id));
  const added = getUserAdded();
  return [...permanent, ...added];
}

function addMemorial(memorial) {
  const list = getUserAdded();
  list.push(memorial);
  setUserAdded(list);
}

function removeMemorial(id) {
  // If it's a permanent memorial, hide it
  if (PERMANENT_MEMORIALS.some(m => m.id === id)) {
    const hidden = getHidden();
    hidden.push(id);
    setHidden(hidden);
  } else {
    // Remove from user-added
    setUserAdded(getUserAdded().filter(m => m.id !== id));
  }
}

function loadPrayers() {
  // Seed permanent prayers once
  if (!localStorage.getItem(PRAYER_SEEDED_KEY)) {
    const existing = getPrayerStorage();
    if (existing.length === 0) {
      setPrayerStorage(PERMANENT_PRAYERS);
    }
    localStorage.setItem(PRAYER_SEEDED_KEY, '1');
  }
  return getPrayerStorage();
}

function getPrayerStorage() {
  try { return JSON.parse(localStorage.getItem(PRAYER_KEY)) || []; }
  catch { return []; }
}

function setPrayerStorage(prayers) {
  localStorage.setItem(PRAYER_KEY, JSON.stringify(prayers));
}

function savePrayers(prayers) {
  setPrayerStorage(prayers);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function createRemembranceHTML(memorial) {
  if (!memorial.remembrance) return '';
  return `<p class="dp-remembrance">${escapeHTML(memorial.remembrance)}</p>`;
}

// ─── Date Calculations ───

function getRitualDate(deathDate, ritual) {
  const d = new Date(deathDate + 'T00:00:00');
  if (ritual.days != null) {
    const result = new Date(d);
    result.setDate(result.getDate() + ritual.days);
    return result;
  }
  if (ritual.years) {
    const result = new Date(d);
    result.setFullYear(result.getFullYear() + ritual.years);
    return result;
  }
  return d;
}

function daysBetween(a, b) {
  const msPerDay = 86400000;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / msPerDay);
}

function daysSinceDeath(deathDate) {
  const d = new Date(deathDate + 'T00:00:00');
  return daysBetween(d, new Date());
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

function getNextAnnualMemorial(deathDate) {
  const d = new Date(deathDate + 'T00:00:00');
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate());
  if (daysBetween(now, thisYear) >= 0) return thisYear;
  return new Date(now.getFullYear() + 1, d.getMonth(), d.getDate());
}

function getRitualStatus(ritualDate) {
  const now = new Date();
  const diff = daysBetween(now, ritualDate);
  if (diff < 0) return 'past';
  if (diff <= 7) return 'imminent';
  return 'upcoming';
}

// ─── ICS Calendar Export ───

function pad2(n) { return n.toString().padStart(2, '0'); }

function icsDate(date) {
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
}

function icsNextDay(date) {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return icsDate(d);
}

function generateICS(memorialId = null, selectedRitual = null) {
  const memorials = loadMemorials().filter(m => (!memorialId || m.id === memorialId) && m.deathDate);
  const now = new Date();
  const events = [];

  memorials.forEach(m => {
    // Ritual dates
    (selectedRitual ? (selectedRitual.key === 'annual' ? [] : [selectedRitual]) : getRitualsFor(m)).forEach(r => {
      const rDate = getRitualDate(m.deathDate, r);
      const diff = daysBetween(now, rDate);
      if (diff >= 0 || selectedRitual) {
        events.push({
          summary: `${r.korean} — ${m.name}`,
          description: `${r.label} memorial (${r.korean}) for ${m.name}.\nPassing: ${m.deathDate}`,
          date: rDate,
          uid: `${m.id}-${r.key}@eternal-incense`,
        });
      }
    });

    // Annual memorial (기일) for next 10 years
    const d = new Date(m.deathDate + 'T00:00:00');
    if (!selectedRitual || selectedRitual.key === 'annual') for (let y = now.getFullYear(); y <= now.getFullYear() + 10; y++) {
      const annual = new Date(y, d.getMonth(), d.getDate());
      if (daysBetween(now, annual) >= 0 && (!selectedRitual || y === getNextAnnualMemorial(m.deathDate).getFullYear())) {
        events.push({
          summary: `기일 — ${m.name}`,
          description: `Annual memorial (기일) for ${m.name}.\nPassing: ${m.deathDate}`,
          date: annual,
          uid: `${m.id}-annual-${y}@eternal-incense`,
        });
      }
    }
  });

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Eternal Incense//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Eternal Incense — Memorial Rites',
  ];

  events.forEach(e => {
    ics.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `DTSTART;VALUE=DATE:${icsDate(e.date)}`,
      `DTEND;VALUE=DATE:${icsNextDay(e.date)}`,
      `SUMMARY:${escapeICS(e.summary)}`,
      `DESCRIPTION:${escapeICS(e.description)}`,
      // Reminder: 7 days before
      'BEGIN:VALARM',
      'TRIGGER:-P7D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeICS("7 days until " + e.summary)}`,
      'END:VALARM',
      // Reminder: 1 day before
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeICS("Tomorrow: " + e.summary)}`,
      'END:VALARM',
      // Reminder: day of
      'BEGIN:VALARM',
      'TRIGGER:PT0S',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeICS("Today: " + e.summary)}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  ics.push('END:VCALENDAR');
  return ics.map(foldICSLine).join('\r\n') + '\r\n';
}

function downloadICS(memorialId = null, selectedRitual = null) {
  const content = generateICS(memorialId, selectedRitual);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'eternal-incense-rituals.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Presentation helpers ───

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function escapeICS(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function foldICSLine(line) {
  const encoder = new TextEncoder();
  let result = '', bytes = 0;
  for (const char of line) {
    const length = encoder.encode(char).length;
    if (bytes + length > 75) { result += '\r\n '; bytes = 1; }
    result += char;
    bytes += length;
  }
  return result;
}

function localDateString(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function ordinal(n) {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  return `${n}${suffix}`;
}

function shortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function photoSource(m) {
  const src = m.photo || 'images/chrysanthemum.jpg';
  return /^(images\/|data:image\/|https?:\/\/|blob:)/i.test(src) ? src : 'images/chrysanthemum.jpg';
}

function photoHTML(m, large = false) {
  return `<span class="wood-frame${large ? ' large-frame' : ''}"><span class="photo-mat"><img src="${escapeHTML(photoSource(m))}" alt="${escapeHTML(m.photo ? m.name : `White chrysanthemum in remembrance of ${m.name}`)}" ${large ? 'fetchpriority="high"' : 'loading="lazy"'}></span></span>`;
}

// Incense remains separate from the environment. The smoke is slow animated linework.
function createSmokeHTML() {
  return `<div class="incense-object" role="img" aria-label="Three incense sticks burning quietly in a ceramic bowl">
    <svg class="incense-smoke" viewBox="0 0 180 300" fill="none" aria-hidden="true">
      <g class="smoke-thread smoke-a"><path pathLength="100" d="M70 300 C64 268 96 259 77 229 S51 182 79 149 S101 100 72 67 S82 22 77 0"/><path pathLength="100" d="M71 300 C77 266 58 252 82 218 S103 175 78 148 S59 91 87 61 S69 23 83 0"/></g>
      <g class="smoke-thread smoke-b"><path pathLength="100" d="M90 300 C102 268 73 250 88 222 S111 177 90 146 S64 99 88 70 S103 28 88 0"/><path pathLength="100" d="M91 300 C85 271 105 246 92 218 S74 174 96 143 S111 93 89 56 S98 19 94 0"/></g>
      <g class="smoke-thread smoke-c"><path pathLength="100" d="M110 300 C106 263 126 252 109 225 S83 177 110 145 S127 92 109 62 S116 21 109 0"/></g>
    </svg>
    <span class="incense-stick stick-one"></span><span class="incense-stick stick-two"></span><span class="incense-stick stick-three"></span>
    <img class="ceramic-bowl" src="images/environment/ceramic-bowl.webp" alt="" aria-hidden="true">
  </div>`;
}

function getMemorialOrder() {
  return loadMemorials().sort((a, b) => (b.deathDate || '').localeCompare(a.deathDate || ''));
}

function getNeighbors(id) {
  const all = getMemorialOrder();
  const i = all.findIndex(m => m.id === id);
  if (i < 0 || all.length < 2) return { prev: null, next: null };
  return { prev: all[(i - 1 + all.length) % all.length], next: all[(i + 1) % all.length] };
}

function getUpcomingObservances() {
  const upcoming = [];
  loadMemorials().forEach(m => {
    if (!m.deathDate) return;
    getRitualsFor(m).forEach(r => {
      const date = getRitualDate(m.deathDate, r);
      const diff = daysBetween(new Date(), date);
      if (diff >= 0) upcoming.push({ m, r, date, diff });
    });
    const date = getNextAnnualMemorial(m.deathDate);
    // Year-one and year-three anniversaries are already represented by their rites.
    if (!upcoming.some(o => o.m.id === m.id && localDateString(o.date) === localDateString(date))) {
      upcoming.push({ m, r: { key: 'annual', label: 'Annual memorial', korean: '기일' }, date, diff: daysBetween(new Date(), date) });
    }
  });
  return upcoming.sort((a, b) => a.date - b.date);
}

function ritualButton(m, r, date, showName = false, next = false) {
  const diff = daysBetween(new Date(), date);
  return `<button class="observance${diff < 0 ? ' past' : ''}${next ? ' next-observance' : ''}${diff === 0 ? ' today' : ''}" data-observance="${escapeHTML(r.key)}" data-memorial="${escapeHTML(m.id)}" aria-label="${escapeHTML(m.name)}, ${escapeHTML(r.label)}, ${formatDate(date)}${diff === 0 ? ', today' : ''}. Calendar options" aria-haspopup="dialog">
    <time datetime="${localDateString(date)}">${shortDate(date)}</time>
    ${showName ? `<span class="observance-name">${escapeHTML(m.name)}</span>` : ''}
    <span class="observance-day">${r.label.toLowerCase()}${diff === 0 ? ' · today' : ''}</span>
  </button>`;
}

function renderObservancesHTML(m) {
  const rites = getSevenDayObservances(m);
  if (!rites.length) return '<p class="unknown-date">Date of passing not recorded</p>';
  const next = rites.find(r => daysBetween(new Date(), getRitualDate(m.deathDate, r)) >= 0);
  return `<section class="individual-observances" aria-label="Seven memorial observances"><div class="observance-list">${rites.map(r => ritualButton(m, r, getRitualDate(m.deathDate, r), false, r === next)).join('')}</div></section>`;
}

function renderMemorials() {
  const memorials = getMemorialOrder();
  const shelf = document.getElementById('memorials');
  shelf.innerHTML = memorials.length ? memorials.map(m => `<a class="memorial-portrait" href="#${encodeURIComponent(m.id)}" data-id="${escapeHTML(m.id)}" aria-label="Visit ${escapeHTML(m.name)}'s memorial">${photoHTML(m)}<span class="memorial-name">${escapeHTML(m.name)}</span></a>`).join('') : '<p class="empty-shelf">No memorials are visible. <button class="text-button" data-open-care>Tend this space</button></p>';
  updateShelfEdges();
}

function updateShelfEdges() {
  const shelf = document.getElementById('memorials');
  document.querySelector('.shelf-prev').disabled = shelf.scrollLeft <= 2;
  document.querySelector('.shelf-next').disabled = shelf.scrollLeft + shelf.clientWidth >= shelf.scrollWidth - 2;
}

function renderNextCeremony() {
  const upcoming = getUpcomingObservances().slice(0, 9);
  document.getElementById('next-ceremony').innerHTML = `<h2>Upcoming Observances</h2><div class="observance-list">${upcoming.length ? upcoming.map((o, i) => ritualButton(o.m, o.r, o.date, true, i === 0)).join('') : '<p class="muted">No upcoming observances.</p>'}</div>`;
}

function renderPrayers() {
  const prayers = loadPrayers();
  document.getElementById('prayer-list').innerHTML = prayers.length ? prayers.map(p => `<div class="prayer-item"><div><p class="prayer-category">${escapeHTML(p.category)}</p>${p.detail ? `<p class="prayer-detail">${escapeHTML(p.detail)}</p>` : ''}</div><button class="prayer-remove" data-prayer-delete="${escapeHTML(p.id)}" aria-label="Remove intention: ${escapeHTML(p.category)}">×</button></div>`).join('') : '<p class="muted">No prayer intentions yet.</p>';
}

function renderManagement() {
  document.getElementById('management-list').innerHTML = getMemorialOrder().map(m => `<div class="management-row"><a href="#${encodeURIComponent(m.id)}" data-close>${escapeHTML(m.name)}</a><button class="text-button" data-delete="${escapeHTML(m.id)}" aria-label="${PERMANENT_MEMORIALS.some(p => p.id === m.id) ? 'Hide' : 'Remove'} ${escapeHTML(m.name)}">${PERMANENT_MEMORIALS.some(p => p.id === m.id) ? 'Hide' : 'Remove'}</button></div>`).join('');
  const hidden = new Set(getHidden());
  document.getElementById('hidden-list').innerHTML = PERMANENT_MEMORIALS.filter(m => hidden.has(m.id)).map(m => `<div class="management-row"><span>${escapeHTML(m.name)}</span><button class="text-button" data-restore="${escapeHTML(m.id)}">Restore</button></div>`).join('') || '<p class="muted">No hidden memorials.</p>';
}

function render() {
  renderMemorials();
  renderNextCeremony();
  renderPrayers();
  renderManagement();
}

let activeMemorialId = null;
let lastHallFocus = null;

function renderDetailPage(id) {
  const m = loadMemorials().find(m => m.id === id);
  if (!m) { history.replaceState(null, '', location.pathname + location.search); renderMainView(); return; }
  const page = document.getElementById('detail-page');
  if (activeMemorialId) unwatchFlowers(activeMemorialId);
  activeMemorialId = m.id;
  document.getElementById('hall').classList.add('hidden');
  page.classList.remove('hidden');
  document.body.classList.add('view-memorial');
  document.title = `${m.name} — Eternal Incense`;
  const { prev, next } = getNeighbors(m.id);
  page.innerHTML = `<div class="room-stage" aria-hidden="true"></div>
    <a class="dp-back text-button" href="#">← Eternal Incense</a>
    <figure class="individual-portrait">${photoHTML(m, true)}<figcaption><h1 id="memorial-name" tabindex="-1">${escapeHTML(m.name)}</h1>${m.deathDate ? `<p class="memorial-date"><time datetime="${m.deathDate}">${formatDate(new Date(m.deathDate + 'T00:00:00'))}</time></p>` : ''}</figcaption></figure>
    <div class="individual-incense">${createSmokeHTML()}</div>
    <div id="laid-flowers" class="laid-flowers" aria-hidden="true"></div>
    <div class="memorial-actions"><button class="text-button" id="flower-btn">Leave a flower</button><span id="flower-display" role="status"></span><button class="text-button" id="remembrance-open" aria-haspopup="dialog">Remembrance & rites</button></div>
    ${renderObservancesHTML(m)}
    <nav class="memorial-neighbors" aria-label="Other memorials">${prev ? `<a class="dp-nav dp-nav-prev" href="#${encodeURIComponent(prev.id)}" aria-label="Previous memorial: ${escapeHTML(prev.name)}"><span aria-hidden="true">←</span><span>${escapeHTML(prev.name)}</span></a>` : ''}${next ? `<a class="dp-nav dp-nav-next" href="#${encodeURIComponent(next.id)}" aria-label="Next memorial: ${escapeHTML(next.name)}"><span>${escapeHTML(next.name)}</span><span aria-hidden="true">→</span></a>` : ''}</nav>`;
  const flowerBtn = document.getElementById('flower-btn');
  const flowerDisplay = document.getElementById('flower-display');
  const laidFlowers = document.getElementById('laid-flowers');
  let offeredHere = false;
  let shownCount = 0;
  function refreshFlowerButton() {
    const left = Math.max(0, 3 - getDailyFlowerCount(m.id));
    const pending = pendingFlowerOfferings.has(m.id);
    flowerBtn.disabled = left === 0 || pending;
    flowerBtn.textContent = pending ? 'Offering…' : left ? (offeredHere ? 'Offer another flower' : 'Leave a flower') : 'Flowers offered today';
    flowerBtn.setAttribute('aria-label', left ? `Leave a flower for ${m.name}. ${left} remaining today.` : `Three flowers offered for ${m.name} today`);
  }
  function showFlowers(count) {
    shownCount = count;
    const visible = Math.min(Math.max(0, count), 3);
    laidFlowers.innerHTML = Array.from({ length: visible }, (_, i) => `<img class="laid-flower flower-${i}" src="images/environment/offered-flower.webp" alt="">`).join('');
    flowerDisplay.textContent = offeredHere ? `Flower offered · ${count} in remembrance` : count ? `${count} flower${count === 1 ? '' : 's'} offered` : '';
  }
  refreshFlowerButton();
  flowerBtn.addEventListener('click', async () => {
    flowerBtn.disabled = true;
    flowerBtn.textContent = 'Offering…';
    flowerBtn.setAttribute('aria-busy', 'true');
    flowerDisplay.textContent = 'Placing your flower…';
    const slowNotice = setTimeout(() => { flowerDisplay.textContent = 'Still saving your flower. Please keep this page open.'; }, 8000);
    try {
      const count = await leaveFlower(m.id);
      offeredHere = true;
      showFlowers(count);
      laidFlowers.classList.remove('just-offered');
      void laidFlowers.offsetWidth;
      laidFlowers.classList.add('just-offered');
      announce(`A flower offered for ${m.name}. ${3 - getDailyFlowerCount(m.id)} remaining today.`);
    } catch (e) {
      showFlowers(shownCount);
      flowerDisplay.textContent = e.message;
    } finally {
      clearTimeout(slowNotice);
      flowerBtn.removeAttribute('aria-busy');
      refreshFlowerButton();
      if (activeMemorialId === m.id && !flowerBtn.isConnected) renderDetailPage(m.id);
    }
  });
  watchFlowers(m.id, count => {
    if (activeMemorialId !== m.id) return;
    // Firebase emits optimistic transaction events; show a saved confirmation only after commit.
    if (!pendingFlowerOfferings.has(m.id)) showFlowers(count);
  }, () => { flowerDisplay.textContent = 'Flower offerings could not be loaded. Please reconnect and try again.'; });
  document.getElementById('remembrance-open').addEventListener('click', () => openRemembrance(m));
  document.getElementById('memorial-name').focus({ preventScroll: true });
}

function renderMainView() {
  if (activeMemorialId) unwatchFlowers(activeMemorialId);
  activeMemorialId = null;
  document.getElementById('hall').classList.remove('hidden');
  document.getElementById('detail-page').classList.add('hidden');
  document.body.classList.remove('view-memorial');
  document.title = 'Eternal Incense';
  render();
  if (lastHallFocus) document.querySelector(`[data-id="${CSS.escape(lastHallFocus)}"]`)?.focus({ preventScroll: true });
}

function handleRouting() {
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  let hash;
  try { hash = decodeURIComponent(location.hash.slice(1)); } catch { hash = ''; }
  if (hash) renderDetailPage(hash); else renderMainView();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function announce(message) { document.getElementById('status-message').textContent = message; }
function openDialog(id) { document.getElementById(id).showModal(); }

function findRitual(m, key) {
  if (key === 'annual') return { key: 'annual', label: 'Annual memorial', korean: '기일' };
  return [...getSevenDayObservances(m), ...getRitualsFor(m)].find(r => r.key === key);
}

function openObservance(id, key) {
  const m = loadMemorials().find(m => m.id === id);
  if (!m?.deathDate) return;
  const r = findRitual(m, key);
  if (!r) return;
  const date = key === 'annual' ? getNextAnnualMemorial(m.deathDate) : getRitualDate(m.deathDate, r);
  document.getElementById('observance-body').innerHTML = `<h2 id="observance-title">${escapeHTML(r.label)}</h2><p class="ritual-korean" lang="ko">${r.korean}</p><p class="observance-full-date">${formatDate(date)}</p><a class="observance-memorial-link" href="#${encodeURIComponent(m.id)}" data-close>${escapeHTML(m.name)}</a><button class="btn-primary" id="export-observance">Add to calendar</button><button class="text-button" id="export-memorial">All observances for ${escapeHTML(m.name)}</button>`;
  document.getElementById('export-observance').addEventListener('click', () => downloadICS(m.id, r));
  document.getElementById('export-memorial').addEventListener('click', () => downloadICS(m.id));
  openDialog('observance-dialog');
}

function openRemembrance(m) {
  const family = m.family ? loadMemorials().filter(other => other.family === m.family && other.id !== m.id) : [];
  const rites = m.deathDate ? [...RITUALS.slice(1), { key: 'annual', label: 'Annual memorial', korean: '기일' }] : [];
  document.getElementById('remembrance-body').innerHTML = `<h2 id="remembrance-heading">${escapeHTML(m.name)}</h2>${m.remembrance ? `<p class="remembrance-text">${escapeHTML(m.remembrance)}</p>` : ''}${m.deathDate ? `<p class="muted">${formatDate(new Date(m.deathDate + 'T00:00:00'))}</p>` : '<p class="muted">Date of passing not recorded.</p>'}${rites.length ? `<h3>Further observances</h3><div class="further-rites">${rites.map(r => ritualButton(m, r, r.key === 'annual' ? getNextAnnualMemorial(m.deathDate) : getRitualDate(m.deathDate, r))).join('')}</div><button class="text-button" id="memorial-calendar">Add observances to calendar</button>` : ''}${family.length ? `<h3>${escapeHTML(m.family)} family</h3><div class="family-links">${family.map(other => `<a href="#${encodeURIComponent(other.id)}" data-close>${escapeHTML(other.name)}</a>`).join('')}</div>` : ''}`;
  document.getElementById('memorial-calendar')?.addEventListener('click', () => downloadICS(m.id));
  openDialog('remembrance-drawer');
}

// ─── Existing storage and interactions ───
function init() {
  initFirebase();
  const oldKey = 'eternal-incense-memorials';
  const oldData = localStorage.getItem(oldKey);
  if (oldData) {
    try {
      const old = JSON.parse(oldData);
      const permanentIds = new Set(PERMANENT_MEMORIALS.map(m => m.id));
      const existing = getUserAdded();
      const existingIds = new Set(existing.map(m => m.id));
      const migrated = old.filter(m => !m.id.startsWith('seed-') && !permanentIds.has(m.id) && !existingIds.has(m.id));
      setUserAdded([...existing, ...migrated]);
      localStorage.removeItem(oldKey);
      localStorage.removeItem('eternal-incense-seeded');
    } catch (e) { console.warn('Existing memorial data could not be migrated; it has been retained.', e); }
  }

  document.getElementById('shared-incense').innerHTML = createSmokeHTML();
  document.getElementById('prayer-open').addEventListener('click', () => openDialog('prayer-drawer'));
  document.getElementById('care-open').addEventListener('click', () => { renderManagement(); openDialog('care-drawer'); });
  document.getElementById('calendar-btn').addEventListener('click', () => downloadICS());
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', e => { if (e.target === dialog) { const rect = dialog.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close(); } });
  });
  document.addEventListener('click', e => {
    const close = e.target.closest('[data-close]');
    if (close) close.closest('dialog')?.close();
    if (e.target.closest('.skip-link')) {
      e.preventDefault();
      (activeMemorialId ? document.getElementById('memorial-name') : document.getElementById('memorials')).focus();
    }
    const observance = e.target.closest('[data-observance]');
    if (observance) openObservance(observance.dataset.memorial, observance.dataset.observance);
    const portrait = e.target.closest('.memorial-portrait');
    if (portrait) lastHallFocus = portrait.dataset.id;
    if (e.target.closest('[data-open-care]')) openDialog('care-drawer');
    const remove = e.target.closest('[data-delete]');
    if (remove) {
      const m = loadMemorials().find(m => m.id === remove.dataset.delete);
      if (m && confirm(`Remove memorial for ${m.name}?`)) { removeMemorial(m.id); render(); if (activeMemorialId === m.id) location.hash = ''; }
    }
    const restore = e.target.closest('[data-restore]');
    if (restore) { setHidden(getHidden().filter(id => id !== restore.dataset.restore)); render(); }
  });

  const shelf = document.getElementById('memorials');
  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelector('.shelf-prev').addEventListener('click', () => shelf.scrollBy({ left: -shelf.clientWidth * .8, behavior: reducedMotion() ? 'instant' : 'smooth' }));
  document.querySelector('.shelf-next').addEventListener('click', () => shelf.scrollBy({ left: shelf.clientWidth * .8, behavior: reducedMotion() ? 'instant' : 'smooth' }));
  shelf.addEventListener('scroll', updateShelfEdges, { passive: true });
  window.addEventListener('resize', updateShelfEdges);
  shelf.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const links = [...shelf.querySelectorAll('a')];
    const index = links.indexOf(document.activeElement);
    links[Math.max(0, Math.min(links.length - 1, index + (e.key === 'ArrowRight' ? 1 : -1)))]?.focus();
  });

  const prayerForm = document.getElementById('prayer-form-container');
  const addPrayer = document.getElementById('add-prayer-btn');
  addPrayer.addEventListener('click', () => { prayerForm.classList.remove('hidden'); addPrayer.classList.add('hidden'); document.getElementById('prayer-category').focus(); });
  function closePrayerForm() { prayerForm.classList.add('hidden'); addPrayer.classList.remove('hidden'); prayerForm.reset(); addPrayer.focus(); }
  document.getElementById('prayer-cancel').addEventListener('click', closePrayerForm);
  prayerForm.addEventListener('submit', e => {
    e.preventDefault();
    const category = document.getElementById('prayer-category').value.trim();
    if (!category) return;
    savePrayers([...loadPrayers(), { id: generateId(), category, detail: document.getElementById('prayer-detail').value.trim() }]);
    renderPrayers(); closePrayerForm();
  });
  document.getElementById('prayer-list').addEventListener('click', e => {
    const button = e.target.closest('[data-prayer-delete]');
    if (button) { savePrayers(loadPrayers().filter(p => p.id !== button.dataset.prayerDelete)); renderPrayers(); addPrayer.focus(); }
  });

  const modal = document.getElementById('modal');
  const form = document.getElementById('memorial-form');
  const photoInput = document.getElementById('input-photo');
  const preview = document.getElementById('photo-preview');
  document.getElementById('add-btn').addEventListener('click', () => {
    document.getElementById('care-drawer').close(); form.reset(); preview.classList.add('hidden'); preview.removeAttribute('src'); document.getElementById('form-error').textContent = ''; openDialog('modal');
  });
  document.getElementById('cancel-btn').addEventListener('click', () => modal.close());
  photoInput.addEventListener('change', e => {
    const file = e.target.files[0];
    preview.classList.add('hidden');
    document.getElementById('form-error').textContent = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(1, 600 / img.width, 450 / img.height);
        canvas.width = Math.round(img.width * ratio); canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        preview.src = canvas.toDataURL('image/jpeg', .85); preview.classList.remove('hidden');
      };
      img.onerror = () => { document.getElementById('form-error').textContent = 'This photograph could not be opened. Choose another image.'; };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('input-name').value.trim();
    const deathDate = document.getElementById('input-date').value;
    if (!name || !deathDate) return;
    try {
      addMemorial({ id: generateId(), name, deathDate, photo: preview.classList.contains('hidden') ? null : preview.src });
      modal.close(); render(); announce(`Memorial added for ${name}.`);
    } catch { document.getElementById('form-error').textContent = 'There is not enough storage to save this memorial. Try a smaller photograph.'; }
  });

  document.addEventListener('keydown', e => {
    if (!activeMemorialId || document.querySelector('dialog[open]') || e.target.closest('input, textarea, select, button, a, [contenteditable]') || e.altKey || e.ctrlKey || e.metaKey) return;
    const { prev, next } = getNeighbors(activeMemorialId);
    if (e.key === 'ArrowLeft' && prev) location.hash = prev.id;
    if (e.key === 'ArrowRight' && next) location.hash = next.id;
    if (e.key === 'Escape') location.hash = '';
  });
  let touchStart = null;
  const page = document.getElementById('detail-page');
  page.addEventListener('touchstart', e => {
    if (e.target.closest('button, a, .observance-list, dialog')) { touchStart = null; return; }
    touchStart = [e.touches[0].clientX, e.touches[0].clientY];
  }, { passive: true });
  page.addEventListener('touchend', e => {
    if (!touchStart || !activeMemorialId) return;
    const dx = e.changedTouches[0].clientX - touchStart[0], dy = e.changedTouches[0].clientY - touchStart[1];
    touchStart = null;
    if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx)) return;
    const { prev, next } = getNeighbors(activeMemorialId);
    if (dx > 0 && prev) location.hash = prev.id;
    if (dx < 0 && next) location.hash = next.id;
  }, { passive: true });
  render(); handleRouting();
  window.addEventListener('hashchange', handleRouting);
  // A space left open overnight should follow the actual ritual day.
  let currentDay = new Date().toDateString();
  function refreshDay() {
    if (currentDay === new Date().toDateString()) return;
    currentDay = new Date().toDateString();
    renderNextCeremony();
    if (activeMemorialId && !document.querySelector('dialog[open]')) renderDetailPage(activeMemorialId);
  }
  setInterval(refreshDay, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDay(); });
}

document.addEventListener('DOMContentLoaded', init);
