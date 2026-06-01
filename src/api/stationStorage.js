const FAVORITES_KEY = 'bis.favoriteStations';
const RECENTS_KEY = 'bis.recentStations';
const MAX_RECENT_STATIONS = 5;

const toStorageStation = (station) =>
  Object.fromEntries(
    Object.entries({
      nodeid: station.nodeid,
      nodenm: station.nodenm,
      nodeno: station.nodeno,
      gpslati: station.gpslati,
      gpslong: station.gpslong
    }).filter(([, value]) => value !== undefined)
  );

export const addRecentStation = (stations, station) => {
  if (!station?.nodeid) return stations;

  const nextStations = [
    toStorageStation(station),
    ...stations.filter((item) => item.nodeid !== station.nodeid)
  ];

  return nextStations.slice(0, MAX_RECENT_STATIONS);
};

export const toggleFavoriteStation = (stations, station) => {
  if (!station?.nodeid) return stations;

  if (stations.some((item) => item.nodeid === station.nodeid)) {
    return stations.filter((item) => item.nodeid !== station.nodeid);
  }

  return [toStorageStation(station), ...stations];
};

export const isFavoriteStation = (stations, station) =>
  Boolean(station?.nodeid && stations.some((item) => item.nodeid === station.nodeid));

export const readStoredStations = (key) => {
  if (typeof window === 'undefined') return [];

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
};

export const writeStoredStations = (key, stations) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(stations));
};

export const readFavoriteStations = () => readStoredStations(FAVORITES_KEY);
export const writeFavoriteStations = (stations) => writeStoredStations(FAVORITES_KEY, stations);
export const readRecentStations = () => readStoredStations(RECENTS_KEY);
export const writeRecentStations = (stations) => writeStoredStations(RECENTS_KEY, stations);
