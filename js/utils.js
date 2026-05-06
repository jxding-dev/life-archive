/* ============================================
   LIFE ARCHIVE — Utils
   날짜 포맷 / ID 생성 / 날짜 파싱
   ============================================ */

const Utils = (() => {

  /* ── ID 생성 ── */

  /**
   * 기억 고유 ID 생성
   * @param {number} year
   * @param {number} month
   * @param {number} day
   * @returns {string} "mem_YYYYMMDD_XXXXXX"
   */
  function createMemoryId(year, month, day) {
    const datePart = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
    return `mem_${datePart}_${_randomToken(6)}`;
  }

  /**
   * 충돌 위험 낮춘 랜덤 토큰 (crypto 우선, 폴백 Math.random)
   * @param {number} len
   * @returns {string}
   */
  function _randomToken(len = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const out = new Array(len);
    if (window.crypto && window.crypto.getRandomValues) {
      const buf = new Uint32Array(len);
      window.crypto.getRandomValues(buf);
      for (let i = 0; i < len; i++) out[i] = chars[buf[i] % chars.length];
    } else {
      for (let i = 0; i < len; i++) out[i] = chars[Math.floor(Math.random() * chars.length)];
    }
    return out.join('');
  }

  /**
   * 이미지 고유 ID 생성
   * @param {string} memoryId
   * @returns {string} "img_YYYYMMDD_XXX"
   */
  function createImageId(memoryId) {
    return memoryId.replace('mem_', 'img_');
  }


  /* ── 날짜 포맷 ── */

  /**
   * ISO 문자열 → "YYYY.MM.DD"
   * @param {string} isoString
   * @returns {string}
   */
  function formatDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d)) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
  }

  /**
   * year/month/day 숫자 → "YYYY.MM.DD"
   * @param {number} year
   * @param {number} month
   * @param {number} day
   * @returns {string}
   */
  function formatMemoryDate(year, month, day) {
    return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
  }

  /**
   * n년 전 오늘 날짜 반환
   * @param {number} yearsAgo
   * @returns {{ year: number, month: number, day: number }}
   */
  function getDateYearsAgo(yearsAgo) {
    const now = new Date();
    return {
      year:  now.getFullYear() - yearsAgo,
      month: now.getMonth() + 1,
      day:   now.getDate()
    };
  }

  /**
   * 오늘 날짜 반환
   * @returns {{ year: number, month: number, day: number }}
   */
  function getToday() {
    const now = new Date();
    return {
      year:  now.getFullYear(),
      month: now.getMonth() + 1,
      day:   now.getDate()
    };
  }

  /**
   * ISO 현재 시각 문자열 반환
   * @returns {string}
   */
  function nowIso() {
    return new Date().toISOString();
  }


  /* ── 날짜 파싱 ── */

  /**
   * "YYYY.MM.DD" → { year, month, day }
   * @param {string} dateStr
   * @returns {{ year: number, month: number, day: number } | null}
   */
  function parseDateString(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('.');
    if (parts.length !== 3) return null;
    const year  = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day   = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return { year, month, day };
  }

  /**
   * 기억이 특정 월·일과 같은지 확인 (n년 전 오늘 조회용)
   * @param {object} memory
   * @param {number} month
   * @param {number} day
   * @returns {boolean}
   */
  function isSameMonthDay(memory, month, day) {
    return memory.month === month && memory.day === day;
  }


  /* ── 문자열 유틸 ── */

  /**
   * 긴 텍스트 자르기
   * @param {string} str
   * @param {number} maxLength
   * @returns {string}
   */
  function truncate(str, maxLength = 80) {
    if (!str) return '';
    return str.length > maxLength ? str.slice(0, maxLength) + '…' : str;
  }

  /**
   * XSS 방지용 HTML 이스케이프
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }


  /* ── 공개 API ── */
  return {
    createMemoryId,
    createImageId,
    formatDate,
    formatMemoryDate,
    getDateYearsAgo,
    getToday,
    nowIso,
    parseDateString,
    isSameMonthDay,
    truncate,
    escapeHtml
  };
})();
