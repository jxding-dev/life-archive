/* ============================================
   LIFE ARCHIVE — Settings Page
   닉네임 / PIN 변경 / 초기화
   ============================================ */

(() => {

  if (sessionStorage.getItem('life_archive_authed') !== 'true') {
    location.replace('./lock.html');
    return;
  }

  const $nicknameForm = document.getElementById('nickname-form');
  const $nickname     = document.getElementById('settings-nickname');
  const $nickMsg      = document.getElementById('nickname-message');

  const $themeForm    = document.getElementById('theme-form');
  const $theme        = document.getElementById('settings-theme');
  const $themeMsg     = document.getElementById('theme-message');

  const $pinForm      = document.getElementById('pin-form');
  const $oldPin       = document.getElementById('settings-old-pin');
  const $newPin       = document.getElementById('settings-new-pin');
  const $newPin2      = document.getElementById('settings-new-pin-confirm');
  const $pinMsg       = document.getElementById('pin-message');

  const $resetRecords = document.getElementById('reset-records');
  const $resetApp     = document.getElementById('reset-app');
  const $resetMsg     = document.getElementById('reset-message');

  const settings = Storage.getSettings();
  $nickname.value = settings.nickname || '';
  $theme.value = settings.theme === 'dark' ? 'dark' : 'sepia';

  function setMessage(el, msg, isError = false) {
    el.textContent = msg || '';
    el.classList.toggle('is-error', isError);
  }

  function onlyDigits(input) {
    input.addEventListener('input', () => {
      const cleaned = input.value.replace(/\D/g, '').slice(0, 4);
      if (cleaned !== input.value) input.value = cleaned;
      setMessage($pinMsg, '');
    });
  }

  async function hashPin(pin) {
    const buf = new TextEncoder().encode(pin);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  [$oldPin, $newPin, $newPin2].forEach(onlyDigits);

  $nicknameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = Storage.saveSettings({ nickname: $nickname.value.trim() });
    setMessage($nickMsg, ok ? '저장되었습니다' : '저장에 실패했습니다', !ok);
  });

  $theme.addEventListener('change', () => {
    const theme = $theme.value === 'dark' ? 'dark' : 'sepia';
    const ok = Storage.saveSettings({ theme });
    window.LifeArchiveApp?.applyTheme(theme);
    setMessage($themeMsg, ok ? '테마가 저장되었습니다' : '테마 저장에 실패했습니다', !ok);
  });

  $themeForm.addEventListener('submit', (e) => e.preventDefault());

  $pinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMessage($pinMsg, '');

    if (!/^\d{4}$/.test($oldPin.value) || !/^\d{4}$/.test($newPin.value)) {
      setMessage($pinMsg, 'PIN은 숫자 4자리여야 합니다', true);
      return;
    }
    if ($newPin.value !== $newPin2.value) {
      setMessage($pinMsg, '새 PIN 확인이 일치하지 않습니다', true);
      return;
    }

    const oldHash = await hashPin($oldPin.value);
    if (oldHash !== Storage.getSettings().pinHash) {
      setMessage($pinMsg, '현재 PIN이 올바르지 않습니다', true);
      return;
    }

    const newHash = await hashPin($newPin.value);
    const ok = Storage.saveSettings({ pinHash: newHash, updatedAt: Utils.nowIso() });
    if (!ok) {
      setMessage($pinMsg, 'PIN 변경에 실패했습니다', true);
      return;
    }

    $pinForm.reset();
    sessionStorage.removeItem('life_archive_authed');
    setMessage($pinMsg, 'PIN이 변경되었습니다. 다시 잠금 화면으로 이동합니다.');
    setTimeout(() => location.replace('./lock.html'), 700);
  });

  function setResetDisabled(disabled) {
    $resetRecords.disabled = disabled;
    $resetApp.disabled = disabled;
  }

  $resetRecords.addEventListener('click', async () => {
    const ok = confirm('모든 기록과 이미지를 초기화할까요? 비밀번호와 설정은 유지됩니다.');
    if (!ok) return;

    setResetDisabled(true);
    setMessage($resetMsg, '전체 기록 초기화 중입니다...');

    try {
      await ImageStorage.removeAll();
      Storage.removeAll();
      setMessage($resetMsg, '전체 기록 초기화가 완료되었습니다.');
    } catch (err) {
      console.error('[Settings] 전체 기록 초기화 실패:', err);
      setMessage($resetMsg, '전체 기록 초기화에 실패했습니다', true);
    } finally {
      setResetDisabled(false);
    }
  });

  $resetApp.addEventListener('click', async () => {
    const ok = confirm('앱 전체를 초기화할까요? 기억, 이미지, PIN, 사용자 설정이 모두 삭제됩니다.');
    if (!ok) return;

    const typed = prompt('앱 전체 초기화를 실행하려면 "초기화"를 입력해주세요.');
    if (typed !== '초기화') {
      setMessage($resetMsg, '입력 문구가 일치하지 않아 취소되었습니다.', true);
      return;
    }

    setResetDisabled(true);
    setMessage($resetMsg, '앱 전체 초기화 중입니다...');

    try {
      await ImageStorage.removeAll();
      Storage.removeAll();
      Storage.removeSettings();
      sessionStorage.clear();
      setMessage($resetMsg, '앱 전체 초기화가 완료되었습니다.');
      setTimeout(() => location.replace('./setup.html'), 700);
    } catch (err) {
      console.error('[Settings] 앱 전체 초기화 실패:', err);
      setResetDisabled(false);
      setMessage($resetMsg, '앱 전체 초기화에 실패했습니다', true);
    }
  });

})();
