import { supabase, getThreads, createThread, getMessages, sendMessage } from './api.js';

let threads = [];
let activeThread = null;
let activeFilter = 'all';
let realtimeSub = null;

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function timeAgo(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'az önce';
  if (m < 60) return m + 'dk';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'sa';
  return Math.floor(h/24) + 'g';
}
function toast(msg, type = '') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast${type ? ' ' + type : ''}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ---- Tab switching ----
let activeTabName = 'threads';
function switchTab(name) {
  activeTabName = name;
  document.querySelectorAll('.support-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.getElementById('view-threads').style.display = name === 'threads' ? '' : 'none';
  document.getElementById('view-chat').style.display    = name === 'chat' ? '' : 'none';
}

// ---- Thread list ----
async function loadThreads() {
  try {
    threads = await getThreads();
    renderThreadList();
  } catch {
    document.getElementById('thread-list').innerHTML = `<div class="error-banner" style="margin:20px">Konular yüklenemedi.</div>`;
  }
}

function filteredThreads() {
  const q = (document.getElementById('thread-search')?.value || '').toLowerCase();
  return threads.filter(t => {
    const ms = activeFilter === 'all' || t.status === activeFilter;
    const mq = !q || t.title.toLowerCase().includes(q) || t.author.toLowerCase().includes(q);
    return ms && mq;
  });
}

function getInitial(name) {
  return (name || 'A')[0].toUpperCase();
}

function renderThreadList() {
  const el = document.getElementById('thread-list');
  const items = filteredThreads();
  if (!items.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💬</div><h3>Konu bulunamadı</h3><p>İlk soruyu sen sor!</p></div>`;
    return;
  }
  el.innerHTML = items.map(t => `
    <div class="thread-list-item${activeThread?.id === t.id ? ' active' : ''}" onclick="selectThread('${t.id}')">
      <div class="thread-avatar">${getInitial(t.author)}</div>
      <div class="thread-item-body">
        <div class="thread-item-top">
          <span class="thread-item-author">${esc(t.author)}</span>
          <span class="thread-item-time">${timeAgo(t.updated_at)}</span>
        </div>
        <div class="thread-item-title">${esc(t.title)}</div>
        <div class="thread-item-footer">
          <span class="badge badge-${t.status}">${t.status === 'open' ? '● Açık' : '✓ Çözüldü'}</span>
        </div>
      </div>
    </div>
  `).join('');
}

window.selectThread = async function(id) {
  const thread = threads.find(t => t.id === id);
  if (!thread) return;
  activeThread = thread;
  renderThreadList();

  // Switch to chat tab
  switchTab('chat');
  document.getElementById('chat-placeholder').style.display = 'none';
  const cc = document.getElementById('chat-content');
  cc.style.display = 'flex';

  // Header
  document.getElementById('chat-thread-header').innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
      <div style="flex:1;min-width:0">
        <div class="chat-thread-title">${esc(thread.title)}</div>
        ${thread.hardware_info ? `<div class="chat-thread-hw">💻 ${esc(thread.hardware_info)}</div>` : ''}
      </div>
      <span class="badge badge-${thread.status}">${thread.status === 'open' ? '● Açık' : '✓ Çözüldü'}</span>
    </div>
    <div class="chat-thread-actions">
      <button class="btn btn-ghost btn-sm" onclick="toggleStatus('${thread.id}','${thread.status}')">
        ${thread.status === 'open' ? 'Çözüldü İşaretle' : 'Yeniden Aç'}
      </button>
      <button class="btn btn-ghost btn-sm" onclick="switchTab('threads')">← Konular</button>
    </div>
  `;

  const area = document.getElementById('messages-area');
  area.innerHTML = `<div class="loading-center"><div class="spinner"></div></div>`;
  try {
    const msgs = await getMessages(id);
    renderMessages(msgs);
  } catch {
    area.innerHTML = `<div class="error-banner" style="margin:20px">Mesajlar yüklenemedi.</div>`;
  }

  if (realtimeSub) supabase.removeChannel(realtimeSub);
  realtimeSub = supabase.channel(`msgs_${id}`)
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'support_messages', filter:`thread_id=eq.${id}` },
      p => appendMessage(p.new))
    .subscribe();
};

