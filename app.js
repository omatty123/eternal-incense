/* ═══════════════════════════════════════════
   Eternal Incense — 영원한 향
   Memorial ritual calculator & incense shrine
   ═══════════════════════════════════════════ */

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
  { id: 'p-dad',     name: 'Dad',                     deathDate: '2022-09-22', photo: 'images/dad.jpg' },
  { id: 'p-mark',    name: 'Mark',                    deathDate: '2023-06-01', photo: 'images/mark.jpg' },
  { id: 'p-harry',   name: 'Harry Ceballos',          deathDate: '2023-12-01', photo: 'images/harry.png' },
  { id: 'p-mateo',   name: 'Mateo Chomsisengphet',    deathDate: '2024-04-04', photo: null },
  { id: 'p-minnie',  name: 'Queen Minnie',            deathDate: '2024-08-26', photo: 'images/minnie.jpg' },
  { id: 'p-bodi',    name: 'Bodi',                    deathDate: '2025-04-28', photo: 'images/bodi.jpg' },
  { id: 'p-friday',  name: 'Friday',                  deathDate: '2025-06-13', photo: null },
  { id: 'p-garth',   name: 'Garth Bond',              deathDate: '2025-07-09', photo: 'images/garth.png' },
  { id: 'p-jean',    name: 'Jean Compan',             deathDate: '2025-08-19', photo: 'images/jean.png' },
  { id: 'p-abdou',   name: 'Abdou Sarr',              deathDate: '2025-08-24', photo: 'images/abdou.png' },
  { id: 'p-rhoda',   name: 'Rhoda Howe Rasmussen',    deathDate: '2026-02-26', photo: 'images/rhoda.jpg' },
];

const PERMANENT_PRAYERS = [
  { id: 'pp-1', category: 'Parents and especially sick parents', detail: "Mom's eyes" },
  { id: 'pp-2', category: 'Grieving Friends', detail: 'Sara, Magali' },
];

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
  if (thisYear > now) return thisYear;
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

