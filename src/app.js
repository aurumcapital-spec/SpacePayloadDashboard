/* ─── Auth ─────────────────────────────────────────────────────────────── */
const USERS = {
  admin: {
    pass: 'spacex2026', role: 'admin', dest: 'admin.html',
    displayName: 'Mission Administrator',
    clearance: 'Level 5 — Director',
    department: 'Payload Division HQ',
    avatar: 'MA'
  },
  engineer1: {
    pass: 'payload123', role: 'user', dest: 'user.html',
    displayName: 'Payload Engineer',
    clearance: 'Level 3 — Engineer',
    department: 'Propulsion & Payloads',
    avatar: 'PE'
  },
  scientist2: {
    pass: 'orbit456', role: 'user', dest: 'user.html',
    displayName: 'Mission Scientist',
    clearance: 'Level 3 — Scientist',
    department: 'Science Payload Division',
    avatar: 'MS'
  }
};

function generateSessionId() {
  return 'SX-' + Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map(b => b.toString(16).padStart(2,'0').toUpperCase()).join('');
}

function attemptLogin(username, password) {
  const u = USERS[username.toLowerCase()];
  if (u && u.pass === password) {
    sessionStorage.setItem('sx_user', username.toLowerCase());
    sessionStorage.setItem('sx_role', u.role);
    sessionStorage.setItem('sx_login_time', new Date().toISOString());
    sessionStorage.setItem('sx_session_id', generateSessionId());
    window.location.href = u.dest;
    return true;
  }
  return false;
}

function requireAuth(expectedRole) {
  const role = sessionStorage.getItem('sx_role');
  if (!role) { window.location.href = 'index.html'; return false; }
  if (expectedRole && role !== expectedRole) { window.location.href = 'index.html'; return false; }
  return true;
}

function logout() {
  sessionStorage.clear();
  window.location.href = 'index.html';
}

