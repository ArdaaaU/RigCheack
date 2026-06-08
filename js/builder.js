import { getComponents, saveBuild, getBuilds, deleteBuild } from './api.js';

const SLOTS = [
  { type: 'cpu',         label: 'İşlemci (CPU)',    icon: '💻', iconClass: 'icon-cpu'  },
  { type: 'motherboard', label: 'Anakart',           icon: '🔌', iconClass: 'icon-mb'   },
  { type: 'ram',         label: 'Bellek (RAM)',      icon: '🧠', iconClass: 'icon-ram'  },
  { type: 'gpu',         label: 'Ekran Kartı (GPU)', icon: '🎮', iconClass: 'icon-gpu'  },
  { type: 'psu',         label: 'Güç Kaynağı (PSU)', icon: '⚡', iconClass: 'icon-psu'  },
  { type: 'ssd',         label: 'Depolama (SSD)',    icon: '💾', iconClass: 'icon-ssd'  },
];

let allComponents = [];
let build = {};
SLOTS.forEach(s => build[s.type] = null);
let currentType = '';
let searchQuery = '';
let currentView = 'build';

const TYPE_ICONS = { cpu:'💻', gpu:'🎮', ram:'🧠', psu:'⚡', motherboard:'🔌', ssd:'💾' };

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function toast(msg, type = '') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast${type ? ' ' + type : ''}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ---- Views ----
function switchView(v) {
  currentView = v;
  document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  document.getElementById('view-build').style.display  = v === 'build'  ? '' : 'none';
  document.getElementById('view-pick').style.display   = v === 'pick'   ? '' : 'none';
  document.getElementById('view-saved').style.display  = v === 'saved'  ? '' : 'none';
  document.getElementById('save-bar').style.display    = v === 'build'  ? '' : 'none';
  if (v === 'pick') renderCompList();
  if (v === 'saved') loadSavedBuilds();
}

// ---- Build Slots ----
function slotDetails(c) {
  const p = [];
  if (c.type === 'cpu') { if (c.socket) p.push(c.socket); if (c.specs?.cores) p.push(c.specs.cores + ' Çekirdek'); if (c.tdp) p.push(c.tdp + 'W'); }
  if (c.type === 'gpu') { if (c.specs?.vram_gb) p.push(c.specs.vram_gb + 'GB VRAM'); if (c.tdp) p.push(c.tdp + 'W'); }
  if (c.type === 'ram') { if (c.memory_type) p.push(c.memory_type); if (c.memory_speed) p.push(c.memory_speed + 'MHz'); if (c.capacity_gb) p.push(c.capacity_gb + 'GB'); }
  if (c.type === 'psu') { if (c.psu_wattage) p.push(c.psu_wattage + 'W'); if (c.specs?.efficiency) p.push(c.specs.efficiency); }
  if (c.type === 'motherboard') { if (c.socket) p.push(c.socket); if (c.memory_type) p.push(c.memory_type); }
  if (c.type === 'ssd') { if (c.capacity_gb) p.push(c.capacity_gb >= 1000 ? c.capacity_gb/1000+'TB' : c.capacity_gb+'GB'); }
  return p.filter(Boolean).join(' · ');
}

function renderBuildSlots() {
  const container = document.getElementById('build-slots');
  container.innerHTML = SLOTS.map(s => {
    const comp = build[s.type];
    return `
      <div class="build-slot${comp ? ' filled' : ''}">
        <div class="build-slot-icon ${s.iconClass}">${s.icon}</div>
        <div class="build-slot-info">
          <div class="build-slot-label">${s.label}</div>
          ${comp
            ? `<div class="build-slot-name">${esc(comp.name)}</div>
               <div class="build-slot-detail">${esc(slotDetails(comp))}</div>`
            : `<div class="build-slot-empty">Seçilmedi — Parça Ekle bölümünden ekle</div>`}
        </div>
        ${comp
          ? `<div>${comp.price_usd ? `<div style="font-size:13px;font-weight:700;color:var(--blue);margin-bottom:6px">$${comp.price_usd}</div>` : ''}
             <button class="slot-remove" onclick="removeComp('${s.type}')">✕</button></div>`
          : `<div class="slot-add-hint" onclick="switchToPickType('${s.type}')">+</div>`}
      </div>
    `;
  }).join('');
}

window.removeComp = function(type) {
  build[type] = null;
  renderBuildSlots();
  updateSummary();
};

window.switchToPickType = function(type) {
  currentType = type;
  document.querySelectorAll('.builder-tab').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  switchView('pick');
};

