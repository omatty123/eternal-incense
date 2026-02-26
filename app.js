/* ═══════════════════════════════════════════
   Eternal Incense — 영원한 향
   Memorial ritual calculator & incense shrine
   ═══════════════════════════════════════════ */

const STORAGE_KEY = 'eternal-incense-memorials';

const RITUALS = [
  { key: '49day',  label: '49th Day',  korean: '사십구재', days: 49 },
  { key: '100day', label: '100th Day', korean: '백일',     days: 100 },
  { key: '1year',  label: '1 Year',    korean: '소상',     years: 1 },
  { key: '3year',  label: '3 Years',   korean: '대상',     years: 3 },
];

// ─── Data ───

function loadMemorials() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveMemorials(memorials) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memorials));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Date Calculations ───

function getRitualDate(deathDate, ritual) {
  const d = new Date(deathDate + 'T00:00:00');
  if (ritual.days) {
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
  const now = new Date();
  return daysBetween(d, now);
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

// ─── Render ───

function render() {
  const memorials = loadMemorials();
  const grid = document.getElementById('memorials');
  const alerts = document.getElementById('alerts');

  // Check for upcoming rituals
  const upcoming = [];
  memorials.forEach(m => {
    RITUALS.forEach(r => {
      const rDate = getRitualDate(m.deathDate, r);
      const status = getRitualStatus(rDate);
      if (status === 'imminent') {
        const diff = daysBetween(new Date(), rDate);
        upcoming.push({
          name: m.name,
          ritual: r.label,
          korean: r.korean,
          date: formatDate(rDate),
          days: diff
        });
      }
    });
  });

  alerts.innerHTML = upcoming.map(u =>
    `<div class="alert">
      <strong>${u.name}</strong> ${u.ritual} (${u.korean}) is ${u.days === 0 ? 'today' : `in ${u.days} day${u.days === 1 ? '' : 's'}`} (${u.date})
    </div>`
  ).join('');

  if (memorials.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>No memorials yet.</p>
        <p>Add a loved one to begin their perpetual incense.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = memorials.map(m => {
    const photoHTML = m.photo
      ? `<img class="card-photo" src="${m.photo}" alt="${m.name}">`
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
    const dateStr = formatDate(d);

    return `
      <div class="memorial-card" data-id="${m.id}">
        <div class="card-actions">
          <button class="btn-delete" data-delete="${m.id}" title="Remove memorial">&times;</button>
        </div>
        ${photoHTML}
        <div class="card-body">
          ${createSmokeHTML(3)}
          <div class="card-name">${escapeHTML(m.name)}</div>
          <div class="card-date">${dateStr}</div>
          <div class="ritual-row">${ritualBadges}</div>
        </div>
      </div>
    `;
  }).join('');
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
    ? `<img class="detail-photo" src="${m.photo}" alt="${m.name}">`
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

// ─── Event Handlers ───

function init() {
  const addBtn = document.getElementById('add-btn');
  const modal = document.getElementById('modal');
  const detailModal = document.getElementById('detail-modal');
  const form = document.getElementById('memorial-form');
  const cancelBtn = document.getElementById('cancel-btn');
  const detailClose = document.getElementById('detail-close');
  const photoInput = document.getElementById('input-photo');
  const photoPreview = document.getElementById('photo-preview');
  const uploadPlaceholder = document.getElementById('upload-placeholder');
  const modalTitle = document.getElementById('modal-title');

  let editingId = null;

  addBtn.addEventListener('click', () => {
    editingId = null;
    modalTitle.textContent = 'Add a Loved One';
    form.reset();
    photoPreview.classList.add('hidden');
    uploadPlaceholder.classList.remove('hidden');
    modal.classList.remove('hidden');
    document.getElementById('input-name').focus();
  });

  cancelBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modal.querySelector('.modal-backdrop').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  detailModal.querySelector('.modal-backdrop').addEventListener('click', () => {
    detailModal.classList.add('hidden');
  });

  detailClose.addEventListener('click', () => {
    detailModal.classList.add('hidden');
  });

  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Resize image to save localStorage space
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 600;
        const maxH = 450;
        let w = img.width;
        let h = img.height;
        if (w > maxW) { h = h * maxW / w; w = maxW; }
        if (h > maxH) { w = w * maxH / h; h = maxH; }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        photoPreview.src = dataUrl;
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
    const memorials = loadMemorials();

    if (editingId) {
      const idx = memorials.findIndex(m => m.id === editingId);
      if (idx !== -1) {
        memorials[idx].name = name;
        memorials[idx].deathDate = deathDate;
        if (photo) memorials[idx].photo = photo;
      }
    } else {
      memorials.push({ id: generateId(), name, deathDate, photo });
    }

    saveMemorials(memorials);
    modal.classList.add('hidden');
    form.reset();
    photoPreview.classList.add('hidden');
    uploadPlaceholder.classList.remove('hidden');
    render();
  });

  document.getElementById('memorials').addEventListener('click', (e) => {
    // Delete button
    const deleteBtn = e.target.closest('[data-delete]');
    if (deleteBtn) {
      e.stopPropagation();
      const id = deleteBtn.dataset.delete;
      const memorials = loadMemorials();
      const m = memorials.find(x => x.id === id);
      if (m && confirm(`Remove memorial for ${m.name}?`)) {
        saveMemorials(memorials.filter(x => x.id !== id));
        render();
      }
      return;
    }

    // Card click -> detail
    const card = e.target.closest('.memorial-card');
    if (card) {
      showDetail(card.dataset.id);
    }
  });

  // Keyboard: Escape to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modal.classList.add('hidden');
      detailModal.classList.add('hidden');
    }
  });

  render();
}

document.addEventListener('DOMContentLoaded', init);
