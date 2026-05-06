/* ============================================
   LIFE ARCHIVE — Emotion
   감정 색상 맵 / 감정 통계 계산
   ============================================ */

const Emotion = (() => {

  /* ── 감정 정의 (variables.css 색상과 동기화) ── */

  const EMOTION_MAP = {
    '행복':  { color: '#C4883A', cssVar: '--emotion-happy',    emoji: '☀️' },
    '불안':  { color: '#7B6A9E', cssVar: '--emotion-anxiety',  emoji: '🌀' },
    '분노':  { color: '#B85C5C', cssVar: '--emotion-anger',    emoji: '🔥' },
    '무기력':{ color: '#8A8070', cssVar: '--emotion-lethargy', emoji: '🌫️' },
    '외로움':{ color: '#5A7A9A', cssVar: '--emotion-lonely',   emoji: '🌙' },
    '희망':  { color: '#5A8A6A', cssVar: '--emotion-hope',     emoji: '🌱' },
    '후회':  { color: '#A87A4A', cssVar: '--emotion-regret',   emoji: '🍂' },
    '설렘':  { color: '#A86A80', cssVar: '--emotion-excited',  emoji: '✨' },
    '두려움':{ color: '#4A6A7A', cssVar: '--emotion-fear',     emoji: '🌊' },
    '혼란':  { color: '#7A7A7A', cssVar: '--emotion-confused', emoji: '💭' }
  };

  const EMOTION_NAMES = Object.keys(EMOTION_MAP);


  /* ── 색상 조회 ── */

  function getColor(emotionName) {
    return EMOTION_MAP[emotionName]?.color ?? '#8A8070';
  }

  function getCssVar(emotionName) {
    return EMOTION_MAP[emotionName]?.cssVar ?? '--emotion-lethargy';
  }

  function getEmoji(emotionName) {
    return EMOTION_MAP[emotionName]?.emoji ?? '•';
  }

  function getAll() {
    return { ...EMOTION_MAP };
  }


  /* ── 통계 계산 ── */

  /**
   * 기억 배열 → 감정별 카운트 맵
   * @param {object[]} memories
   * @returns {{ [emotionName: string]: number }}
   */
  function countByEmotion(memories) {
    const counts = {};
    EMOTION_NAMES.forEach(name => { counts[name] = 0; });

    memories.forEach(m => {
      if (!Array.isArray(m.emotion)) return;
      m.emotion.forEach(e => {
        if (counts[e] !== undefined) counts[e]++;
      });
    });

    return counts;
  }

  /**
   * 카운트 맵 → 비율(%) 맵
   * @param {{ [emotionName: string]: number }} counts
   * @returns {{ [emotionName: string]: number }}
   */
  function toPct(counts) {
    const total = Object.values(counts).reduce((s, n) => s + n, 0);
    if (total === 0) return Object.fromEntries(Object.keys(counts).map(k => [k, 0]));
    return Object.fromEntries(
      Object.entries(counts).map(([k, v]) => [k, Math.round((v / total) * 100)])
    );
  }

  /**
   * 기억 배열 → 상위 N개 감정 반환
   * @param {object[]} memories
   * @param {number} topN
   * @returns {{ name: string, count: number, pct: number, color: string, emoji: string }[]}
   */
  function getTopEmotions(memories, topN = 5) {
    const counts = countByEmotion(memories);
    const pcts   = toPct(counts);

    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topN)
      .map(([name, count]) => ({
        name,
        count,
        pct:   pcts[name],
        color: getColor(name),
        emoji: getEmoji(name)
      }));
  }

  /**
   * 기억 배열 → 연도별 주요 감정 맵
   * @param {object[]} memories
   * @returns {{ [year: string]: string }}
   */
  function getDominantByYear(memories) {
    const byYear = {};

    memories.forEach(m => {
      const y = String(m.year);
      if (!byYear[y]) byYear[y] = {};
      if (!Array.isArray(m.emotion)) return;
      m.emotion.forEach(e => {
        byYear[y][e] = (byYear[y][e] || 0) + 1;
      });
    });

    const result = {};
    Object.entries(byYear).forEach(([year, counts]) => {
      const dominant = Object.entries(counts).sort(([, a], [, b]) => b - a)[0];
      result[year] = dominant ? dominant[0] : null;
    });

    return result;
  }


  /* ── HTML 렌더 헬퍼 ── */

  /**
   * 감정 태그 HTML 문자열 생성
   * @param {string} emotionName
   * @param {boolean} selected
   * @returns {string}
   */
  function renderTag(emotionName, selected = false) {
    const cls  = selected ? 'emotion-tag selected' : 'emotion-tag';
    const safe = (typeof Utils !== 'undefined' && Utils.escapeHtml)
      ? Utils.escapeHtml(emotionName)
      : String(emotionName ?? '');
    return `<span class="${cls}" data-emotion="${safe}">${safe}</span>`;
  }

  /**
   * 전체 감정 태그 목록 HTML 반환
   * @param {string[]} selectedEmotions
   * @returns {string}
   */
  function renderAllTags(selectedEmotions = []) {
    return EMOTION_NAMES
      .map(name => renderTag(name, selectedEmotions.includes(name)))
      .join('');
  }


  /* ── 공개 API ── */
  return {
    EMOTION_NAMES,
    getAll,
    getColor,
    getCssVar,
    getEmoji,
    countByEmotion,
    toPct,
    getTopEmotions,
    getDominantByYear,
    renderTag,
    renderAllTags
  };
})();