// ---- Component List ----
function filteredComps() {
  return allComponents.filter(c => {
    const mt = !currentType || c.type === currentType;
    const ms = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return mt && ms;
  });
}

function compTags(c) {
  const t = [];
  if (c.socket) t.push(c.socket);
  if (c.memory_type) t.push(c.memory_type);
  if (c.tdp) t.push(c.tdp + 'W');
  if (c.psu_wattage) t.push(c.psu_wattage + 'W');
  if (c.memory_speed) t.push(c.memory_speed + 'MHz');
  if (c.capacity_gb) t.push(c.capacity_gb >= 1000 ? c.capacity_gb/1000+'TB' : c.capacity_gb+'GB');
  if (c.specs?.vram_gb) t.push(c.specs.vram_gb+'GB');
  if (c.specs?.cores) t.push(c.specs.cores+'C');
  return t.slice(0, 3);
}

function renderCompList() {
  const container = document.getElementById('comp-list');
  const items = filteredComps();
  if (!items.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔍</div><h3>Sonuç yok</h3><p>Farklı bir arama deneyin.</p></div>`;
    return;
  }
  container.innerHTML = items.map(c => `
    <div class="comp-row" onclick="addComp('${c.id}')">
      <div class="comp-row-icon icon-${c.type}">${TYPE_ICONS[c.type] || '📦'}</div>
      <div class="comp-row-info">
        <div class="comp-row-name">${esc(c.name)}</div>
        <div class="comp-row-spec">
          ${compTags(c).map(t => `<span class="spec-chip">${t}</span>`).join('')}
        </div>
      </div>
      <div class="comp-row-right">
        ${c.price_usd ? `<div class="comp-price">$${c.price_usd}</div>` : ''}
        <div class="comp-add-btn">+</div>
      </div>
    </div>
  `).join('');
}

window.addComp = function(id) {
  const comp = allComponents.find(c => c.id === id);
  if (!comp) return;
  build[comp.type] = comp;
  renderBuildSlots();
  updateSummary();
  toast(`${comp.name} eklendi`, 'success');
  switchView('build');
};

// ---- Summary ----
function updateSummary() {
  const { cpu, gpu, psu, motherboard: mb, ram } = build;
  const tdp = (cpu?.tdp || 0) + (gpu?.tdp || 0) + 50;
  const price = Object.values(build).reduce((s,c) => s + (c?.price_usd ? +c.price_usd : 0), 0);

  document.getElementById('sum-tdp').textContent = tdp + 'W';
  document.getElementById('sum-price').textContent = '$' + price.toFixed(2);

  const pfill = document.getElementById('psu-progress-fill');
  const prog = document.getElementById('psu-progress');
  if (psu?.psu_wattage) {
    const ratio = Math.min((tdp / psu.psu_wattage) * 100, 100);
    pfill.style.width = ratio + '%';
    prog.className = 'progress-bar ' + (ratio > 90 ? 'progress-red' : ratio > 75 ? 'progress-amber' : 'progress-green');
    document.getElementById('sum-psu').textContent = `${psu.psu_wattage}W · %${Math.round(ratio)} yükleme`;
  } else {
    pfill.style.width = '0%';
    document.getElementById('sum-psu').textContent = 'PSU seçilmedi';
  }

  const hasAny = Object.values(build).some(Boolean);
  const checks = [];
  if (!hasAny) {
    checks.push({ t: 'ok', m: 'Parça seç ve uyumluluğu kontrol et' });
  } else {
    if (cpu && mb) {
      checks.push(cpu.socket === mb.socket
        ? { t:'ok', m:`CPU soketi ${cpu.socket} — Anakart uyumlu` }
        : { t:'error', m:`Soket uyumsuzluğu: CPU ${cpu.socket}, Anakart ${mb.socket}` });
    } else {
      if (cpu && !mb) checks.push({ t:'warn', m:'Soket uyumluluğu için anakart seç' });
    }
    if (ram && mb) {
      checks.push(ram.memory_type === mb.memory_type
        ? { t:'ok', m:`${ram.memory_type} RAM — Anakart uyumlu` }
        : { t:'error', m:`RAM uyumsuzluğu: ${ram.memory_type} vs ${mb.memory_type}` });
    }
    if (psu && (cpu || gpu)) {
      const margin = psu.psu_wattage - tdp;
      if (margin < 0) checks.push({ t:'error', m:`PSU yetersiz: ${psu.psu_wattage}W PSU, sistem ${tdp}W istiyor` });
      else if (margin < 50) checks.push({ t:'warn', m:`PSU marjı dar: yalnızca ${margin}W yedek` });
      else checks.push({ t:'ok', m:`PSU yeterliliği: ${psu.psu_wattage}W / ${tdp}W sistem` });
    } else if ((cpu || gpu) && !psu) {
      checks.push({ t:'warn', m:'Güç gereksinimleri için PSU seç' });
    }
  }

  const ic = { ok:'✓', warn:'⚠', error:'✗' };
  document.getElementById('compat-list').innerHTML = checks.map(c =>
    `<div class="compat-item ${c.t}"><span class="compat-icon">${ic[c.t]}</span><span>${esc(c.m)}</span></div>`
  ).join('');

  const filled = Object.values(build).filter(Boolean).length;
  document.getElementById('build-summary-sub').textContent = filled ? `${filled}/6 parça · $${price.toFixed(0)}` : 'Parça seçmeye başla';
}

// ---- Saved Builds ----
async function loadSavedBuilds() {
  const el = document.getElementById('saved-list');
  try {
    const builds = await getBuilds();
    if (!builds.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💾</div><h3>Kayıtlı build yok</h3><p>Build oluştur ve kaydet.</p></div>`;
      return;
    }
    el.innerHTML = builds.map(b => `
      <div class="saved-build-row" onclick="loadBuild('${b.id}')">
        <div class="saved-build-icon">🔧</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:15px;font-weight:700;color:var(--text)">${esc(b.title)}</div>
          <div style="font-size:12px;color:var(--text-3);margin-top:2px">$${(+b.total_price||0).toFixed(0)} · ${b.total_tdp||0}W</div>
        </div>
        <button onclick="event.stopPropagation();deleteSavedBuild('${b.id}')"
          style="width:32px;height:32px;background:var(--red-soft);border:none;border-radius:50%;color:var(--red);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
      </div>
    `).join('');
  } catch {
    el.innerHTML = `<div class="error-banner" style="margin:20px">Buildler yüklenemedi.</div>`;
  }
}