/* ─── Profile Panel ─────────────────────────────────────────────────────── */
function mountProfilePanel() {
  const username = sessionStorage.getItem('sx_user') || '';
  const u = USERS[username] || {};
  const loginTime = sessionStorage.getItem('sx_login_time');
  const sessionId = sessionStorage.getItem('sx_session_id') || '—';

  const loginFormatted = loginTime
    ? new Date(loginTime).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
    : '—';

  const roleLabel = u.role === 'admin' ? 'Administrator' : 'User';
  const roleColor = u.role === 'admin' ? '#00c8ff' : '#00ff88';

  const panel = document.createElement('div');
  panel.id = 'profile-panel';
  panel.className = 'profile-panel';
  panel.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar">${u.avatar || '??'}</div>
      <div>
        <div class="profile-name">${u.displayName || username}</div>
        <div class="profile-username">@${username}</div>
      </div>
    </div>
    <div class="profile-divider"></div>
    <div class="profile-field">
      <span class="pf-label">ROLE</span>
      <span class="pf-val" style="color:${roleColor}">${roleLabel}</span>
    </div>
    <div class="profile-field">
      <span class="pf-label">CLEARANCE</span>
      <span class="pf-val">${u.clearance || '—'}</span>
    </div>
    <div class="profile-field">
      <span class="pf-label">DEPARTMENT</span>
      <span class="pf-val">${u.department || '—'}</span>
    </div>
    <div class="profile-divider"></div>
    <div class="profile-field">
      <span class="pf-label">SESSION ID</span>
      <span class="pf-val pf-mono">${sessionId}</span>
    </div>
    <div class="profile-field">
      <span class="pf-label">LOGGED IN</span>
      <span class="pf-val pf-mono">${loginFormatted}</span>
    </div>
    <div class="profile-divider"></div>
    <button class="profile-logout-btn" onclick="logout()">SIGN OUT</button>
  `;
  document.body.appendChild(panel);

  // Toggle on nav-user click
  const trigger = document.getElementById('nav-user');
  if (trigger) {
    trigger.textContent = u.displayName || username;
    trigger.classList.add('profile-trigger');
    trigger.onclick = (e) => {
      e.stopPropagation();
      panel.classList.toggle('open');
    };
  }

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target)) panel.classList.remove('open');
  });
}

/* ─── Payment State ─────────────────────────────────────────────────────── */
const PAID_KEY = 'spacex_paid';

function getPaidSet() {
  try { return new Set(JSON.parse(localStorage.getItem(PAID_KEY) || '[]')); }
  catch { return new Set(); }
}

function savePaidSet(set) {
  localStorage.setItem(PAID_KEY, JSON.stringify([...set]));
}

function togglePaid(id) {
  const paid = getPaidSet();
  if (paid.has(id)) paid.delete(id); else paid.add(id);
  savePaidSet(paid);
  return paid.has(id);
}

/* ─── Starfield + Shooting Stars ────────────────────────────────────────── */
function initStarfield(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  let shooters = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = Array.from({ length: 300 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.2,
      speed: Math.random() * 0.3 + 0.06,
      alpha: Math.random() * 0.65 + 0.25,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleDir: Math.random() < 0.5 ? 1 : -1
    }));
  }

  function maybeShoot() {
    if (Math.random() < 0.004) {
      const angle = (Math.random() * 30 + 15) * (Math.PI / 180);
      const speed = Math.random() * 10 + 8;
      shooters.push({
        x: Math.random() * canvas.width * 0.8,
        y: Math.random() * canvas.height * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: Math.random() * 100 + 60,
        alpha: 1,
        decay: 0.018 + Math.random() * 0.012
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Twinkle + drift stars
    stars.forEach(s => {
      s.alpha += s.twinkleSpeed * s.twinkleDir;
      if (s.alpha >= 0.9 || s.alpha <= 0.15) s.twinkleDir *= -1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,230,255,${s.alpha})`;
      ctx.fill();
      s.y += s.speed;
      if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
    });

    // Shooting stars
    maybeShoot();
    shooters = shooters.filter(s => s.alpha > 0);
    shooters.forEach(s => {
      const tailX = s.x - s.vx * (s.len / 10);
      const tailY = s.y - s.vy * (s.len / 10);
      const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
      grad.addColorStop(0, `rgba(255,255,255,${s.alpha})`);
      grad.addColorStop(0.3, `rgba(180,230,255,${s.alpha * 0.6})`);
      grad.addColorStop(1, `rgba(100,200,255,0)`);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      s.x += s.vx;
      s.y += s.vy;
      s.alpha -= s.decay;
    });

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
}

/* ─── Video Background Cycler ───────────────────────────────────────────── */
function initVideoBackground(videoId) {
  const video = document.getElementById(videoId);
  if (!video) return;

  const BASE = 'assets/video/';
  const playlist = ['orbital.mp4', 'launch.mp4', 'cinematic.mp4'];
  let idx = Math.floor(Math.random() * playlist.length);

  function loadVideo(i) {
    video.classList.add('fading');
    setTimeout(() => {
      video.src = BASE + playlist[i];
      video.load();
      video.play().catch(() => {});
      video.classList.remove('fading');
    }, 1200);
  }

  video.src = BASE + playlist[idx];
  video.play().catch(() => {});

  video.addEventListener('ended', () => {
    idx = (idx + 1) % playlist.length;
    loadVideo(idx);
  });
}

