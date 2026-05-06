/* ============================================
   LIFE ARCHIVE — Lock Page
   PIN 4자리 입력 / 검증 / 세션 인증
   ============================================ */

(() => {

  /* ── 상수 ─────────────────────────────────── */

  const PIN_LENGTH         = 4;
  const SESSION_AUTH_KEY   = 'life_archive_authed';
  const FAIL_COUNT_KEY     = 'life_archive_fail_count';
  const FAIL_UNTIL_KEY     = 'life_archive_fail_until';
  const MAX_FAIL           = 5;
  const LOCKOUT_MS         = 30 * 1000; // 5회 실패 시 30초 잠금


  /* ── 요소 캐싱 ───────────────────────────── */

  const $card   = document.getElementById('lock-card');
  const $form   = document.getElementById('lock-form');
  const $input  = document.getElementById('lock-input');
  const $dots   = document.querySelectorAll('.lock-dot');
  const $error  = document.getElementById('lock-error');


  /* ── 진입 분기 ────────────────────────────── */

  // 이미 인증된 세션이면 바로 통과
  if (sessionStorage.getItem(SESSION_AUTH_KEY) === 'true') {
    location.replace('./index.html');
    return;
  }

  // 비밀번호 미설정 시 setup으로 이동
  const settings = Storage.getSettings();
  if (!settings || !settings.pinHash) {
    location.replace('./setup.html');
    return;
  }


  /* ── 잠금 상태 처리 ──────────────────────── */

  function getLockoutRemaining() {
    const until = Number(sessionStorage.getItem(FAIL_UNTIL_KEY) || 0);
    if (!until) return 0;
    const left = until - Date.now();
    return left > 0 ? left : 0;
  }

  function applyLockoutUI() {
    const left = getLockoutRemaining();
    if (left <= 0) {
      $input.disabled = false;
      $error.textContent = '';
      return;
    }
    $input.disabled = true;
    $error.textContent = `잠시 후 다시 시도해주세요 (${Math.ceil(left / 1000)}초)`;
    setTimeout(applyLockoutUI, 500);
  }


  /* ── 점 인디케이터 ───────────────────────── */

  function renderDots(filledLen) {
    $dots.forEach((dot, i) => {
      dot.classList.toggle('filled', i < filledLen);
      dot.classList.remove('error');
    });
  }

  function flashError() {
    $card.classList.remove('shake');
    // reflow로 애니메이션 재시작
    void $card.offsetWidth;
    $card.classList.add('shake');
    $dots.forEach(d => d.classList.add('error'));
  }


  /* ── PIN 해싱 (SHA-256) ──────────────────── */

  async function hashPin(pin) {
    const buf  = new TextEncoder().encode(pin);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }


  /* ── 검증 흐름 ───────────────────────────── */

  async function verify(pin) {
    const inputHash = await hashPin(pin);
    return inputHash === settings.pinHash;
  }

  async function onPinComplete(pin) {
    if (await verify(pin)) {
      sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
      sessionStorage.removeItem(FAIL_COUNT_KEY);
      sessionStorage.removeItem(FAIL_UNTIL_KEY);
      location.replace('./index.html');
      return;
    }

    // 실패 처리
    const fails = Number(sessionStorage.getItem(FAIL_COUNT_KEY) || 0) + 1;
    sessionStorage.setItem(FAIL_COUNT_KEY, String(fails));

    flashError();
    $error.textContent = 'PIN이 올바르지 않습니다';

    if (fails >= MAX_FAIL) {
      sessionStorage.setItem(FAIL_UNTIL_KEY, String(Date.now() + LOCKOUT_MS));
      sessionStorage.setItem(FAIL_COUNT_KEY, '0');
    }

    setTimeout(() => {
      $input.value = '';
      renderDots(0);
      applyLockoutUI();
      if (!$input.disabled) $input.focus();
    }, 420);
  }


  /* ── 입력 이벤트 ─────────────────────────── */

  $input.addEventListener('input', (e) => {
    // 숫자만 허용
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    if (cleaned !== e.target.value) e.target.value = cleaned;

    $error.textContent = '';
    renderDots(cleaned.length);

    if (cleaned.length === PIN_LENGTH) {
      onPinComplete(cleaned);
    }
  });

  // 카드 클릭 시 입력창에 포커스
  $card.addEventListener('click', () => {
    if (!$input.disabled) $input.focus();
  });

  $form.addEventListener('submit', (e) => e.preventDefault());


  /* ── 초기화 ──────────────────────────────── */

  applyLockoutUI();
  renderDots(0);
  $input.focus();

})();
