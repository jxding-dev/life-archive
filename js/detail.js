/* ============================================
   LIFE ARCHIVE — Detail Page
   기억 상세 / 수정 / 삭제
   ============================================ */

(() => {

  const SESSION_AUTH_KEY = 'life_archive_authed';


  /* ── 인증 게이트 ─────────────────────────── */

  if (sessionStorage.getItem(SESSION_AUTH_KEY) !== 'true') {
    location.replace('./lock.html');
    return;
  }


  /* ── 요소 ────────────────────────────────── */

  const $article = document.getElementById('detail-article');
  const $empty   = document.getElementById('detail-empty');


  /* ── 상태 ────────────────────────────────── */

  const id = new URLSearchParams(location.search).get('id');
  let blobUrl = null;


  /* ── ID 없음 / 데이터 없음 처리 ──────────── */

  if (!id) {
    showEmpty();
    return;
  }

  const memory = Storage.getById(id);
  if (!memory) {
    showEmpty();
    return;
  }


  /* ── 렌더 ────────────────────────────────── */

  function showEmpty() {
    $article.setAttribute('hidden', '');
    $empty.removeAttribute('hidden');
  }

  function buildHtml(m) {
    const esc       = Utils.escapeHtml;
    const dateText  = Utils.formatMemoryDate(m.year, m.month, m.day);
    const created   = Utils.formatDate(m.createdAt);

    const typeBadge = m.type === 'regret'
      ? '<span class="badge badge-regret">회고</span>'
      : '<span class="badge badge-gold">기억</span>';

    const emotions  = (Array.isArray(m.emotion) ? m.emotion : [])
      .map(e => Emotion.renderTag(e))
      .join('');

    /* 회고 Q&A — answer 있는 항목만 */
    const regretHtml = (Array.isArray(m.regretQuestions) ? m.regretQuestions : [])
      .filter(q => q && q.answer)
      .map(q => `
        <div class="detail-regret-item">
          <p class="detail-regret-q">${esc(q.question)}</p>
          <p class="detail-regret-a">${esc(q.answer)}</p>
        </div>
      `).join('');

    /* 음악 */
    let musicHtml = '';
    if (m.music && (m.music.title || m.music.youtubeUrl)) {
      const t = esc(m.music.title || '제목 없음');
      const u = m.music.youtubeUrl || '';
      const safeUrl = /^https?:\/\//i.test(u) ? u : '';
      musicHtml = `
        <section class="detail-section">
          <p class="detail-section-title">Music</p>
          <p class="detail-section-body">
            ${safeUrl
              ? `<a class="detail-music-link" href="${esc(safeUrl)}" target="_blank" rel="noopener noreferrer">${t} ↗</a>`
              : t}
          </p>
        </section>
      `;
    }

    /* 장소 */
    const locationHtml = m.location ? `
      <section class="detail-section">
        <p class="detail-section-title">Place</p>
        <p class="detail-section-body">${esc(m.location)}</p>
      </section>
    ` : '';

    /* 사람 */
    const peopleHtml = (Array.isArray(m.people) && m.people.length) ? `
      <section class="detail-section">
        <p class="detail-section-title">With</p>
        <div class="detail-chip-list">
          ${m.people.map(p => `<span class="detail-chip">${esc(p)}</span>`).join('')}
        </div>
      </section>
    ` : '';

    /* 태그 */
    const tagsHtml = (Array.isArray(m.tags) && m.tags.length) ? `
      <section class="detail-section">
        <p class="detail-section-title">Tags</p>
        <div class="detail-chip-list">
          ${m.tags.map(t => `<span class="detail-chip">#${esc(t)}</span>`).join('')}
        </div>
      </section>
    ` : '';

    /* 회고 */
    const regretSection = regretHtml ? `
      <section class="detail-section">
        <p class="detail-section-title">Reflection</p>
        ${regretHtml}
      </section>
    ` : '';

    /* 이미지 자리 — 실제 src는 비동기로 채움 */
    const imageHtml = m.hasImage ? `<img id="detail-img" class="detail-image" alt="${esc(m.title || '')}" />` : '';

    return `
      <header class="detail-meta">
        <span class="badge badge-date">${esc(dateText)}</span>
        ${typeBadge}
      </header>

      ${imageHtml}

      <h1 class="detail-title">${esc(m.title || '제목 없음')}</h1>

      ${m.text ? `<p class="detail-text">${esc(m.text)}</p>` : ''}

      ${emotions ? `<div class="detail-emotions">${emotions}</div>` : ''}

      ${regretSection}
      ${musicHtml}
      ${locationHtml}
      ${peopleHtml}
      ${tagsHtml}

      <p class="detail-footer">
        기록일 ${esc(created || '—')}${m.updatedAt && m.updatedAt !== m.createdAt
          ? ` · 수정 ${esc(Utils.formatDate(m.updatedAt))}`
          : ''}
      </p>

      <div class="detail-actions">
        <button type="button" class="btn btn-danger" id="detail-delete">삭제</button>
        <button type="button" class="btn btn-primary" id="detail-edit">수정</button>
      </div>
    `;
  }


  async function loadImage() {
    if (!memory.hasImage || !memory.imageId) return;
    try {
      const url = await ImageStorage.getObjectUrl(memory.imageId);
      if (!url) return;
      const $img = document.getElementById('detail-img');
      if ($img) $img.src = url;
      if (url.startsWith('blob:')) blobUrl = url;
    } catch (err) {
      console.warn('[Detail] 이미지 로딩 실패:', err);
    }
  }


  /* ── 액션 ────────────────────────────────── */

  function bindActions() {
    document.getElementById('detail-edit').addEventListener('click', () => {
      location.href = `./write.html?id=${encodeURIComponent(memory.id)}`;
    });

    document.getElementById('detail-delete').addEventListener('click', async () => {
      const ok = confirm('이 기억을 삭제할까요?\n삭제 후 복구할 수 없습니다.');
      if (!ok) return;

      // 이미지 먼저 정리
      if (memory.hasImage && memory.imageId) {
        try { await ImageStorage.remove(memory.imageId); } catch {}
      }
      const removed = Storage.remove(memory.id);
      if (!removed) {
        alert('삭제에 실패했습니다');
        return;
      }
      location.replace('./archive.html');
    });
  }


  /* ── pagehide → blob URL 정리 ────────────── */

  window.addEventListener('pagehide', () => {
    if (blobUrl) ImageStorage.revokeObjectUrl(blobUrl);
    blobUrl = null;
  });


  /* ── 초기화 ──────────────────────────────── */

  $article.innerHTML = buildHtml(memory);
  $article.removeAttribute('hidden');
  bindActions();
  loadImage();

})();
