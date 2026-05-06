/* ============================================
   LIFE ARCHIVE — Home Page
   허브 / 오늘의 기억 / 감정 흐름
   ============================================ */

(() => {

  if (sessionStorage.getItem('life_archive_authed') !== 'true') {
    location.replace('./lock.html');
    return;
  }

  const $label        = document.getElementById('home-label');
  const $summary      = document.getElementById('home-summary');
  const $total        = document.getElementById('home-total');
  const $years        = document.getElementById('home-years');
  const $topEmotion   = document.getElementById('home-top-emotion');
  const $todaySection = document.getElementById('on-this-day-section');
  const $todayList    = document.getElementById('on-this-day-list');
  const $emotionSec   = document.getElementById('emotion-section');
  const $emotionChart = document.getElementById('home-emotion-chart');
  const $empty        = document.getElementById('home-empty');

  const memories = Storage.getAll();
  const settings = Storage.getSettings();

  function renderHeader() {
    if (settings.nickname) {
      $label.textContent = `${settings.nickname}의 Life Archive`;
    }
  }

  function renderSummary(topEmotions) {
    if (memories.length === 0) return;
    $total.textContent = String(memories.length);
    $years.textContent = String(Storage.getUsedYears().length);
    $topEmotion.textContent = topEmotions[0] ? topEmotions[0].name : '—';
    $summary.removeAttribute('hidden');
  }

  function createMemoryCard(memory, yearsAgo) {
    const article = document.createElement('article');
    article.className = 'memory-card';
    article.tabIndex = 0;
    article.setAttribute('role', 'link');
    article.dataset.id = memory.id;

    const image = document.createElement('div');
    image.className = 'memory-card-image-placeholder';
    image.textContent = '◌';

    const body = document.createElement('div');
    body.className = 'memory-card-body';

    const note = document.createElement('p');
    note.className = 'home-memory-note';
    note.textContent = `${yearsAgo}년 전 오늘`;

    const title = document.createElement('h3');
    title.className = 'memory-card-title';
    title.textContent = memory.title || '제목 없음';

    const text = document.createElement('p');
    text.className = 'memory-card-text';
    text.textContent = Utils.truncate(memory.text || '', 120);

    const footer = document.createElement('div');
    footer.className = 'memory-card-footer';
    footer.innerHTML = (Array.isArray(memory.emotion) ? memory.emotion : [])
      .slice(0, 3)
      .map(name => Emotion.renderTag(name))
      .join('');

    body.append(note, title, text, footer);
    article.append(image, body);

    article.addEventListener('click', () => {
      location.href = `./detail.html?id=${encodeURIComponent(memory.id)}`;
    });
    article.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        article.click();
      }
    });

    return article;
  }

  function renderOnThisDay() {
    const items = [];
    [1, 3, 5].forEach(yearsAgo => {
      Storage.getMemoriesOnThisDay(yearsAgo)
        .forEach(memory => items.push({ yearsAgo, memory }));
    });

    if (items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state-desc';
      empty.textContent = '아직 오늘과 이어진 기억이 없어요';
      $todayList.appendChild(empty);
      $todaySection.removeAttribute('hidden');
      return;
    }

    const fragment = document.createDocumentFragment();
    items
      .sort((a, b) => b.memory.year - a.memory.year)
      .slice(0, 1)
      .forEach(item => {
      fragment.appendChild(createMemoryCard(item.memory, item.yearsAgo));
    });
    $todayList.appendChild(fragment);
    $todaySection.removeAttribute('hidden');
  }

  function renderEmotionChart(topEmotions) {
    if (topEmotions.length === 0) return;

    topEmotions.forEach(item => {
      const row = document.createElement('div');
      row.className = 'emotion-bar-item';

      const icon = document.createElement('span');
      icon.className = 'emotion-bar-icon';
      icon.textContent = item.emoji;

      const track = document.createElement('div');
      track.className = 'emotion-bar-track';

      const fill = document.createElement('div');
      fill.className = 'emotion-bar-fill';
      fill.style.width = `${item.pct}%`;
      fill.style.backgroundColor = item.color;
      track.appendChild(fill);

      const pct = document.createElement('span');
      pct.className = 'emotion-bar-pct';
      pct.textContent = `${item.pct}%`;

      row.append(icon, track, pct);
      $emotionChart.appendChild(row);
    });

    $emotionSec.removeAttribute('hidden');
  }

  function renderEmpty() {
    if (memories.length > 0 || Storage.isSampleData()) return;
    $empty.removeAttribute('hidden');
  }

  const topEmotions = Emotion.getTopEmotions(memories, 5);
  renderHeader();
  renderSummary(topEmotions);
  renderOnThisDay();
  renderEmotionChart(topEmotions);
  renderEmpty();

})();