function generateICS() {
  const memorials = loadMemorials();
  const now = new Date();
  const events = [];

  memorials.forEach(m => {
    // Ritual dates
    RITUALS.forEach(r => {
      const rDate = getRitualDate(m.deathDate, r);
      const diff = daysBetween(now, rDate);
      if (diff >= 0) {
        events.push({
          summary: `${r.korean} — ${m.name}`,
          description: `${r.label} memorial (${r.korean}) for ${m.name}.\\nPassing: ${m.deathDate}`,
          date: rDate,
          uid: `${m.id}-${r.key}@eternal-incense`,
        });
      }
    });

    // Annual memorial (기일) for next 10 years
    const d = new Date(m.deathDate + 'T00:00:00');
    for (let y = now.getFullYear(); y <= now.getFullYear() + 10; y++) {
      const annual = new Date(y, d.getMonth(), d.getDate());
      if (annual > now) {
        events.push({
          summary: `기일 — ${m.name}`,
          description: `Annual memorial (기일) for ${m.name}.\\nPassing: ${m.deathDate}`,
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
      `DTSTART;VALUE=DATE:${icsDate(e.date)}`,
      `DTEND;VALUE=DATE:${icsNextDay(e.date)}`,
      `SUMMARY:${e.summary}`,
      `DESCRIPTION:${e.description}`,
      // Reminder: 7 days before
      'BEGIN:VALARM',
      'TRIGGER:-P7D',
      'ACTION:DISPLAY',
      `DESCRIPTION:7 days until ${e.summary}`,
      'END:VALARM',
      // Reminder: 1 day before
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Tomorrow: ${e.summary}`,
      'END:VALARM',
      // Reminder: day of
      'BEGIN:VALARM',
      'TRIGGER:PT0S',
      'ACTION:DISPLAY',
      `DESCRIPTION:Today: ${e.summary}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

function downloadICS() {
  const content = generateICS();
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

// ─── Smoke HTML ───

function createSmokeHTML(stickCount = 3) {
  let html = '<div class="incense-container">';
  html += '<div class="smoke-container">';
  for (let i = 0; i < 8; i++) {
    const duration = 3 + Math.random() * 3;
    const delay = Math.random() * 3;
    const drift1 = (Math.random() - 0.5) * 12;
    const drift2 = (Math.random() - 0.5) * 14;
    const drift3 = (Math.random() - 0.5) * 10;
    const drift4 = (Math.random() - 0.5) * 8;
    html += `<div class="smoke" style="
      --duration: ${duration}s;
      --delay: ${delay}s;
      --drift1: ${drift1}px;
      --drift2: ${drift2}px;
      --drift3: ${drift3}px;
      --drift4: ${drift4}px;
    "></div>`;
  }
  html += '</div>';
  for (let i = 0; i < stickCount; i++) {
    html += '<div class="incense-stick"></div>';
  }
  html += '</div>';
  return html;
}

// ─── Render Prayers ───

function renderPrayers() {
  const prayers = loadPrayers();
  const list = document.getElementById('prayer-list');

  if (prayers.length === 0) {
    list.innerHTML = '<div class="empty-state" style="padding:0.5rem 0"><p style="font-size:0.85rem">No prayer intentions yet.</p></div>';
    return;
  }

  list.innerHTML = prayers.map(p => `
    <div class="prayer-item">
      <span class="prayer-category">${escapeHTML(p.category)}</span>
      ${p.detail ? `<span class="prayer-detail">${escapeHTML(p.detail)}</span>` : ''}
      <button class="prayer-remove" data-prayer-delete="${p.id}" title="Remove">&times;</button>
    </div>
  `).join('');
}

// ─── Render Memorials ───

function renderMemorials() {
  const memorials = loadMemorials();
  const grid = document.getElementById('memorials');
  const alerts = document.getElementById('alerts');

  // Upcoming ritual alerts
  const upcoming = [];
  memorials.forEach(m => {
    RITUALS.forEach(r => {
      const rDate = getRitualDate(m.deathDate, r);
      const status = getRitualStatus(rDate);
      if (status === 'imminent') {
        const diff = daysBetween(new Date(), rDate);
        upcoming.push({ name: m.name, ritual: r.label, korean: r.korean, date: formatDate(rDate), days: diff });
      }
    });
  });

  alerts.innerHTML = upcoming.map(u =>
    `<div class="alert">
      <strong>${escapeHTML(u.name)}</strong> ${u.ritual} (${u.korean}) is ${u.days === 0 ? 'today' : `in ${u.days} day${u.days === 1 ? '' : 's'}`} (${u.date})
    </div>`
  ).join('');

  if (memorials.length === 0) {
    grid.innerHTML = `<div class="empty-state"><p>No memorials yet.</p><p>Add a loved one to begin their perpetual incense.</p></div>`;
    return;
  }

  grid.innerHTML = memorials.map(m => {
    const photoHTML = m.photo
      ? `<img class="card-photo" src="${m.photo}" alt="${escapeHTML(m.name)}">`
      : `<div class="card-photo-placeholder">
           <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8">
             <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
             <circle cx="12" cy="7" r="4"></circle>
           </svg>
         </div>`;

    const ritualBadges = RITUALS.map(r => {
      const rDate = getRitualDate(m.deathDate, r);
      const status = getRitualStatus(rDate);
      return `<span class="ritual-badge ${status}">${r.label}</span>`;
    }).join('');

    const d = new Date(m.deathDate + 'T00:00:00');

    return `
      <div class="memorial-card" data-id="${m.id}">
        <div class="card-actions">
          <button class="btn-delete" data-delete="${m.id}" title="Remove memorial">&times;</button>
        </div>
        ${photoHTML}
        <div class="card-body">
          ${createSmokeHTML(3)}
          <div class="card-name">${escapeHTML(m.name)}</div>
          <div class="card-date">${formatDate(d)}</div>
          <div class="ritual-row">${ritualBadges}</div>
        </div>
      </div>
    `;
  }).join('');
}

function render() {
  renderPrayers();
  renderMemorials();
}

// ─── Detail View ───

function showDetail(id) {
  const memorials = loadMemorials();
  const m = memorials.find(x => x.id === id);
  if (!m) return;

  const modal = document.getElementById('detail-modal');
  const body = document.getElementById('detail-body');
  const d = new Date(m.deathDate + 'T00:00:00');
  const days = daysSinceDeath(m.deathDate);

  const photoHTML = m.photo
    ? `<img class="detail-photo" src="${m.photo}" alt="${escapeHTML(m.name)}">`
    : '';

  const ritualItems = RITUALS.map(r => {
    const rDate = getRitualDate(m.deathDate, r);
    const status = getRitualStatus(rDate);
    const diff = daysBetween(new Date(), rDate);
    let countdown = '';
    if (status === 'past') {
      countdown = `<div class="ritual-passed">Observed</div>`;
    } else if (diff === 0) {
      countdown = `<div class="ritual-countdown">Today</div>`;
    } else {
      countdown = `<div class="ritual-countdown">${diff} day${diff === 1 ? '' : 's'} from now</div>`;
    }
    return `
      <div class="ritual-item">
        <div class="ritual-marker ${status}"></div>
        <div class="ritual-info">
          <div class="ritual-label">${r.label}<span class="ritual-label-kr">${r.korean}</span></div>
          <div class="ritual-date-line">${formatDate(rDate)}</div>
          ${countdown}
        </div>
      </div>
    `;
  }).join('');

  const nextAnnual = getNextAnnualMemorial(m.deathDate);
  const annualDiff = daysBetween(new Date(), nextAnnual);

  body.innerHTML = `
    ${photoHTML}
    <div class="detail-name">${escapeHTML(m.name)}</div>
    <div class="detail-date">${formatDate(d)}</div>
    <div class="detail-days">${days} days since passing</div>
    <div class="detail-incense">${createSmokeHTML(5)}</div>
    <div class="ritual-timeline">
      <h3>Memorial Rites</h3>
      ${ritualItems}
    </div>
    <div class="annual-section">
      <h3>Annual Memorial (기일)</h3>
      <div class="annual-date">${formatDate(nextAnnual)}</div>
      <div class="annual-countdown">${annualDiff === 0 ? 'Today' : `${annualDiff} day${annualDiff === 1 ? '' : 's'} away`}</div>
    </div>
  `;

  modal.classList.remove('hidden');
}

// ─── Helpers ───

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── Init ───

function init() {
  // Migrate old localStorage format if present
  const oldKey = 'eternal-incense-memorials';
  const oldData = localStorage.getItem(oldKey);
  if (oldData) {
    try {
      const old = JSON.parse(oldData);
      // Move any non-seed entries to user-added
      const seedIds = new Set(PERMANENT_MEMORIALS.map(m => m.id));
      const oldSeedIds = new Set(old.filter(m => m.id.startsWith('seed-')).map(m => m.id));
      const userEntries = old.filter(m => !m.id.startsWith('seed-') && !seedIds.has(m.id));
      if (userEntries.length > 0) setUserAdded(userEntries);
    } catch {}
    localStorage.removeItem(oldKey);
    localStorage.removeItem('eternal-incense-seeded');
  }

  const addBtn = document.getElementById('add-btn');
  const calBtn = document.getElementById('calendar-btn');
  const modal = document.getElementById('modal');
  const detailModal = document.getElementById('detail-modal');
  const form = document.getElementById('memorial-form');
  const cancelBtn = document.getElementById('cancel-btn');
  const detailClose = document.getElementById('detail-close');
  const photoInput = document.getElementById('input-photo');
  const photoPreview = document.getElementById('photo-preview');
  const uploadPlaceholder = document.getElementById('upload-placeholder');
  const modalTitle = document.getElementById('modal-title');

  // Prayer list
  const addPrayerBtn = document.getElementById('add-prayer-btn');
  const prayerForm = document.getElementById('prayer-form-container');
  const prayerCancel = document.getElementById('prayer-cancel');
  const prayerSave = document.getElementById('prayer-save');
  const prayerCategory = document.getElementById('prayer-category');
  const prayerDetail = document.getElementById('prayer-detail');

  addPrayerBtn.addEventListener('click', () => {
    prayerForm.classList.remove('hidden');
    addPrayerBtn.classList.add('hidden');
    prayerCategory.focus();
  });

  prayerCancel.addEventListener('click', () => {
    prayerForm.classList.add('hidden');
    addPrayerBtn.classList.remove('hidden');
    prayerCategory.value = '';
    prayerDetail.value = '';
  });

  prayerSave.addEventListener('click', () => {
    const cat = prayerCategory.value.trim();
    if (!cat) return;
    const prayers = loadPrayers();
    prayers.push({ id: generateId(), category: cat, detail: prayerDetail.value.trim() });
    savePrayers(prayers);
    prayerForm.classList.add('hidden');
    addPrayerBtn.classList.remove('hidden');
    prayerCategory.value = '';
    prayerDetail.value = '';
    renderPrayers();
  });

  prayerDetail.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); prayerSave.click(); }
  });
  prayerCategory.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); prayerDetail.focus(); }
  });

  document.getElementById('prayer-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-prayer-delete]');
    if (btn) {
      const id = btn.dataset.prayerDelete;
      savePrayers(loadPrayers().filter(p => p.id !== id));
      renderPrayers();
    }
  });

  // Calendar export
  calBtn.addEventListener('click', downloadICS);

  // Memorial form
  addBtn.addEventListener('click', () => {
    modalTitle.textContent = 'Add a Loved One';
    form.reset();
    photoPreview.classList.add('hidden');
    uploadPlaceholder.classList.remove('hidden');
    modal.classList.remove('hidden');
    document.getElementById('input-name').focus();
  });

  cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));
  modal.querySelector('.modal-backdrop').addEventListener('click', () => modal.classList.add('hidden'));
  detailModal.querySelector('.modal-backdrop').addEventListener('click', () => detailModal.classList.add('hidden'));
  detailClose.addEventListener('click', () => detailModal.classList.add('hidden'));

  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 600, maxH = 450;
        let w = img.width, h = img.height;
        if (w > maxW) { h = h * maxW / w; w = maxW; }
        if (h > maxH) { w = w * maxH / h; h = maxH; }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        photoPreview.src = canvas.toDataURL('image/jpeg', 0.7);
        photoPreview.classList.remove('hidden');
        uploadPlaceholder.classList.add('hidden');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('input-name').value.trim();
    const deathDate = document.getElementById('input-date').value;
    if (!name || !deathDate) return;

    const photo = photoPreview.classList.contains('hidden') ? null : photoPreview.src;
    addMemorial({ id: generateId(), name, deathDate, photo });

    modal.classList.add('hidden');
    form.reset();
    photoPreview.classList.add('hidden');
    uploadPlaceholder.classList.remove('hidden');
    render();
  });

  document.getElementById('memorials').addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('[data-delete]');
    if (deleteBtn) {
      e.stopPropagation();
      const id = deleteBtn.dataset.delete;
      const memorials = loadMemorials();
      const m = memorials.find(x => x.id === id);
      if (m && confirm(`Remove memorial for ${m.name}?`)) {
        removeMemorial(id);
        render();
      }
      return;
    }
    const card = e.target.closest('.memorial-card');
    if (card) showDetail(card.dataset.id);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modal.classList.add('hidden');
      detailModal.classList.add('hidden');
    }
  });

  render();
}

document.addEventListener('DOMContentLoaded', init);
