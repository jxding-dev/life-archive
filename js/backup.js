/* ============================================
   LIFE ARCHIVE — Backup Page
   JSON/TXT 내보내기 및 JSON 복원
   ============================================ */

(() => {

  if (sessionStorage.getItem('life_archive_authed') !== 'true') {
    location.replace('./lock.html');
    return;
  }

  const $exportJson = document.getElementById('export-json');
  const $exportTxt  = document.getElementById('export-txt');
  const $importJson = document.getElementById('import-json');
  const $message    = document.getElementById('import-message');

  if (!$exportJson || !$exportTxt || !$importJson || !$message) return;

  function setMessage(msg, isError = false) {
    $message.textContent = msg || '';
    $message.classList.toggle('is-error', isError);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function dateStamp() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  async function readImageBackup(memory) {
    if (!memory.hasImage || !memory.imageId) return null;
    const data = await ImageStorage.get(memory.imageId);
    if (!data) return null;
    const dataUrl = typeof data === 'string' ? data : await blobToDataUrl(data);
    return { id: memory.imageId, dataUrl };
  }

  async function buildJsonBackup() {
    const memories = Storage.getAll();
    const imageEntries = [];

    for (const memory of memories) {
      const image = await readImageBackup(memory);
      if (image) imageEntries.push(image);
    }

    return {
      app: 'Life Archive',
      version: 1,
      exportedAt: Utils.nowIso(),
      memories,
      settings: Storage.getSettings(),
      images: imageEntries
    };
  }

  function validateBackup(data) {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.memories)) return false;
    if (data.images && !Array.isArray(data.images)) return false;
    return data.memories.every(memory => memory && typeof memory.id === 'string');
  }

  async function restoreBackup(data) {
    await ImageStorage.removeAll();
    Storage.removeAll();

    data.memories.forEach(memory => {
      Storage.save(memory);
    });

    if (data.settings && typeof data.settings === 'object') {
      Storage.saveSettings(data.settings);
    }
    Storage.markAsSample(false);

    if (Array.isArray(data.images)) {
      for (const image of data.images) {
        if (!image || !image.id || typeof image.dataUrl !== 'string') continue;
        if (!image.dataUrl.startsWith('data:image/')) continue;
        await ImageStorage.save(image.id, image.dataUrl);
      }
    }
  }

  function buildTxt() {
    const memories = Storage.getAll();
    if (memories.length === 0) {
      return 'Life Archive\n\n기록된 기억이 없습니다.\n';
    }

    return memories.map(memory => {
      const lines = [];
      lines.push(`날짜: ${Utils.formatMemoryDate(memory.year, memory.month, memory.day)}`);
      lines.push(`제목: ${memory.title || '제목 없음'}`);
      lines.push(`감정: ${Array.isArray(memory.emotion) ? memory.emotion.join(', ') : ''}`);
      lines.push(`본문: ${memory.text || ''}`);

      if (Array.isArray(memory.regretQuestions) && memory.regretQuestions.length) {
        lines.push('회고:');
        memory.regretQuestions.forEach(item => {
          if (item && item.answer) lines.push(`- ${item.question}: ${item.answer}`);
        });
      }

      if (memory.location) lines.push(`장소: ${memory.location}`);
      if (Array.isArray(memory.people) && memory.people.length) lines.push(`함께한 사람: ${memory.people.join(', ')}`);
      if (Array.isArray(memory.tags) && memory.tags.length) lines.push(`태그: ${memory.tags.join(', ')}`);
      if (memory.music?.title) lines.push(`음악: ${memory.music.title}`);
      if (memory.music?.youtubeUrl) lines.push(`음악 링크: ${memory.music.youtubeUrl}`);

      return lines.join('\n');
    }).join('\n\n---\n\n');
  }

  $exportJson.addEventListener('click', async () => {
    $exportJson.disabled = true;
    try {
      const data = await buildJsonBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json;charset=utf-8'
      });
      downloadBlob(blob, `life-archive-backup-${dateStamp()}.json`);
    } catch (err) {
      console.error('[Backup] JSON 내보내기 실패:', err);
      setMessage('JSON 내보내기에 실패했습니다', true);
    } finally {
      $exportJson.disabled = false;
    }
  });

  $exportTxt.addEventListener('click', () => {
    const blob = new Blob([buildTxt()], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `life-archive-${dateStamp()}.txt`);
  });

  $importJson.addEventListener('change', async () => {
    const file = $importJson.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!validateBackup(data)) {
        throw new Error('백업 파일 형식이 올바르지 않습니다');
      }

      const ok = confirm('기존 데이터를 백업 파일 내용으로 덮어씁니다. 계속할까요?');
      if (!ok) return;

      setMessage('복원 중입니다...');
      await restoreBackup(data);
      setMessage('복원이 완료되었습니다');
      setTimeout(() => location.replace('./archive.html'), 700);
    } catch (err) {
      console.error('[Backup] 복원 실패:', err);
      setMessage(err.message || '복원에 실패했습니다', true);
    } finally {
      $importJson.value = '';
    }
  });

})();