/* ─── Data Loader ───────────────────────────────────────────────────────── */
const INSTRUMENTS_DATA = {
  "sections": [
    {
      "id": "section1",
      "label": "SECTION 1 — SCIENTIFIC INSTRUMENTS",
      "items": [
        { "id": 1,  "name": "Photometers",                              "price": 250000,   "note": "" },
        { "id": 2,  "name": "Polarimeters",                             "price": 320000,   "note": "" },
        { "id": 3,  "name": "Magnetosphere Imager",                     "price": 1200000,  "note": "" },
        { "id": 4,  "name": "Planetary Radio Astronomy Instruments",    "price": 850000,   "note": "" },
        { "id": 5,  "name": "Imaging Instruments",                      "price": 1500000,  "note": "" },
        { "id": 6,  "name": "Mass Spectrometers",                       "price": 2000000,  "note": "" },
        { "id": 7,  "name": "Science Payload (Integrated Package)",     "price": 3500000,  "note": "" },
        { "id": 8,  "name": "Direct- and Remote-sensing Instruments",   "price": 1800000,  "note": "" },
        { "id": 9,  "name": "Remote-sensing Instruments",               "price": 1200000,  "note": "" },
        { "id": 10, "name": "Active and Passive Instruments",           "price": 1400000,  "note": "" },
        { "id": 11, "name": "High-energy Particle Detectors",           "price": 950000,   "note": "" },
        { "id": 12, "name": "Low-energy Charged-particle Detectors",    "price": 700000,   "note": "" }
      ]
    },
    {
      "id": "section2",
      "label": "SECTION 2 — BASIC NECESSITIES FOR INTERNS",
      "items": [
        { "id": 13, "name": "Intern Basic Necessities Package", "price": 0, "note": "Paid interns to collect remaining paid items from stationary office" }
      ]
    },
    {
      "id": "section3",
      "label": "SECTION 3 — NEW RESIDENTIAL REGISTRATION",
      "items": [
        { "id": 14, "name": "Full Registration — Homes / Workspace / Office", "price": 26000, "note": "Includes intern residence mapping for services, directions and supplies" },
        { "id": 15, "name": "Down Payment — Residential",                      "price": 7500,  "note": "" }
      ]
    }
  ],
  "subtotal": 15670000,
  "contingencyRate": 0.10,
  "contingency": 1567000,
  "grandTotal": 17237000,
  "validity": "90 days",
  "missionStats": { "instruments": 12, "total": "$17.2M", "validity": "90-Day" }
};

async function loadData() {
  return INSTRUMENTS_DATA;
}