function renderMessages(msgs) {
  const area = document.getElementById('messages-area');
  if (!msgs.length) {
    area.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💬</div><h3>Henüz mesaj yok</h3><p>İlk mesajı yaz!</p></div>`;
    return;
  }
  area.innerHTML = msgs.map(msgBubble).join('');
  area.scrollTop = area.scrollHeight;
}

function msgBubble(m) {
  const side = m.is_expert ? 'expert' : 'user';
  return `
    <div class="msg ${side}">
      <div class="msg-author">
        ${esc(m.author)}${m.is_expert ? ' <span class="badge badge-expert" style="font-size:10px">Uzman</span>' : ''}
      </div>
      <div class="msg-bubble">${esc(m.content).replace(/\n/g,'<br>')}</div>
      <div class="msg-time">${timeAgo(m.created_at)}</div>
    </div>
  `;
}

function appendMessage(msg) {
  const area = document.getElementById('messages-area');
  const ph = area.querySelector('.empty-state');
  if (ph) area.innerHTML = '';
  area.insertAdjacentHTML('beforeend', msgBubble(msg));
  area.scrollTop = area.scrollHeight;
  const t = threads.find(x => x.id === msg.thread_id);
  if (t) t.updated_at = msg.created_at;
  renderThreadList();
}

window.toggleStatus = function(id, current) {
  const ns = current === 'open' ? 'resolved' : 'open';
  const t = threads.find(x => x.id === id);
  if (t) { t.status = ns; if (activeThread?.id === id) activeThread.status = ns; }
  window.selectThread(id);
  renderThreadList();
  toast(`Konu ${ns === 'resolved' ? 'çözüldü' : 'yeniden açıldı'} olarak işaretlendi`);
};

async function handleSend() {
  if (!activeThread) return;
  const content = document.getElementById('chat-msg').value.trim();
  if (!content) return;
  const author = document.getElementById('chat-author').value.trim() || 'Anonim';
  const isExpert = document.getElementById('is-expert').checked;
  const btn = document.getElementById('send-btn');
  btn.disabled = true;
  try {
    await sendMessage({ thread_id: activeThread.id, author, content, is_expert: isExpert });
    document.getElementById('chat-msg').value = '';
    document.getElementById('chat-msg').style.height = 'auto';
  } catch {
    toast('Mesaj gönderilemedi', 'error');
  } finally {
    btn.disabled = false;
    document.getElementById('chat-msg').focus();
  }
}

// ---- New Thread Modal ----
function openModal() { document.getElementById('new-thread-modal').classList.add('open'); document.getElementById('thread-title').focus(); }
function closeModal() { document.getElementById('new-thread-modal').classList.remove('open'); document.getElementById('thread-error').style.display = 'none'; }

async function handleCreate() {
  const title = document.getElementById('thread-title').value.trim();
  const hw    = document.getElementById('thread-hardware').value.trim();
  const author= document.getElementById('thread-author').value.trim() || 'Anonim';
  const errEl = document.getElementById('thread-error');
  errEl.style.display = 'none';
  if (!title) { errEl.textContent = 'Başlık giriniz.'; errEl.style.display = 'block'; return; }
  const btn = document.getElementById('create-thread-btn');
  btn.disabled = true;
  try {
    const thread = await createThread({ title, hardware_info: hw || null, author });
    threads.unshift(thread);
    renderThreadList();
    closeModal();
    document.getElementById('thread-title').value = '';
    document.getElementById('thread-hardware').value = '';
    await window.selectThread(thread.id);
    toast('Konu oluşturuldu!', 'success');
  } catch {
    errEl.textContent = 'Konu oluşturulamadı. Tekrar deneyin.';
    errEl.style.display = 'block';
  } finally { btn.disabled = false; }
}

// ---- Init ----
async function init() {
  // Tabs
  document.querySelectorAll('.support-tab').forEach(t => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
  });

  // Filter chips
  document.querySelectorAll('.pill-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pill-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.status;
      renderThreadList();
    });
  });

  document.getElementById('thread-search').addEventListener('input', renderThreadList);
  document.getElementById('new-thread-btn').addEventListener('click', openModal);
  document.getElementById('new-thread-btn2').addEventListener('click', openModal);
  document.getElementById('close-modal').addEventListener('click', closeModal);
  document.getElementById('new-thread-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
  document.getElementById('create-thread-btn').addEventListener('click', handleCreate);
  document.getElementById('send-btn').addEventListener('click', handleSend);

  const chatMsg = document.getElementById('chat-msg');
  chatMsg.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend(); });
  chatMsg.addEventListener('input', () => { chatMsg.style.height = 'auto'; chatMsg.style.height = Math.min(chatMsg.scrollHeight, 100) + 'px'; });

  await loadThreads();

  const params = new URLSearchParams(location.search);
  const tid = params.get('thread');
  if (tid && threads.find(t => t.id === tid)) await window.selectThread(tid);
}

init();
