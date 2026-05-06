/* ============================================
   LIFE ARCHIVE — Archive Page
   연도/감정/키워드 필터 + 연도별 카드 목록
   ============================================ */

(() => {

  const SESSION_AUTH_KEY = 'life_archive_authed';


  /* ── 인증 게이트 ─────────────────────────── */

  if (sessionStorage.getItem(SESSION_AUTH_KEY) !== 'true') {
    location.replace('./lock.html');
    return;
  }


  /* ── 요소 ────────────────────────────────── */

  const $kw       = document.getElementById('f-keyword');
  const $year     = document.getElementById('f-year');
  const $emotions = document.getElementById('f-emotions');
  const $reset    = document.getElementById('f-reset');
  const $meta     = document.getElementById('archive-meta');
  const $result   = document.getElementById('archive-result');

  const StorageApi = (typeof Storage !== 'undefined' && typeof Storage.getUsedYears === 'function')
    ? Storage
    : window.LifeArchiveStorage;


  /* ── 상태 ────────────────────────────────── */

  const filters = {
    year:    new URLSearchParams(location.search).get('year') || '',
    emotion: '',
    keyword: ''
  };

  // 객체 URL 추적 → 다시 그릴 때 메모리 누수 방지
  let activeBlobUrls = [];


  /* ── 필터 UI 초기화 ──────────────────────── */

  function initYearOptions() {
    const years = StorageApi.getUsedYears();
    years.forEach(y => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = `${y}년`;
      $year.appendChild(opt);
    });
    if (filters.year) $year.value = filters.year;
  }

  function initEmotionFilter() {
    $emotions.innerHTML = Emotion.renderAllTags();
  }


  /* ── 카드 렌더 (XSS 안전 — 모든 동적값 escape) ── */

  function renderCard(m) {
    const dateText = Utils.formatMemoryDate(m.year, m.month, m.day);
    const title    = Utils.escapeHtml(m.title || '제목 없음');
    const text     = Utils.escapeHtml(Utils.truncate(m.text || '', 120));

    const emotionTags = (Array.isArray(m.emotion) ? m.emotion : [])
      .slice(0, 3)
      .map(e => Emotion.renderTag(e))
      .join('');

    const typeBadge = m.type === 'regret'
      ? '<span class="badge badge-regret">회고</span>'
      : '';

    const safeId = Utils.escapeHtml(m.id);

    return `
      <article class="memory-card" data-id="${safeId}" tabindex="0" role="link">
        <div class="memory-card-image-placeholder" data-image-id="${Utils.escapeHtml(m.imageId || '')}">
          ${m.hasImage ? '' : '◌'}
        </div>
        <div class="memory-card-body">
          <div class="memory-card-meta">
            <span class="badge badge-date">${Utils.escapeHtml(dateText)}</span>
            ${typeBadge}
          </div>
          <h3 class="memory-card-title">${title}</h3>
          <p class="memory-card-text">${text}</p>
          <div class="memory-card-footer">${emotionTags}</div>
        </div>
      </article>
    `;
  }


  /* ── 연도별 그룹 렌더 ────────────────────── */

  function renderGroups(memories) {
    // 기존 blob URL 정리
    activeBlobUrls.forEach(url => ImageStorage.revokeObjectUrl(url));
    activeBlobUrls = [];

    if (memories.length === 0) {
      $result.innerHTML = `
        <div class="archive-empty">
          조건에 맞는 기억이 없습니다.
        </div>`;
      return;
    }

    const byYear = new Map();
    memories.forEach(m => {
      if (!byYear.has(m.year)) byYear.set(m.year, []);
      byYear.get(m.year).push(m);
    });

    const years = Array.from(byYear.keys()).sort((a, b) => b - a);

    const html = years.map(y => {
      const list = byYear.get(y);
      const cards = list.map(renderCard).join('');
      return `
        <section class="year-group">
          <header class="year-group-header">
            <h2 class="year-group-title">${y}</h2>
            <span class="year-group-count">${list.length}개의 기억</span>
          </header>
          <div class="year-group-list">${cards}</div>
        </section>
      `;
    }).join('');

    $result.innerHTML = html;

    bindCardClicks();
    loadThumbnails(memories);
  }


  /* ── 카드 클릭 ───────────────────────────── */

  function bindCardClicks() {
    $result.querySelectorAll('.memory-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        if (id) location.href = `./detail.html?id=${encodeURIComponent(id)}`;
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });
  }


  /* ── 썸네일 비동기 로드 ──────────────────── */

  async function loadThumbnails(memories) {
    for (const m of memories) {
      if (!m.hasImage || !m.imageId) continue;
      try {
        const url = await ImageStorage.getObjectUrl(m.imageId);
        if (!url) continue;

        const placeholder = $result.querySelector(
          `.memory-card[data-id="${CSS.escape(m.id)}"] .memory-card-image-placeholder`
        );
        if (!placeholder) continue;

        const img = document.createElement('img');
        img.className = 'memory-card-image';
        img.alt = m.title || '기억 이미지';
        img.src = url;
        placeholder.replaceWith(img);

        if (url.startsWith('blob:')) activeBlobUrls.push(url);
      } catch (err) {
        console.warn('[Archive] 썸네일 로딩 실패:', err);
      }
    }
  }


  /* ── 필터 적용 / 결과 ─────────────────────── */

  function applyFilters() {
    const list = StorageApi.filter({
      year:    filters.year || undefined,
      emotion: filters.emotion || undefined,
      keyword: filters.keyword || undefined
    });
    $meta.textContent = `${list.length}개의 기억`;
    renderGroups(list);
  }


  /* ── 이벤트 ──────────────────────────────── */

  $kw.addEventListener('input', () => {
    filters.keyword = $kw.value.trim();
    applyFilters();
  });

  $year.addEventListener('change', () => {
    filters.year = $year.value;
    applyFilters();
  });

  $emotions.addEventListener('click', (e) => {
    const tag = e.target.closest('.emotion-tag');
    if (!tag) return;

    // 동시에 하나만 활성 (라디오 방식)
    const wasSelected = tag.classList.contains('selected');
    $emotions.querySelectorAll('.emotion-tag.selected')
      .forEach(t => t.classList.remove('selected'));

    if (!wasSelected) tag.classList.add('selected');
    filters.emotion = tag.classList.contains('selected') ? tag.dataset.emotion : '';
    applyFilters();
  });

  $reset.addEventListener('click', () => {
    filters.year = '';
    filters.emotion = '';
    filters.keyword = '';
    $kw.value = '';
    $year.value = '';
    $emotions.querySelectorAll('.emotion-tag.selected')
      .forEach(t => t.classList.remove('selected'));
    applyFilters();
  });


  /* ── 페이지 떠날 때 blob URL 정리 ────────── */

  window.addEventListener('pagehide', () => {
    activeBlobUrls.forEach(url => ImageStorage.revokeObjectUrl(url));
    activeBlobUrls = [];
  });


  /* ── 초기화 ──────────────────────────────── */

  initYearOptions();
  initEmotionFilter();
  applyFilters();

})();
