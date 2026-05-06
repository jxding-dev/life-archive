/* ============================================
   LIFE ARCHIVE — Router Helpers
   인증 게이트 및 URL 헬퍼
   ============================================ */

const Router = (() => {

  const SESSION_AUTH_KEY = 'life_archive_authed';

  function requireAuth() {
    if (sessionStorage.getItem(SESSION_AUTH_KEY) !== 'true') {
      location.replace('./lock.html');
      return false;
    }
    return true;
  }

  function getQuery(name) {
    return new URLSearchParams(location.search).get(name);
  }

  return {
    requireAuth,
    getQuery
  };

})();
