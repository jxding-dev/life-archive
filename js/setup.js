/* ============================================
   LIFE ARCHIVE — Setup
   닉네임 / PIN 설정 / 샘플 데이터 로딩
   ============================================ */

(() => {

  const SESSION_AUTH_KEY = 'life_archive_authed';


  /* ── 이미 설정됨이면 lock으로 우회 ───────── */

  const existing = Storage.getSettings();
  if (existing && existing.pinHash) {
    location.replace('./lock.html');
    return;
  }


  /* ── 요소 캐싱 ───────────────────────────── */

  const $form     = document.getElementById('setup-form');
  const $nickname = document.getElementById('setup-nickname');
  const $pin      = document.getElementById('setup-pin');
  const $pin2     = document.getElementById('setup-pin-confirm');
  const $sample   = document.getElementById('setup-sample');
  const $error    = document.getElementById('setup-error');
  const $submit   = $form.querySelector('button[type="submit"]');


  /* ── 유틸 ────────────────────────────────── */

  function showError(msg) {
    $error.textContent = msg || '';
  }

  function onlyDigits(el) {
    el.addEventListener('input', () => {
      const cleaned = el.value.replace(/\D/g, '').slice(0, 4);
      if (cleaned !== el.value) el.value = cleaned;
      showError('');
    });
  }

  onlyDigits($pin);
  onlyDigits($pin2);


  /* ── PIN 해싱 ────────────────────────────── */

  async function hashPin(pin) {
    const buf  = new TextEncoder().encode(pin);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }


  /* ── 샘플 데이터 로딩 ────────────────────── */

  async function loadSample() {
    try {
      const res  = await fetch('./data/sample.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('샘플 데이터 응답 오류');
      const list = await res.json();
      if (!Array.isArray(list)) return;
      list.forEach(m => Storage.save(m));
      Storage.markAsSample(true);
    } catch (err) {
      console.warn('[Setup] 샘플 데이터 불러오기 실패:', err);
    }
  }


  /* ── 제출 ────────────────────────────────── */

  $form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');

    const nickname = $nickname.value.trim();
    const pin      = $pin.value;
    const pin2     = $pin2.value;

    if (!/^\d{4}$/.test(pin)) {
      showError('PIN은 숫자 4자리여야 합니다');
      $pin.focus();
      return;
    }
    if (pin !== pin2) {
      showError('PIN 확인이 일치하지 않습니다');
      $pin2.focus();
      return;
    }

    $submit.disabled = true;
    $submit.textContent = '준비 중…';

    try {
      const pinHash = await hashPin(pin);
      const ok = Storage.saveSettings({
        pinHash,
        nickname: nickname || '',
        createdAt: Utils.nowIso()
      });
      if (!ok) throw new Error('설정 저장 실패');

      if ($sample.checked) await loadSample();

      // 방금 PIN을 설정한 사용자는 곧바로 인증 상태로
      sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
      location.replace('./index.html');

    } catch (err) {
      console.error('[Setup]', err);
      showError('설정에 실패했습니다. 다시 시도해주세요');
      $submit.disabled = false;
      $submit.textContent = '시작하기';
    }
  });


  /* ── 초기화 ──────────────────────────────── */

  $nickname.focus();

})();
