/* ============================================
   LIFE ARCHIVE — ImageStorage (IndexedDB)
   이미지 저장 / 불러오기 / 삭제
   ============================================ */

const ImageStorage = (() => {

  const DB_NAME    = 'life_archive_images';
  const DB_VERSION = 1;
  const STORE_NAME = 'images';

  let _db = null;


  /* ── DB 초기화 ── */

  function _openDB() {
    if (_db) return Promise.resolve(_db);

    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      req.onsuccess = (e) => {
        _db = e.target.result;
        resolve(_db);
      };

      req.onerror = () => reject(req.error);
    });
  }

  async function _getStore(mode) {
    const db = await _openDB();
    return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
  }


  /* ── CRUD ── */

  /**
   * 이미지 저장
   * @param {string} imageId
   * @param {Blob|string} data — WebP Blob 또는 dataURL
   * @returns {Promise<void>}
   */
  async function save(imageId, data) {
    const store = await _getStore('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put({ id: imageId, data, savedAt: new Date().toISOString() });
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  /**
   * 이미지 불러오기
   * @param {string} imageId
   * @returns {Promise<string|Blob|null>}
   */
  async function get(imageId) {
    const store = await _getStore('readonly');
    return new Promise((resolve, reject) => {
      const req = store.get(imageId);
      req.onsuccess = () => resolve(req.result ? req.result.data : null);
      req.onerror   = () => reject(req.error);
    });
  }

  /**
   * img.src에 바로 사용 가능한 URL 반환
   * (Blob URL 사용 후엔 revokeObjectUrl로 해제할 것)
   * @param {string} imageId
   * @returns {Promise<string|null>}
   */
  async function getObjectUrl(imageId) {
    const data = await get(imageId);
    if (!data) return null;
    if (typeof data === 'string') return data;
    return URL.createObjectURL(data);
  }

  /**
   * getObjectUrl로 만든 Blob URL 해제 (메모리 누수 방지)
   * dataURL 문자열이 들어오면 무시
   * @param {string} url
   */
  function revokeObjectUrl(url) {
    if (typeof url === 'string' && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * 이미지 삭제
   * @param {string} imageId
   * @returns {Promise<void>}
   */
  async function remove(imageId) {
    const store = await _getStore('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(imageId);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  /**
   * 전체 이미지 삭제
   * @returns {Promise<void>}
   */
  async function removeAll() {
    const store = await _getStore('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  /**
   * 존재 여부 확인
   * @param {string} imageId
   * @returns {Promise<boolean>}
   */
  async function exists(imageId) {
    const data = await get(imageId);
    return data !== null;
  }


  /* ── 공개 API ── */
  return {
    save,
    get,
    getObjectUrl,
    revokeObjectUrl,
    remove,
    removeAll,
    exists
  };
})();