/* ─── Table Builder ─────────────────────────────────────────────────────── */
function buildTable(data, paid, adminMode) {
  const tbody = document.getElementById('item-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  data.sections.forEach(sec => {
    const hdr = document.createElement('tr');
    hdr.className = 'section-header';
    hdr.innerHTML = `<td colspan="4">${sec.label}</td>`;
    tbody.appendChild(hdr);

    sec.items.forEach(item => {
      const isPaid = paid.has(item.id);
      const tr = document.createElement('tr');
      tr.dataset.id = item.id;
      tr.className = isPaid ? 'row-paid' : 'row-pending';

      const statusBtn = adminMode
        ? `<button class="status-btn ${isPaid ? 'btn-paid' : 'btn-pending'}" onclick="handleToggle(${item.id})">${isPaid ? 'PAID' : 'PENDING'}</button>`
        : `<span class="status-badge ${isPaid ? 'badge-paid' : 'badge-pending'}">${isPaid ? 'PAID' : 'PENDING'}</span>`;

      tr.innerHTML = `
        <td class="col-id">#${String(item.id).padStart(2,'0')}</td>
        <td class="col-name">${item.name}${item.note ? `<span class="item-note">${item.note}</span>` : ''}</td>
        <td class="col-price">${item.price === 0 ? '—' : '$' + item.price.toLocaleString()}</td>
        <td class="col-status">${statusBtn}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

function updateMetrics(data, paid) {
  const allItems = data.sections.flatMap(s => s.items);
  const paidTotal  = allItems.filter(i => paid.has(i.id)).reduce((a, i) => a + i.price, 0);
  const grand      = data.grandTotal;
  const outstanding = grand - paidTotal;
  const pct        = grand > 0 ? Math.round((paidTotal / grand) * 100) : 0;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('metric-grand',    '$' + grand.toLocaleString());
  set('metric-paid',     '$' + paidTotal.toLocaleString());
  set('metric-outstanding', '$' + outstanding.toLocaleString());
  set('metric-pct',      pct + '%');

  const bar = document.getElementById('progress-bar');
  if (bar) bar.style.width = pct + '%';
}

/* ─── Chart ─────────────────────────────────────────────────────────────── */
function buildChart(data) {
  const canvas = document.getElementById('cost-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const allItems = data.sections.flatMap(s => s.items).filter(i => i.price > 0);
  const maxPrice = Math.max(...allItems.map(i => i.price));

  const BAR_H  = 28;
  const GAP    = 10;
  const LABEL_W = 260;
  const BAR_MAX = canvas.parentElement.clientWidth - LABEL_W - 100;
  const totalH  = allItems.length * (BAR_H + GAP) + 40;

  canvas.width  = canvas.parentElement.clientWidth;
  canvas.height = totalH;

  const paid = getPaidSet();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  allItems.forEach((item, i) => {
    const y      = i * (BAR_H + GAP) + 20;
    const barW   = (item.price / maxPrice) * BAR_MAX;
    const isPaid = paid.has(item.id);
    const color  = isPaid ? '#00ff88' : '#ffb700';

    ctx.fillStyle = 'rgba(0,200,255,0.07)';
    ctx.fillRect(LABEL_W, y, BAR_MAX, BAR_H);

    ctx.fillStyle = color + '33';
    ctx.fillRect(LABEL_W, y, barW, BAR_H);
    ctx.fillStyle = color;
    ctx.fillRect(LABEL_W, y, barW, 3);

    ctx.fillStyle = '#8ba8c0';
    ctx.font = '11px "Exo 2", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(item.name.length > 32 ? item.name.slice(0,30)+'…' : item.name, LABEL_W - 8, y + 18);

    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px "Exo 2", sans-serif';
    ctx.fillText('$' + item.price.toLocaleString(), LABEL_W + barW + 8, y + 18);
  });
}

/* ─── Receipt Generator ─────────────────────────────────────────────────── */
const SPACEX_SVG_INLINE = `<svg xmlns="http://www.w3.org/2000/svg" width="147" height="19" viewBox="0 0 147 19" fill="none"><path fill="#0a0a0a" d="M33.4556 7.10059C35.9425 7.10059 37.5024 8.14389 37.5024 9.99707V11.2383C37.5024 13.2081 36.1594 14.0693 33.6704 14.0693H24.7524V18.4062H21.3345V7.10059H33.4556ZM146.805 0.544922V0.561523C141.398 1.00137 120.15 3.63015 105.414 18.4062H99.9458L100.557 17.7988C103.641 14.8268 117.282 2.23051 146.803 0.542969L146.805 0.544922ZM56.2397 18.4043H52.1655L50.3599 15.9287H39.8169L41.6274 14H48.9526L45.4292 9.17285L47.5093 6.62012L56.2397 18.4043ZM72.1841 7.09863C74.0086 7.09865 75.3021 7.72865 75.6343 9.07031H62.8081V16.2803H75.6343C75.2694 17.7734 74.4885 18.4042 72.2827 18.4043H62.5786C60.9037 18.4043 59.3268 17.7248 59.3267 15.9209V9.58203C59.3267 7.778 60.9037 7.09868 62.5786 7.09863H72.1841ZM90.7222 12.834H83.8247V16.2803H95.6489V18.4043H80.3481V10.8975H90.7222V12.834ZM120.998 18.4043H115.584L110.775 14.9082H110.777C111.663 14.2168 112.602 13.5232 113.51 12.9014L120.998 18.4043ZM12.9351 7.09863C14.8252 7.09865 15.9037 8.0272 16.2358 9.07031H3.59424V11.5049H13.3979V11.5029C15.3722 11.6154 16.5677 12.4597 16.5679 14.0488V15.8535C16.5677 17.6083 15.5242 18.4014 13.4331 18.4014H3.43018C1.52352 18.4014 0.428522 17.6897 0.112793 16.2783H13.4849V13.6934H3.54541C1.70432 13.7036 0.459473 12.8582 0.459473 11.3691V9.58203C0.459473 7.87612 1.66924 7.09863 3.77686 7.09863H12.9351ZM24.7524 12H33.0435C34.3863 12 34.5356 11.5512 34.5356 10.7412V10.2979C34.5356 9.50218 34.3371 9.07228 32.8774 9.07227H24.7729L24.7524 12ZM109.604 9.87891C108.627 10.4554 107.562 11.1202 106.646 11.7334L100.298 7.09863H105.705L109.604 9.87891ZM109.607 9.88086L109.604 9.87891L109.607 9.87793V9.88086ZM95.811 9.07031H80.3481V7.09863H95.811V9.07031Z"/></svg>`;

async function generateReceipt() {
  const data = await loadData();
  const paid = getPaidSet();
  const allItems = data.sections.flatMap(s => s.items);
  const paidTotal  = allItems.filter(i => paid.has(i.id)).reduce((a,i) => a + i.price, 0);
  const remaining  = data.grandTotal - paidTotal;
  const pct        = data.grandTotal > 0 ? Math.round((paidTotal / data.grandTotal) * 100) : 0;
  const now        = new Date();
  const ts         = now.toISOString().replace(/[:.]/g,'-').slice(0,19);
  const dateStr    = now.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const timeStr    = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
  const receiptId  = 'SX-' + now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + '-' + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0');
  const dueDate    = new Date(now.getTime() + 30*24*60*60*1000).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const expiryDate = new Date(now.getTime() + 90*24*60*60*1000).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});

  let sectionRows = '';
  data.sections.forEach(sec => {
    sectionRows += `<tr class="sec-hdr"><td colspan="3">${sec.label}</td></tr>`;
    sec.items.forEach((item, idx) => {
      const isPaid = paid.has(item.id);
      const rowClass = idx % 2 === 0 ? 'row-even' : 'row-odd';
      sectionRows += `
        <tr class="${rowClass}">
          <td class="item-cell">
            <span class="item-name">${item.name}</span>
            ${item.note ? `<span class="item-note">${item.note}</span>` : ''}
          </td>
          <td class="price-cell">${item.price === 0 ? '<span style="color:#999">Complimentary</span>' : '$' + item.price.toLocaleString()}</td>
          <td class="status-cell">
            <span class="status-badge ${isPaid ? 'status-paid' : 'status-pending'}">${isPaid ? '✓ PAID' : '○ PENDING'}</span>
          </td>
        </tr>`;
    });
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invoice ${receiptId} — SpaceX Scientific Instrumentation</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',Arial,sans-serif;background:#f4f6f9;color:#1a1d23;font-size:14px;line-height:1.6}
  .page{max-width:860px;margin:0 auto;background:#fff;box-shadow:0 4px 40px rgba(0,0,0,0.1)}

  /* Header */
  .header{background:#0a0a0a;padding:40px 48px 32px;display:flex;justify-content:space-between;align-items:flex-start}
  .header-left{}
  .logo-wrap{margin-bottom:20px}
  .company-detail{color:#666;font-size:12px;line-height:1.8}
  .company-detail strong{color:#aaa;display:block;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px}
  .header-right{text-align:right}
  .invoice-label{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#555;margin-bottom:8px}
  .invoice-id{font-size:22px;font-weight:700;color:#fff;letter-spacing:1px;margin-bottom:16px}
  .header-meta{font-size:12px;color:#666;line-height:2}
  .header-meta span{color:#aaa}
  .accent-line{height:3px;background:linear-gradient(90deg,#00c8ff,#a855f7);margin:0}

  /* Status Banner */
  .status-banner{padding:16px 48px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e8ecf0}
  .status-banner.partial{background:#fffbf0}
  .status-banner.complete{background:#f0fff8}
  .status-text{font-size:13px;font-weight:600}
  .status-banner.partial .status-text{color:#b45309}
  .status-banner.complete .status-text{color:#065f46}
  .progress-wrap{flex:1;max-width:300px;margin:0 24px}
  .progress-track{height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden}
  .progress-fill{height:100%;border-radius:3px;transition:width 0.3s}
  .status-banner.partial .progress-fill{background:linear-gradient(90deg,#f59e0b,#fbbf24)}
  .status-banner.complete .progress-fill{background:linear-gradient(90deg,#10b981,#34d399)}
  .progress-label{font-size:12px;color:#6b7280;margin-top:4px;text-align:right}

  /* Bill To */
  .bill-section{padding:32px 48px;display:grid;grid-template-columns:1fr 1fr;gap:32px;border-bottom:1px solid #e8ecf0}
  .bill-block h4{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;margin-bottom:12px;font-weight:600}
  .bill-block p{font-size:13px;color:#374151;line-height:1.8}
  .bill-block strong{font-weight:600;color:#111;font-size:14px}

  /* Table */
  .table-section{padding:0 48px 32px}
  .table-section h3{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;padding:24px 0 16px;font-weight:600}
  table{width:100%;border-collapse:collapse}
  .table-head th{background:#f8fafc;padding:10px 14px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb;text-align:left}
  .table-head th:nth-child(2){text-align:right}
  .table-head th:nth-child(3){text-align:center}
  .sec-hdr td{background:#f1f5f9;padding:9px 14px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#475569;border-top:2px solid #e2e8f0;border-bottom:1px solid #e2e8f0}
  .row-even td,.row-odd td{padding:11px 14px;border-bottom:1px solid #f1f5f9;vertical-align:top}
  .row-odd td{background:#fafbfc}
  .item-name{display:block;font-weight:500;color:#1f2937}
  .item-note{display:block;font-size:11px;color:#9ca3af;margin-top:2px}
  .price-cell{text-align:right;font-weight:500;color:#374151;white-space:nowrap}
  .status-cell{text-align:center;white-space:nowrap}
  .status-badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:1px}
  .status-paid{background:#d1fae5;color:#065f46}
  .status-pending{background:#fef3c7;color:#92400e}

  /* Totals */
  .totals-section{margin:0 48px 32px;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden}
  .totals-row{display:flex;justify-content:space-between;padding:11px 20px;font-size:13px;border-bottom:1px solid #f1f5f9}
  .totals-row:last-child{border-bottom:none}
  .totals-row.subtotal{background:#f8fafc;color:#6b7280}
  .totals-row.contingency{background:#f8fafc;color:#6b7280}
  .totals-row.grand{background:#0a0a0a;color:#fff;font-weight:700;font-size:15px}
  .totals-row.paid-row{background:#f0fff8;color:#065f46;font-weight:600}
  .totals-row.balance-row{background:#fffbf0;color:#92400e;font-weight:600}
  .totals-row .label{}
  .totals-row .amount{font-weight:inherit}

  /* Footer */
  .footer-section{padding:32px 48px;background:#f8fafc;border-top:1px solid #e5e7eb;display:grid;grid-template-columns:1fr 1fr;gap:32px}
  .footer-block h4{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;margin-bottom:10px;font-weight:600}
  .footer-block p{font-size:12px;color:#6b7280;line-height:1.8}
  .footer-bottom{padding:16px 48px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e5e7eb}
  .footer-bottom p{font-size:11px;color:#9ca3af}
  .confidential{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#d1d5db;font-weight:600}

  @media print{body{background:#fff}.page{box-shadow:none}}
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <div class="logo-wrap">${SPACEX_SVG_INLINE}</div>
      <div class="company-detail">
        <strong>Issued By</strong>
        SpaceX Inc.<br>
        Rocket Road, Hawthorne, CA 90250<br>
        support@spacexscientistinternship.com<br>
        spacexscientistinternship.com
      </div>
    </div>
    <div class="header-right">
      <div class="invoice-label">Official Invoice</div>
      <div class="invoice-id">${receiptId}</div>
      <div class="header-meta">
        <span>Issue Date</span><br>${dateStr} · ${timeStr}<br>
        <span>Payment Due</span><br>${dueDate}<br>
        <span>Valid Until</span><br>${expiryDate}
      </div>
    </div>
  </div>
  <div class="accent-line"></div>

  <!-- Payment Status Banner -->
  <div class="status-banner ${pct >= 100 ? 'complete' : 'partial'}">
    <div class="status-text">${pct >= 100 ? '✓ Fully Paid' : `Payment ${pct}% Complete`}</div>
    <div class="progress-wrap">
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="progress-label">$${paidTotal.toLocaleString()} of $${data.grandTotal.toLocaleString()}</div>
    </div>
    <div class="status-text" style="color:#6b7280;font-weight:400;font-size:12px">Balance: $${remaining.toLocaleString()}</div>
  </div>

  <!-- Bill To -->
  <div class="bill-section">
    <div class="bill-block">
      <h4>Bill To</h4>
      <p><strong>Scientific Payload Division</strong><br>SpaceX Mission Control<br>Hawthorne, CA 90250<br>United States</p>
    </div>
    <div class="bill-block">
      <h4>Program Details</h4>
      <p>
        <strong>Scientific Instrumentation Program</strong><br>
        Instruments: 12 Active Units<br>
        Validity Period: ${data.validity}<br>
        Currency: USD
      </p>
    </div>
  </div>

  <!-- Line Items -->
  <div class="table-section">
    <h3>Line Items</h3>
    <table>
      <thead class="table-head">
        <tr><th>Description</th><th>Amount</th><th>Status</th></tr>
      </thead>
      <tbody>${sectionRows}</tbody>
    </table>
  </div>

  <!-- Totals -->
  <div class="totals-section">
    <div class="totals-row subtotal"><span class="label">Subtotal</span><span class="amount">$${data.subtotal.toLocaleString()}</span></div>
    <div class="totals-row contingency"><span class="label">Contingency Reserve (10%)</span><span class="amount">$${data.contingency.toLocaleString()}</span></div>
    <div class="totals-row grand"><span class="label">Grand Total</span><span class="amount">$${data.grandTotal.toLocaleString()}</span></div>
    <div class="totals-row paid-row"><span class="label">Amount Paid</span><span class="amount">$${paidTotal.toLocaleString()}</span></div>
    <div class="totals-row balance-row"><span class="label">Remaining Balance</span><span class="amount">$${remaining.toLocaleString()}</span></div>
  </div>

  <!-- Footer Notes -->
  <div class="footer-section">
    <div class="footer-block">
      <h4>Notes</h4>
      <p>All prices are quoted in US Dollars (USD). This invoice is valid for ${data.validity} from the issue date shown above. Payment status reflects entries recorded at the time of generation. The 10% contingency reserve covers unforeseen mission-critical expenses.</p>
    </div>
    <div class="footer-block">
      <h4>Payment Terms</h4>
      <p>Net 30 days from invoice date. Late payments may incur interest at 1.5% per month. All scientific instruments and equipment remain property of SpaceX until payment is received in full. Wire transfer and approved payment methods only.</p>
    </div>
  </div>
  <div class="footer-bottom">
    <p>SpaceX Inc. · Hawthorne, CA 90250 · spacexscientistinternship.com</p>
    <span class="confidential">Confidential</span>
  </div>

</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `SpaceX-Invoice-${receiptId}.html`;
  a.click();
  URL.revokeObjectURL(a.href);

  const msg = document.getElementById('receipt-msg');
  if (msg) {
    msg.textContent = `Invoice ${receiptId} downloaded.`;
    setTimeout(() => { msg.textContent = ''; }, 5000);
  }
}
