import { getAllErrorCodes, searchErrorCodes } from './api.js';

let allCodes = [];
let activeCategory = '';
let searchQuery = '';
let searchTimeout;

const CAT_ICONS = { bsod:'🔵', post:'🟡', beep:'🔊', other:'⚫' };
const CAT_CARD   = { bsod:'cat-icon-bsod', post:'cat-icon-post', beep:'cat-icon-beep', other:'cat-icon-other' };

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function renderCodes(codes) {
  const list = document.getElementById('error-list');
  const badge = document.getElementById('result-badge');
  const label = document.getElementById('results-label');
  badge.textContent = codes.length + ' sonuç';

  if (!codes.length) {
    label.textContent = '0 sonuç';
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>Hata kodu bulunamadı</h3>
        <p>Farklı bir terim deneyin.</p>
      </div>`;
    return;
  }

  label.textContent = `${codes.length} sonuç`;
  list.innerHTML = codes.map(e => `
    <div class="error-card" id="ecard-${e.id}">
      <div class="error-card-header" onclick="toggleCard('${e.id}')">
        <div class="error-cat-icon ${CAT_CARD[e.category] || 'cat-icon-other'}">${CAT_ICONS[e.category] || '⚫'}</div>
        <div class="error-card-main">
          <div class="error-code-text font-mono">${esc(e.code)}</div>
          <div class="error-card-title">${esc(e.title)}</div>
          <div class="error-card-preview">${esc(e.description.slice(0,90))}${e.description.length>90?'...':''}</div>
          <div style="margin-top:6px"><span class="badge badge-${e.category}">${(CAT_ICONS[e.category]||'')+' '+e.category.toUpperCase()}</span></div>
        </div>
        <div class="error-chevron">▾</div>
      </div>
      <div class="error-card-body">
        <p class="error-desc-full">${esc(e.description)}</p>
        ${e.common_causes?.length ? `
          <div class="error-section">
            <div class="error-section-title">Yaygın Nedenler</div>
            <div class="cause-list">
              ${e.common_causes.map(c => `<div class="cause-item">${esc(c)}</div>`).join('')}
            </div>
          </div>
        ` : ''}
        ${e.solutions?.length ? `
          <div class="error-section">
            <div class="error-section-title">Çözümler</div>
            <div class="solution-list">
              ${e.solutions.map((s,i) => `
                <div class="solution-item">
                  <span class="sol-num">${i+1}</span>
                  <span>${esc(s)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        <a href="/support.html" class="expert-cta">
          <span style="font-size:20px">💬</span>
          <span class="expert-cta-text">Hâlâ takıldın mı?</span>
          <span class="expert-cta-link">Uzmana sor →</span>
        </a>
      </div>
    </div>
  `).join('');
}

window.toggleCard = function(id) {
  const card = document.getElementById('ecard-' + id);
  card.classList.toggle('open');
};

async function runSearch() {
  const q = searchQuery.trim();
  if (!q && !activeCategory) { renderCodes(allCodes); return; }
  try {
    let results;
    if (q) {
      results = await searchErrorCodes(q);
      if (activeCategory) results = results.filter(c => c.category === activeCategory);
    } else {
      results = allCodes.filter(c => c.category === activeCategory);
    }
    renderCodes(results);
  } catch {
    document.getElementById('error-list').innerHTML = `<div class="error-banner" style="margin:20px">Arama başarısız.</div>`;
  }
}

// ---- Init ----
async function init() {
  const searchInput = document.getElementById('error-search');
  const clearBtn    = document.getElementById('search-clear');

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    clearBtn.style.display = searchQuery ? 'flex' : 'none';
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(runSearch, 300);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearBtn.style.display = 'none';
    runSearch();
  });

  // Category chips
  document.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.cat-chip').forEach(c => {
        c.classList.remove('active-all','active-bsod','active-post','active-beep');
      });
      activeCategory = chip.dataset.cat;
      const cls = activeCategory ? `active-${activeCategory}` : 'active-all';
      chip.classList.add(cls);
      runSearch();
    });
  });

  // URL pre-fill
  const params = new URLSearchParams(location.search);
  const q = params.get('q');
  if (q) {
    searchInput.value = q;
    searchQuery = q;
    clearBtn.style.display = 'flex';
  }

  try {
    allCodes = await getAllErrorCodes();
    if (searchQuery) {
      await runSearch();
      // Auto-expand direct match
      if (q) {
        const match = allCodes.find(c => c.code.toLowerCase() === q.toLowerCase());
        if (match) setTimeout(() => window.toggleCard(match.id), 200);
      }
    } else {
      renderCodes(allCodes);
    }
  } catch {
    document.getElementById('error-list').innerHTML = `<div class="error-banner" style="margin:20px">Hata kodları yüklenemedi.</div>`;
  }
}

init();
