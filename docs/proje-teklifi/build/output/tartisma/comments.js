// MatPortal Proje Teklifi — Yorum Sistemi
// Statik HTML için: localStorage tabanlı geçici çözüm.
// Production: Promats admin panel API'sine bağlanır (POST /admin/teklif-yorum)

(function () {
  'use strict';

  const STORAGE_KEY = 'matportal_yorumlar_' + (window.DOC_ID || 'genel');

  function getYorumlar() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function setYorumlar(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleString('tr-TR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;',
        '"': '&quot;', "'": '&#39;',
      })[c];
    });
  }

  function renderYorumlar() {
    const list = getYorumlar();
    const container = document.querySelector('.comments-list');
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = '<p style="color: var(--fg-muted); font-style: italic;">Henüz yorum yok. İlk yorumu siz yazın.</p>';
      return;
    }

    container.innerHTML = list.map(function (y) {
      return `
        <div class="comment-item" data-id="${y.id}">
          <div class="meta">
            <span class="author">${escapeHtml(y.yazar)}</span>
            · ${formatDate(y.tarih)}
            ${y.yanit ? '· <em>(yanıtlandı)</em>' : ''}
          </div>
          <div class="body">${escapeHtml(y.metin)}</div>
          ${y.yanit ? `
            <div style="margin-top: 8px; padding: 8px 12px; background: var(--accent-soft); border-radius: 6px;">
              <div class="meta"><span class="author">Yanıt:</span></div>
              <div class="body">${escapeHtml(y.yanit)}</div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  function addYorum(yazar, metin) {
    const list = getYorumlar();
    list.push({
      id: 'y-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      yazar: yazar.trim() || 'İsimsiz',
      metin: metin.trim(),
      tarih: new Date().toISOString(),
    });
    setYorumlar(list);
    renderYorumlar();
  }

  function init() {
    renderYorumlar();
    const form = document.querySelector('.comment-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const yazar = form.querySelector('input[name="yazar"]').value;
      const metin = form.querySelector('textarea[name="metin"]').value;
      if (!metin.trim()) return;
      addYorum(yazar, metin);
      form.querySelector('textarea[name="metin"]').value = '';
    });
  }

  // Export butonu — yorumlar JSON olarak indirir
  window.exportYorumlar = function () {
    const list = getYorumlar();
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yorumlar_' + (window.DOC_ID || 'genel') + '_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
