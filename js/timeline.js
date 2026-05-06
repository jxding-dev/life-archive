/* ============================================
   LIFE ARCHIVE — Timeline Page
   연도별 감정 흐름
   ============================================ */

(() => {

  if (sessionStorage.getItem('life_archive_authed') !== 'true') {
    location.replace('./lock.html');
    return;
  }

  const $result = document.getElementById('timeline-result');
  const $empty  = document.getElementById('timeline-empty');

  const memories = Storage.getAll();
  const dominantByYear = Emotion.getDominantByYear(memories);

  function groupByYear() {
    const map = new Map();
    memories.forEach(memory => {
      if (!map.has(memory.year)) map.set(memory.year, []);
      map.get(memory.year).push(memory);
    });
    return Array.from(map.entries()).sort(([a], [b]) => b - a);
  }

  function getYearSummary(list) {
    const first = list[0];
    return {
      title: first?.title || '제목 없음',
      text: Utils.truncate(first?.text || '', 110)
    };
  }

  function createYearNode(year, list) {
    const dominant = dominantByYear[String(year)];
    const row = document.createElement('article');
    row.className = 'timeline-year';

    const dot = document.createElement('div');
    dot.className = 'timeline-dot';
    if (dominant) dot.style.backgroundColor = Emotion.getColor(dominant);

    const card = document.createElement('div');
    card.className = 'timeline-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'link');

    const header = document.createElement('div');
    header.className = 'timeline-card-header';

    const title = document.createElement('h2');
    title.className = 'timeline-year-title';
    title.textContent = String(year);

    const count = document.createElement('span');
    count.className = 'timeline-count';
    count.textContent = `${list.length}개의 기억`;

    header.append(title, count);

    const body = document.createElement('div');
    body.className = 'timeline-body';

    const summary = getYearSummary(list);
    const memoryTitle = document.createElement('p');
    memoryTitle.className = 'timeline-title';
    memoryTitle.textContent = summary.title;

    const text = document.createElement('p');
    text.className = 'timeline-text';
    text.textContent = summary.text;

    const emotions = document.createElement('div');
    emotions.className = 'timeline-emotions';
    if (dominant) emotions.innerHTML = Emotion.renderTag(dominant, true);

    body.append(memoryTitle, text, emotions);
    card.append(header, body);
    row.append(dot, card);

    function goArchive() {
      location.href = `./archive.html?year=${encodeURIComponent(year)}`;
    }

    card.addEventListener('click', goArchive);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goArchive();
      }
    });

    return row;
  }

  function render() {
    const groups = groupByYear();
    if (groups.length === 0) {
      $empty.removeAttribute('hidden');
      return;
    }

    const fragment = document.createDocumentFragment();
    groups.forEach(([year, list]) => {
      fragment.appendChild(createYearNode(year, list));
    });
    $result.appendChild(fragment);
  }

  render();

})();
