/* ============================================
   LIFE ARCHIVE — ImageCompress
   Canvas API 리사이즈 + WebP 변환
   ============================================ */

const ImageCompress = (() => {

  const MAX_SIZE       = 1200;             // 긴 쪽 최대 px
  const QUALITY        = 0.82;             // WebP 품질 (0~1)
  const MIME_TYPE      = 'image/webp';
  const MAX_INPUT_BYTE = 20 * 1024 * 1024; // 입력 파일 최대 20MB


  /* ── 핵심 함수 ── */

  /**
   * File / Blob → 리사이즈된 WebP dataURL
   * @param {File|Blob} file
   * @returns {Promise<string>}
   */
  function compress(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('이미지 파일만 업로드 가능합니다.'));
        return;
      }
      if (file.size > MAX_INPUT_BYTE) {
        reject(new Error('파일 크기는 20MB 이하만 가능합니다.'));
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const dataUrl = _drawResized(img);
          resolve(dataUrl);
        };

        img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'));
        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error('파일 읽기에 실패했습니다.'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * File / Blob → 리사이즈된 WebP Blob
   * @param {File|Blob} file
   * @returns {Promise<Blob>}
   */
  async function compressToBlob(file) {
    const dataUrl = await compress(file);
    return _dataUrlToBlob(dataUrl);
  }


  /* ── 내부 헬퍼 ── */

  /**
   * Image 요소를 Canvas에 그려 dataURL 반환
   * @param {HTMLImageElement} img
   * @returns {string}
   */
  function _drawResized(img) {
    const { width, height } = _calcDimensions(img.naturalWidth, img.naturalHeight);

    const canvas = document.createElement('canvas');
    canvas.width  = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL(MIME_TYPE, QUALITY);
    // WebP 미지원 브라우저 fallback → JPEG
    if (dataUrl.startsWith('data:image/webp')) return dataUrl;
    return canvas.toDataURL('image/jpeg', QUALITY);
  }

  /**
   * 긴 쪽이 MAX_SIZE를 넘지 않도록 비율 유지 리사이즈
   * @param {number} origW
   * @param {number} origH
   * @returns {{ width: number, height: number }}
   */
  function _calcDimensions(origW, origH) {
    if (origW <= MAX_SIZE && origH <= MAX_SIZE) {
      return { width: origW, height: origH };
    }
    if (origW >= origH) {
      return {
        width:  MAX_SIZE,
        height: Math.round(origH * (MAX_SIZE / origW))
      };
    }
    return {
      width:  Math.round(origW * (MAX_SIZE / origH)),
      height: MAX_SIZE
    };
  }

  /**
   * dataURL → Blob 변환
   * @param {string} dataUrl
   * @returns {Blob}
   */
  function _dataUrlToBlob(dataUrl) {
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      throw new Error('잘못된 dataURL 형식입니다.');
    }
    const [header, base64] = dataUrl.split(',');
    const mimeMatch = header.match(/:(.*?);/);
    if (!mimeMatch || !base64) throw new Error('dataURL 파싱 실패.');
    const mime   = mimeMatch[1];
    const binary = atob(base64);
    const arr    = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      arr[i] = binary.charCodeAt(i);
    }
    return new Blob([arr], { type: mime });
  }


  /* ── input 연동 헬퍼 ── */

  /**
   * <input type="file"> change 이벤트에서 바로 사용
   * @param {Event} changeEvent
   * @returns {Promise<string|null>}
   */
  async function fromInputEvent(changeEvent) {
    const file = changeEvent.target.files?.[0];
    if (!file) return null;
    return compress(file);
  }


  /* ── 공개 API ── */
  return {
    compress,
    compressToBlob,
    fromInputEvent
  };
})();
