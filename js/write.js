/* ============================================
   LIFE ARCHIVE — Write Page
   기억 작성 / 수정 / 이미지 업로드
   ============================================ */

(() => {

  const SESSION_AUTH_KEY = 'life_archive_authed';


  /* ── 인증 게이트 ─────────────────────────── */

  if (sessionStorage.getItem(SESSION_AUTH_KEY) !== 'true') {
    location.replace('./lock.html');
    return;
  }


  /* ── 요소 캐싱 ───────────────────────────── */

  const $form        = document.getElementById('write-form');
  const $modeLabel   = document.getElementById('write-mode-label');
  const $pageTitle   = document.getElementById('write-page-title');

  const $date        = document.getElementById('w-date');
  const $title       = document.getElementById('w-title');
  const $text        = document.getElementById('w-text');

  const $emotionList = document.getElementById('w-emotion-list');

  const $imageDrop   = document.getElementById('w-image-drop');
  const $imageInput  = document.getElementById('w-image-input');
  const $imagePrev   = document.getElementById('w-image-preview');
  const $imageThumb  = document.getElementById('w-image-thumb');
  const $imageRemove = document.getElementById('w-image-remove');

  const $toggle      = document.getElementById('w-toggle');
  const $extra       = document.getElementById('w-extra');

  const $regret1     = document.getElementById('w-regret-1');
  const $regret2     = document.getElementById('w-regret-2');

  const $location    = document.getElementById('w-location');
  const $people      = document.getElementById('w-people');
  const $tags        = document.getElementById('w-tags');
  const $musicTitle  = document.getElementById('w-music-title');
  const $musicUrl    = document.getElementById('w-music-url');

  const $error       = document.getElementById('w-error');
  const $cancel      = document.getElementById('w-cancel');
  const $submit      = $form.querySelector('button[type="submit"]');


  /* ── 상태 ────────────────────────────────── */

  // 수정 모드: ?id=mem_xxx
  const editId    = new URLSearchParams(location.search).get('id');
  const editing   = !!editId;
  let   original  = null;

  // 이미지 임시 보관 (저장 시 IndexedDB로 커밋)
  let   pendingImageDataUrl = null;
  // 기존 이미지를 유지하는지 표시
  let   keepExistingImage   = editing;


  /* ── 감정 태그 렌더 / 토글 ──────────────── */

  function renderEmotions(selected = []) {
    $emotionList.innerHTML = Emotion.renderAllTags(selected);
  }

  $emotionList.addEventListener('click', (e) => {
    const tag = e.target.closest('.emotion-tag');
    if (!tag) return;
    tag.classList.toggle('selected');
  });

  function getSelectedEmotions() {
    return Array.from($emotionList.querySelectorAll('.emotion-tag.selected'))
      .map(el => el.dataset.emotion);
  }


  /* ── "더 깊이 기록하기" 토글 ────────────── */

  $toggle.addEventListener('click', () => {
    const open = $extra.classList.contains('is-open');
    if (open) {
      $extra.setAttribute('hidden', '');
      $extra.classList.remove('is-open');
      $toggle.textContent = '＋ 더 깊이 기록하기';
    } else {
      $extra.removeAttribute('hidden');
      $extra.classList.add('is-open');
      $toggle.textContent = '− 접기';
    }
  });

  function openExtra() {
    $extra.removeAttribute('hidden');
    $extra.classList.add('is-open');
    $toggle.textContent = '− 접기';
  }


  /* ── 이미지 업로드 / 제거 ────────────────── */

  function showImagePreview(dataUrl) {
    $imageThumb.src = dataUrl;
    $imagePrev.removeAttribute('hidden');
    $imageDrop.style.display = 'none';
  }

  function clearImagePreview() {
    $imageThumb.removeAttribute('src');
    $imagePrev.setAttribute('hidden', '');
    $imageDrop.style.display = '';
    $imageInput.value = '';
  }

  $imageInput.addEventListener('change', async (e) => {
    showError('');
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await ImageCompress.compress(file);
      pendingImageDataUrl = dataUrl;
      keepExistingImage   = false;
      showImagePreview(dataUrl);
    } catch (err) {
      console.error('[Write] 이미지 처리 실패:', err);
      showError(err.message || '이미지를 불러올 수 없습니다');
      $imageInput.value = '';
    }
  });

  $imageRemove.addEventListener('click', () => {
    pendingImageDataUrl = null;
    keepExistingImage   = false;
    clearImagePreview();
  });


  /* ── 에러 / 검증 ─────────────────────────── */

  function showError(msg) {
    $error.textContent = msg || '';
  }

  function parseCsv(value) {
    return (value || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }


  /* ── 수정 모드 프리필 ────────────────────── */

  async function prefillFromExisting() {
    original = Storage.getById(editId);
    if (!original) {
      showError('수정할 기억을 찾을 수 없습니다');
      $submit.disabled = true;
      return;
    }

    $modeLabel.textContent = '기억 수정';
    $pageTitle.textContent = original.title || '기록 다시 보기';

    $date.value  = `${original.year}-${String(original.month).padStart(2, '0')}-${String(original.day).padStart(2, '0')}`;
    $title.value = original.title || '';
    $text.value  = original.text  || '';

    renderEmotions(Array.isArray(original.emotion) ? original.emotion : []);

    if (Array.isArray(original.regretQuestions)) {
      const [q1, q2] = original.regretQuestions;
      if (q1?.answer) $regret1.value = q1.answer;
      if (q2?.answer) $regret2.value = q2.answer;
    }

    $location.value   = original.location || '';
    $people.value     = (original.people || []).join(', ');
    $tags.value       = (original.tags   || []).join(', ');
    $musicTitle.value = original.music?.title || '';
    $musicUrl.value   = original.music?.youtubeUrl || '';

    if (original.regretQuestions?.length || original.location ||
        original.people?.length || original.tags?.length || original.music?.title) {
      openExtra();
    }

    if (original.hasImage && original.imageId) {
      try {
        const url = await ImageStorage.getObjectUrl(original.imageId);
        if (url) showImagePreview(url);
      } catch (err) {
        console.warn('[Write] 기존 이미지 로딩 실패:', err);
      }
    }
  }


  /* ── 폼 데이터 → memory 객체 ─────────────── */

  function buildMemory() {
    const dateVal = $date.value;
    if (!dateVal) throw new Error('날짜를 선택해주세요');

    const [y, m, d] = dateVal.split('-').map(Number);
    if (!y || !m || !d) throw new Error('날짜 형식이 올바르지 않습니다');

    const text = $text.value.trim();
    if (!text) throw new Error('기억 내용을 적어주세요');

    const title    = $title.value.trim();
    const emotions = getSelectedEmotions();

    const regretQuestions = [
      { question: $regret1.dataset.question, answer: $regret1.value.trim() },
      { question: $regret2.dataset.question, answer: $regret2.value.trim() }
    ].filter(q => q.answer);

    const type = regretQuestions.length > 0 ? 'regret' : 'memory';

    const music = ($musicTitle.value.trim() || $musicUrl.value.trim())
      ? {
          title:      $musicTitle.value.trim(),
          youtubeUrl: $musicUrl.value.trim()
        }
      : null;

    const id = editing ? original.id : Utils.createMemoryId(y, m, d);

    return {
      id,
      type,
      year:  y,
      month: m,
      day:   d,
      title,
      text,
      regretQuestions,
      emotion: emotions,
      music,
      location: $location.value.trim(),
      people:   parseCsv($people.value),
      tags:     parseCsv($tags.value),
      hasImage: false,         // 아래에서 이미지 처리 후 갱신
      imageId:  null,
      createdAt: editing ? original.createdAt : Utils.nowIso(),
      updatedAt: Utils.nowIso()
    };
  }


  /* ── 이미지 IndexedDB 커밋 ───────────────── */

  async function commitImage(memory) {
    // 1) 새 이미지 업로드됨
    if (pendingImageDataUrl) {
      const imageId = Utils.createImageId(memory.id);
      const blob    = await (await fetch(pendingImageDataUrl)).blob();
      await ImageStorage.save(imageId, blob);
      memory.hasImage = true;
      memory.imageId  = imageId;
      return;
    }

    // 2) 기존 이미지를 유지 (수정 모드)
    if (editing && keepExistingImage && original?.hasImage) {
      memory.hasImage = true;
      memory.imageId  = original.imageId;
      return;
    }

    // 3) 이미지 제거됨 (수정 모드에서 기존 이미지 정리)
    if (editing && !keepExistingImage && original?.imageId) {
      try { await ImageStorage.remove(original.imageId); } catch {}
    }
  }


  /* ── 제출 ────────────────────────────────── */

  $form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');

    let memory;
    try {
      memory = buildMemory();
    } catch (err) {
      showError(err.message);
      return;
    }

    $submit.disabled = true;
    $submit.textContent = '저장 중…';

    try {
      await commitImage(memory);

      const result = editing
        ? Storage.update(memory.id, memory)
        : Storage.save(memory);

      if (!result) throw new Error('저장에 실패했습니다 (저장소 한계 또는 ID 중복)');

      // 샘플 플래그 해제 — 사용자가 직접 기록을 시작함
      Storage.markAsSample(false);

      location.replace(`./detail.html?id=${encodeURIComponent(memory.id)}`);

    } catch (err) {
      console.error('[Write] 저장 실패:', err);
      showError(err.message || '저장에 실패했습니다');
      $submit.disabled = false;
      $submit.textContent = editing ? '수정 저장' : '기록하기';
    }
  });


  /* ── 취소 ────────────────────────────────── */

  $cancel.addEventListener('click', () => {
    if (history.length > 1) history.back();
    else location.href = './index.html';
  });


  /* ── 초기화 ──────────────────────────────── */

  function initDateDefault() {
    const t = Utils.getToday();
    $date.value = `${t.year}-${String(t.month).padStart(2, '0')}-${String(t.day).padStart(2, '0')}`;
  }

  (async function init() {
    renderEmotions();
    if (editing) {
      $submit.textContent = '수정 저장';
      await prefillFromExisting();
    } else {
      initDateDefault();
    }
  })();

})();
