import { getBenchmarks, submitBenchmark } from './api.js';

let allBenchmarks = [];
let filters = { game: '', resolution: '', quality: '' };
let sortMode = 'fps_desc';
const SORT_LABELS = { fps_desc: '⬇ FPS (Yüksek)', fps_asc: '⬆ FPS (Düşük)', game_asc: 'A–Z Oyun' };

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function toast(msg, type='') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast${type?' '+type:''}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function fpsClass(fps) {
  if (fps >= 144) return 'fps-excellent';
  if (fps >= 90)  return 'fps-good';
  if (fps >= 60)  return 'fps-ok';
  return 'fps-low';
}

function filteredSorted() {
  let items = allBenchmarks.filter(b =>
    (!filters.game       || b.game_title === filters.game) &&
    (!filters.resolution || b.resolution === filters.resolution) &&
    (!filters.quality    || b.quality    === filters.quality)
  );
  if (sortMode === 'fps_desc') items.sort((a,b) => b.fps_avg - a.fps_avg);
  else if (sortMode === 'fps_asc') items.sort((a,b) => a.fps_avg - b.fps_avg);
  else items.sort((a,b) => a.game_title.localeCompare(b.game_title));
  return items;
}

function renderBenchmarks() {
  const list = document.getElementById('bench-list');
  const items = filteredSorted();
  document.getElementById('results-count').textContent = `${items.length} sonuç`;

  if (!items.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📊</div><h3>Sonuç yok</h3><p>Filtreleri sıfırla.</p></div>`;
    return;
  }

  const maxFps = Math.max(...items.map(b => b.fps_avg), 1);
  list.innerHTML = items.map(b => {
    const cls = fpsClass(b.fps_avg);
    const pct = Math.round((b.fps_avg / maxFps) * 100);
    return `
      <div class="bench-card">
        <div class="bench-game-name">${esc(b.game_title)}</div>
        <div class="bench-hw">
          <div class="bench-hw-line"><span class="bench-hw-line-icon">💻</span>${esc(b.cpu_name)}</div>
          <div class="bench-hw-line"><span class="bench-hw-line-icon">🎮</span>${esc(b.gpu_name)}</div>
        </div>
        <div class="bench-tags">
          <span class="bench-tag bench-tag-res">${esc(b.resolution)}</span>
          <span class="bench-tag bench-tag-qual">${esc(b.quality)}</span>
        </div>
        <div class="${cls}">
          <div class="fps-display">
            <span class="fps-num">${Math.round(b.fps_avg)}</span>
            <span class="fps-label">FPS</span>
            ${b.fps_min && b.fps_max ? `<span class="fps-range">${Math.round(b.fps_min)}–${Math.round(b.fps_max)}</span>` : ''}
          </div>
          <div class="fps-bar"><div class="fps-bar-fill" style="width:${pct}%"></div></div>
        </div>
        <div class="bench-footer">
          <span class="bench-submitter">by ${esc(b.submitted_by || 'Community')}</span>
        </div>
      </div>
    `;
  }).join('');
}

function populateGameChips() {
  const games = [...new Set(allBenchmarks.map(b => b.game_title))].sort();
  const row = document.getElementById('game-chips');
  games.forEach(g => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.dataset.val = g;
    btn.textContent = g;
    btn.addEventListener('click', () => {
      row.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      filters.game = g;
      renderBenchmarks();
    });
    row.appendChild(btn);
  });
  // "All" chip
  row.querySelector('.chip').addEventListener('click', () => {
    row.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    row.querySelector('.chip').classList.add('active');
    filters.game = '';
    renderBenchmarks();
  });
}

// ---- Submit modal ----
function openSubmit() { document.getElementById('submit-modal').classList.add('open'); document.getElementById('sub-game').focus(); }
function closeSubmit() { document.getElementById('submit-modal').classList.remove('open'); document.getElementById('submit-error').style.display='none'; }

async function handleSubmit() {
  const game = document.getElementById('sub-game').value.trim();
  const cpu  = document.getElementById('sub-cpu').value.trim();
  const gpu  = document.getElementById('sub-gpu').value.trim();
  const fpsAvg = parseFloat(document.getElementById('sub-fps-avg').value);
  const fpsMin = parseFloat(document.getElementById('sub-fps-min').value) || null;
  const res  = document.getElementById('sub-res').value;
  const qual = document.getElementById('sub-qual').value;
  const author = document.getElementById('sub-author').value.trim() || 'Community';
  const errEl = document.getElementById('submit-error');
  errEl.style.display = 'none';

  if (!game || !cpu || !gpu || !fpsAvg || fpsAvg < 1) {
    errEl.textContent = 'Oyun, CPU, GPU ve Ort. FPS zorunludur.';
    errEl.style.display = 'block';
    return;
  }
  const btn = document.getElementById('submit-confirm');
  btn.disabled = true;
  try {
    const bench = await submitBenchmark({ game_title:game, cpu_name:cpu, gpu_name:gpu, resolution:res, quality:qual, fps_avg:fpsAvg, fps_min:fpsMin, submitted_by:author });
    allBenchmarks.unshift(bench);
    renderBenchmarks();
    closeSubmit();
    document.getElementById('sub-game').value='';
    document.getElementById('sub-cpu').value='';
    document.getElementById('sub-gpu').value='';
    document.getElementById('sub-fps-avg').value='';
    document.getElementById('sub-fps-min').value='';
    toast('Benchmark eklendi!', 'success');
  } catch {
    errEl.textContent = 'Gönderilemedi. Tekrar deneyin.';
    errEl.style.display = 'block';
  } finally { btn.disabled = false; }
}

// ---- Init ----
async function init() {
  // Sort btn cycles through modes
  const sortBtn = document.getElementById('sort-btn');
  const modes = ['fps_desc','fps_asc','game_asc'];
  sortBtn.addEventListener('click', () => {
    sortMode = modes[(modes.indexOf(sortMode)+1) % modes.length];
    sortBtn.textContent = SORT_LABELS[sortMode];
    renderBenchmarks();
  });

  // Res chips
  document.querySelectorAll('#res-chips .chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#res-chips .chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      filters.resolution = btn.dataset.val;
      renderBenchmarks();
    });
  });

  // Qual chips
  document.querySelectorAll('#qual-chips .chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#qual-chips .chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      filters.quality = btn.dataset.val;
      renderBenchmarks();
    });
  });

  document.getElementById('submit-btn').addEventListener('click', openSubmit);
  document.getElementById('close-submit').addEventListener('click', closeSubmit);
  document.getElementById('submit-modal').addEventListener('click', e => { if (e.target===e.currentTarget) closeSubmit(); });
  document.getElementById('submit-confirm').addEventListener('click', handleSubmit);

  try {
    allBenchmarks = await getBenchmarks();
    populateGameChips();
    renderBenchmarks();
  } catch {
    document.getElementById('bench-list').innerHTML = `<div class="error-banner" style="margin:20px">Veriler yüklenemedi.</div>`;
    document.getElementById('results-count').textContent = '';
  }
}

init();
