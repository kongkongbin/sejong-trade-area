const CLIENT_ID = import.meta.env.VITE_NAVER_MAPS_CLIENT_ID;

let loadPromise = null;

export function loadNaverMaps() {
  if (window.naver && window.naver.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${CLIENT_ID}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Naver Maps SDK 로드 실패'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