window.loadBuild = async function(id) {
  try {
    const builds = await getBuilds();
    const saved = builds.find(b => b.id === id);
    if (!saved) return;
    document.getElementById('build-name').value = saved.title;
    SLOTS.forEach(s => {
      const ref = saved.components_json?.[s.type];
      build[s.type] = ref ? allComponents.find(c => c.id === ref.id) || null : null;
    });
    renderBuildSlots();
    updateSummary();
    switchView('build');
    toast(`"${saved.title}" yüklendi`, 'success');
  } catch { toast('Build yüklenemedi', 'error'); }
};

window.deleteSavedBuild = async function(id) {
  if (!confirm('Bu buildi sil?')) return;
  try {
    await deleteBuild(id);
    loadSavedBuilds();
    toast('Build silindi');
  } catch { toast('Silinemedi', 'error'); }
};

async function handleSave() {
  const title = document.getElementById('build-name').value.trim() || 'Benim Buildum';
  const hasAny = Object.values(build).some(Boolean);
  if (!hasAny) { toast('Önce en az bir parça ekle', 'error'); return; }
  const tdp = (build.cpu?.tdp||0)+(build.gpu?.tdp||0)+50;
  const price = Object.values(build).reduce((s,c)=>s+(c?.price_usd?+c.price_usd:0),0);
  const compJson = {};
  SLOTS.forEach(s => { compJson[s.type] = build[s.type] ? {id:build[s.type].id, name:build[s.type].name} : null; });
  try {
    await saveBuild({ title, components_json: compJson, total_tdp: tdp, total_price: price });
    toast('Build kaydedildi!', 'success');
  } catch { toast('Kayıt başarısız', 'error'); }
}

// ---- Init ----
async function init() {
  // View switcher
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Type tabs in picker
  document.querySelectorAll('.builder-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.builder-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.type;
      renderCompList();
    });
  });

  document.getElementById('picker-search').addEventListener('input', e => {
    searchQuery = e.target.value;
    renderCompList();
  });

  document.getElementById('save-btn').addEventListener('click', handleSave);
  document.getElementById('clear-btn').addEventListener('click', () => {
    if (!confirm('Build temizlensin mi?')) return;
    SLOTS.forEach(s => build[s.type] = null);
    renderBuildSlots();
    updateSummary();
    toast('Build temizlendi');
  });

  try {
    allComponents = await getComponents();
    renderBuildSlots();
    updateSummary();
  } catch {
    document.getElementById('build-slots').innerHTML = `<div class="error-banner" style="margin:20px">Parçalar yüklenemedi.</div>`;
  }
}

init();
