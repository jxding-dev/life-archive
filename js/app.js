/* ============================================
   LIFE ARCHIVE — App Bootstrap
   공통 네비게이션 보조
   ============================================ */

(() => {

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.dataset.theme = 'dark';
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  function applySavedTheme() {
    if (typeof Storage === 'undefined' || !Storage.getSettings) return;
    applyTheme(Storage.getSettings().theme);
  }

  function normalizePath(pathname) {
    const last = pathname.split('/').pop();
    return last || 'index.html';
  }

  function markActiveNav() {
    const current = normalizePath(location.pathname);
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
      const href = item.getAttribute('href') || '';
      const target = normalizePath(href);
      item.classList.toggle('active', target === current);
    });
  }

  window.LifeArchiveApp = {
    applyTheme,
    applySavedTheme
  };

  applySavedTheme();
  markActiveNav();
})();
