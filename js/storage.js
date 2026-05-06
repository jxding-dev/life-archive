/* ============================================
   LIFE ARCHIVE — Storage (LocalStorage CRUD)
   기억 데이터 저장/불러오기/수정/삭제
   ============================================ */

const Storage = (() => {

  const KEYS = {
    MEMORIES:  'life_archive_memories',
    SETTINGS:  'life_archive_settings',
    IS_SAMPLE: 'life_archive_is_sample'
  };


  /* ── 내부 헬퍼 ── */

  function _readAll() {
    try {
      const raw = localStorage.getItem(KEYS.MEMORIES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function _writeAll(memories) {
    try {
      localStorage.setItem(KEYS.MEMORIES, JSON.stringify(memories));
      return true;
    } catch (err) {
      // QuotaExceededError 등 저장소 한계 도달
      console.error('[Storage] 저장 실패:', err);
      return false;
    }
  }


  /* ── 기억 CRUD ── */

  /**
   * 전체 기억 목록 반환 (최신순)
   * @returns {object[]}
   */
  function getAll() {
    const list = _readAll();
    return list.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      if (b.month !== a.month) return b.month - a.month;
      return b.day - a.day;
    });
  }

  /**
   * 단일 기억 반환
   * @param {string} id
   * @returns {object | null}
   */
  function getById(id) {
    return _readAll().find(m => m.id === id) || null;
  }

  /**
   * 기억 저장 (신규)
   * @param {object} memory
   * @returns {object | null}
   */
  function save(memory) {
    if (!memory || !memory.id) return null;
    const list = _readAll();
    // ID 중복 방지 — 같은 ID 발견 시 저장 거부
    if (list.some(m => m.id === memory.id)) return null;
    list.push(memory);
    return _writeAll(list) ? memory : null;
  }

  /**
   * 기억 수정
   * @param {string} id
   * @param {object} changes
   * @returns {object | null}
   */
  function update(id, changes) {
    const list = _readAll();
    const idx  = list.findIndex(m => m.id === id);
    if (idx === -1) return null;

    list[idx] = {
      ...list[idx],
      ...changes,
      id,
      updatedAt: Utils.nowIso()
    };
    _writeAll(list);
    return list[idx];
  }

  /**
   * 기억 삭제
   * @param {string} id
   * @returns {boolean}
   */
  function remove(id) {
    const list     = _readAll();
    const filtered = list.filter(m => m.id !== id);
    if (filtered.length === list.length) return false;
    _writeAll(filtered);
    return true;
  }

  /**
   * 전체 기억 삭제
   */
  function removeAll() {
    localStorage.removeItem(KEYS.MEMORIES);
    localStorage.removeItem(KEYS.IS_SAMPLE);
  }


  /* ── 검색 / 필터 ── */

  /**
   * 조건 필터링
   * @param {{ year?, emotion?, keyword? }} filters
   * @returns {object[]}
   */
  function filter({ year, emotion, keyword } = {}) {
    let list = getAll();

    if (year) {
      list = list.filter(m => m.year === Number(year));
    }

    if (emotion) {
      list = list.filter(m =>
        Array.isArray(m.emotion) && m.emotion.includes(emotion)
      );
    }

    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter(m =>
        (m.title  && m.title.toLowerCase().includes(kw))  ||
        (m.text   && m.text.toLowerCase().includes(kw))   ||
        (Array.isArray(m.tags) && m.tags.some(t => t.toLowerCase().includes(kw)))
      );
    }

    return list;
  }

  function _hasRealMemoryText(memory) {
    const title = String(memory?.title || '').trim();
    const text  = String(memory?.text || '').trim();
    const tempPattern = /^(임시|테스트|test|temp|draft|제목 없음)$/i;

    if (!title || !text) return false;
    if (tempPattern.test(title) || tempPattern.test(text)) return false;
    return true;
  }

  /**
   * "n년 전 오늘" 기억 목록 반환
   * @param {number} yearsAgo
   * @returns {object[]}
   */
  function getMemoriesOnThisDay(yearsAgo) {
    const { year, month, day } = Utils.getDateYearsAgo(yearsAgo);
    return getAll().filter(m =>
      m.year === year &&
      Utils.isSameMonthDay(m, month, day) &&
      _hasRealMemoryText(m)
    );
  }

  /**
   * 사용 중인 연도 목록 반환 (내림차순)
   * @returns {number[]}
   */
  function getUsedYears() {
    const years = [...new Set(_readAll().map(m => m.year))];
    return years.sort((a, b) => b - a);
  }


  /* ── 설정 ── */

  /**
   * 설정 저장
   * @param {object} settings
   */
  function saveSettings(settings) {
    const current = getSettings();
    try {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
      return true;
    } catch (err) {
      console.error('[Storage] 설정 저장 실패:', err);
      return false;
    }
  }

  /**
   * 설정 불러오기
   * @returns {object}
   */
  function getSettings() {
    try {
      const raw = localStorage.getItem(KEYS.SETTINGS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function removeSettings() {
    localStorage.removeItem(KEYS.SETTINGS);
  }


  /* ── 샘플 데이터 플래그 ── */

  function isSampleData() {
    return localStorage.getItem(KEYS.IS_SAMPLE) === 'true';
  }

  function markAsSample(flag = true) {
    localStorage.setItem(KEYS.IS_SAMPLE, String(flag));
  }


  /* ── 공개 API ── */
  const api = {
    getAll,
    getById,
    save,
    update,
    remove,
    removeAll,
    filter,
    getMemoriesOnThisDay,
    getUsedYears,
    saveSettings,
    getSettings,
    removeSettings,
    isSampleData,
    markAsSample
  };

  window.LifeArchiveStorage = api;
  return api;
})();
