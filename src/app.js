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
async function generateReceipt() {
  const data = await loadData();
  const paid = getPaidSet();
  const allItems = data.sections.flatMap(s => s.items);
  const paidTotal = allItems.filter(i => paid.has(i.id)).reduce((a,i) => a + i.price, 0);
  const remaining = data.grandTotal - paidTotal;
  const now = new Date();
  const ts  = now.toISOString().replace(/[:.]/g,'-').slice(0,19);
  const dateStr = now.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const timeStr = now.toLocaleTimeString('en-US');

  let sectionRows = '';
  data.sections.forEach(sec => {
    sectionRows += `
      <tr class="sec-hdr"><td colspan="3">${sec.label}</td></tr>
    `;
    sec.items.forEach(item => {
      const isPaid = paid.has(item.id);
      sectionRows += `
        <tr>
          <td>${item.name}${item.note ? `<br><small style="color:#888">${item.note}</small>` : ''}</td>
          <td style="text-align:right">${item.price === 0 ? '—' : '$' + item.price.toLocaleString()}</td>
          <td style="text-align:center;color:${isPaid ? '#00aa55' : '#cc8800'}">${isPaid ? 'PAID' : 'PENDING'}</td>
        </tr>
      `;
    });
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SpaceX Receipt — ${ts}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; color: #111; }
  h1 { text-align:center; letter-spacing:4px; font-size:1.4rem; }
  .logo { display:block; margin:0 auto 20px; width:120px; opacity:0.85; }
  .meta { text-align:center; color:#555; font-size:0.85rem; margin-bottom:30px; }
  table { width:100%; border-collapse:collapse; font-size:0.9rem; }
  th { background:#111; color:#fff; padding:8px 12px; text-align:left; }
  td { padding:7px 12px; border-bottom:1px solid #eee; }
  .sec-hdr td { background:#f0f4ff; font-weight:bold; font-size:0.85rem; color:#333;
               text-transform:uppercase; letter-spacing:1px; padding:6px 12px; }
  .totals td { font-weight:bold; border-top:2px solid #333; }
  .footer { margin-top:30px; font-size:0.78rem; color:#777; border-top:1px solid #ccc; padding-top:12px; }
</style>
</head>
<body>
<img src="../assets/spacex-logo.svg" class="logo" alt="SpaceX">
<h1>SCIENTIFIC INSTRUMENTATION RECEIPT</h1>
<div class="meta">
  Generated: ${dateStr} at ${timeStr}<br>
  Receipt ID: SX-${ts}<br>
  Validity: ${data.validity} from issue date
</div>
<table>
  <thead><tr><th>Item</th><th style="text-align:right">Unit Price</th><th style="text-align:center">Status</th></tr></thead>
  <tbody>
    ${sectionRows}
    <tr class="totals"><td colspan="2" style="text-align:right">Subtotal</td><td style="text-align:right">$${data.subtotal.toLocaleString()}</td></tr>
    <tr><td colspan="2" style="text-align:right">Contingency (10%)</td><td style="text-align:right">$${data.contingency.toLocaleString()}</td></tr>
    <tr class="totals"><td colspan="2" style="text-align:right">Grand Total</td><td style="text-align:right">$${data.grandTotal.toLocaleString()}</td></tr>
    <tr><td colspan="2" style="text-align:right;color:#00aa55">Amount Paid</td><td style="text-align:right;color:#00aa55">$${paidTotal.toLocaleString()}</td></tr>
    <tr><td colspan="2" style="text-align:right;color:#cc8800">Remaining Balance</td><td style="text-align:right;color:#cc8800">$${remaining.toLocaleString()}</td></tr>
  </tbody>
</table>
<div class="footer">
  <strong>NOTES:</strong> All prices are in USD. This receipt is valid for ${data.validity} from the issue date.
  Payment status reflects recorded entries at time of generation. Contingency calculated at 10% of subtotal.<br><br>
  <strong>TERMS:</strong> Payment is due within 30 days of invoice. Late payments may incur interest charges.
  All scientific instruments remain property of SpaceX until full payment is received.
  This document is confidential and intended solely for authorized personnel.<br><br>
  SpaceX Inc. — Hawthorne, CA 90250 — spacex.com
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `receipts/receipt-${ts}.html`;
  a.click();
  URL.revokeObjectURL(a.href);

  const msg = document.getElementById('receipt-msg');
  if (msg) {
    msg.textContent = `Receipt saved: receipt-${ts}.html`;
    setTimeout(() => { msg.textContent = ''; }, 5000);
  }
}
