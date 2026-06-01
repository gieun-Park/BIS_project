const KAKAO_MAP_JS_KEY = 'bb9968c9a5710885be8c1613c5e0b24e';
const KAKAO_MAP_SDK_ID = 'kakao-map-sdk';

let kakaoMapSdkPromise = null;

export const buildKakaoMapSdkUrl = (appKey = KAKAO_MAP_JS_KEY) => {
  const url = new URL('https://dapi.kakao.com/v2/maps/sdk.js');
  url.searchParams.set('appkey', appKey);
  url.searchParams.set('autoload', 'false');
  return url;
};

export const getStationPosition = (station) => {
  const lat = Number(station?.gpslati);
  const lng = Number(station?.gpslong);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

export const getMapStations = (stations = [], selectedStation = null) => {
  const stationMap = new Map();

  stations.forEach((station) => {
    if (station?.nodeid) stationMap.set(station.nodeid, station);
  });

  if (selectedStation?.nodeid && !stationMap.has(selectedStation.nodeid)) {
    stationMap.set(selectedStation.nodeid, selectedStation);
  }

  return Array.from(stationMap.values());
};

export const getStationMarkerTone = (station, selectedStation) =>
  station?.nodeid && station.nodeid === selectedStation?.nodeid ? 'selected' : 'default';

export const loadKakaoMapSdk = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Kakao Maps SDK can only be loaded in a browser.'));
  }

  if (window.kakao?.maps) {
    return new Promise((resolve) => {
      window.kakao.maps.load(() => resolve(window.kakao));
    });
  }

  if (kakaoMapSdkPromise) return kakaoMapSdkPromise;

  kakaoMapSdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(KAKAO_MAP_SDK_ID);

    const handleLoad = () => {
      if (!window.kakao?.maps) {
        reject(new Error('Kakao Maps SDK loaded without the maps namespace.'));
        return;
      }

      window.kakao.maps.load(() => resolve(window.kakao));
    };

    if (existingScript) {
      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = KAKAO_MAP_SDK_ID;
    script.src = buildKakaoMapSdkUrl().toString();
    script.async = true;
    script.onload = handleLoad;
    script.onerror = () => reject(new Error('Kakao Maps SDK failed to load.'));

    document.head.appendChild(script);
  });

  return kakaoMapSdkPromise;
};
