// src/screens/BusArrivalScreen.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getLiveBusArrival, getRouteBusLocations, searchBusStops } from '../api/busApi';
import {
  addRecentStation,
  isFavoriteStation,
  readFavoriteStations,
  readRecentStations,
  toggleFavoriteStation,
  writeFavoriteStations,
  writeRecentStations
} from '../api/stationStorage';
import KakaoStationMap from '../components/KakaoStationMap';

const AUTO_REFRESH_INTERVAL_MS = 30000;
const BUS_LOCATION_REFRESH_INTERVAL_MS = 10000;
const SEARCH_DEBOUNCE_MS = 450;

const formatLastUpdated = (date) =>
  date
    ? new Intl.DateTimeFormat('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date)
    : '아직 갱신 전';

const getArrivalTone = (arrtime) => {
  if (!arrtime || arrtime <= 180) return 'soon';
  if (arrtime <= 600) return 'medium';
  return 'later';
};

const formatArrivalTime = (arrtime) => {
  if (!arrtime) return '잠시 후 도착';
  return `${Math.floor(arrtime / 60)}분 ${arrtime % 60}초`;
};

const getBusLocationErrorMessage = (error) => {
  const status = error?.response?.status;

  if (status === 401) return '버스 위치 API 인증키를 확인해주세요.';
  if (status === 403) return '버스 위치 API 활용신청이 필요합니다. 공공데이터포털에서 버스위치정보 권한을 확인해주세요.';

  return '실시간 버스 위치를 불러오지 못했습니다.';
};

function BusArrivalScreen() {
  const [stationQuery, setStationQuery] = useState('');
  const [stationResults, setStationResults] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [arrivalData, setArrivalData] = useState([]); 
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [busLocations, setBusLocations] = useState([]);
  const [favoriteStations, setFavoriteStations] = useState(() => readFavoriteStations());
  const [recentStations, setRecentStations] = useState(() => readRecentStations());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [busLocationUpdatedAt, setBusLocationUpdatedAt] = useState(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busLocationLoading, setBusLocationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busLocationError, setBusLocationError] = useState(null);
  const [searchMessage, setSearchMessage] = useState(null);

  const loadBusLocationData = useCallback(async (routeId = selectedRouteId) => {
    if (!routeId) return;

    setBusLocationLoading(true);
    setBusLocationError(null);

    try {
      const locations = await getRouteBusLocations(routeId);
      setBusLocations(locations);
      setBusLocationUpdatedAt(new Date());
    } catch (err) {
      setBusLocations([]);
      setBusLocationError(getBusLocationErrorMessage(err));
    } finally {
      setBusLocationLoading(false);
    }
  }, [selectedRouteId]);

  const loadArrivalData = useCallback(async (nodeId = selectedStation?.nodeid) => {
    if (!nodeId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getLiveBusArrival(nodeId);
      setArrivalData(data);
      setLastUpdatedAt(new Date());
      if (!data.some((bus) => bus.routeid)) {
        setBusLocations([]);
        setBusLocationUpdatedAt(null);
        setBusLocationError(null);
      }
      setSelectedRouteId((currentRouteId) => {
        const currentRoute = data.find((bus) => bus.routeid && bus.routeid === currentRouteId);
        const firstRoute = data.find((bus) => bus.routeid);

        return currentRoute?.routeid ?? firstRoute?.routeid ?? null;
      });
    } catch {
      setError("실시간 버스 도착 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  useEffect(() => {
    if (!autoRefresh || !selectedStation) return undefined;

    const intervalId = window.setInterval(() => {
      loadArrivalData(selectedStation.nodeid);
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [autoRefresh, loadArrivalData, selectedStation]);

  useEffect(() => {
    if (!selectedRouteId || !selectedStation) return undefined;

    const timeoutId = window.setTimeout(() => {
      loadBusLocationData(selectedRouteId);
    }, 0);

    const intervalId = window.setInterval(() => {
      loadBusLocationData(selectedRouteId);
    }, BUS_LOCATION_REFRESH_INTERVAL_MS);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [loadBusLocationData, selectedRouteId, selectedStation]);

  const performSearch = useCallback(async (queryValue) => {
    const query = queryValue.trim();
    setSearchMessage(null);
    setError(null);

    if (query.length < 2) {
      setStationResults([]);
      setSearchMessage('정류소명을 두 글자 이상 입력해주세요.');
      return;
    }

    setSearching(true);
    try {
      const stops = await searchBusStops(query);
      setStationResults(stops);
      setSearchMessage(stops.length === 0 ? '검색된 정류소가 없습니다.' : null);
    } catch (err) {
      console.error('정류소 검색 실패:', err);
      setStationResults([]);
      setSearchMessage('정류소 검색 정보를 불러오지 못했습니다. 버스정류소정보 API 활용신청을 확인해주세요.');
    } finally {
      setSearching(false);
    }
  }, []);

  const handleQueryChange = (event) => {
    const nextQuery = event.target.value;
    setStationQuery(nextQuery);

    if (nextQuery.trim().length < 2) {
      setStationResults([]);
      if (nextQuery.trim().length === 0) setSearchMessage(null);
    }
  };

  useEffect(() => {
    const query = stationQuery.trim();

    if (query.length < 2) return undefined;

    const timeoutId = window.setTimeout(() => {
      performSearch(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [performSearch, stationQuery]);

  const handleSearch = (event) => {
    event.preventDefault();
    performSearch(stationQuery);
  };

  const handleSelectStation = useCallback((station) => {
    setSelectedStation(station);
    setStationQuery(station.nodenm);
    setArrivalData([]);
    setSelectedRouteId(null);
    setBusLocations([]);
    setLastUpdatedAt(null);
    setBusLocationUpdatedAt(null);
    setBusLocationError(null);

    setRecentStations((currentStations) => {
      const nextStations = addRecentStation(currentStations, station);
      writeRecentStations(nextStations);
      return nextStations;
    });

    loadArrivalData(station.nodeid);
  }, [loadArrivalData]);

  const handleSelectRoute = useCallback((bus) => {
    if (!bus.routeid) return;

    if (bus.routeid === selectedRouteId) {
      loadBusLocationData(bus.routeid);
      return;
    }

    setSelectedRouteId(bus.routeid);
    setBusLocations([]);
    setBusLocationUpdatedAt(null);
    setBusLocationError(null);
  }, [loadBusLocationData, selectedRouteId]);

  const handleToggleFavorite = () => {
    if (!selectedStation) return;

    setFavoriteStations((currentStations) => {
      const nextStations = toggleFavoriteStation(currentStations, selectedStation);
      writeFavoriteStations(nextStations);
      return nextStations;
    });
  };

  const selectedStationIsFavorite = useMemo(
    () => isFavoriteStation(favoriteStations, selectedStation),
    [favoriteStations, selectedStation]
  );

  const selectedRoute = useMemo(
    () => arrivalData.find((bus) => bus.routeid && bus.routeid === selectedRouteId) ?? null,
    [arrivalData, selectedRouteId]
  );

  const quickStations = useMemo(() => {
    const stationMap = new Map();

    favoriteStations.forEach((station) => stationMap.set(station.nodeid, station));
    recentStations.forEach((station) => {
      if (!stationMap.has(station.nodeid)) stationMap.set(station.nodeid, station);
    });

    return Array.from(stationMap.values());
  }, [favoriteStations, recentStations]);

  return (
    <main className="bus-app">
      <section className="bus-app__header">
        <div>
          <p className="bus-app__eyebrow">Changwon BIS</p>
          <h1>실시간 버스 도착</h1>
        </div>
        <label className="auto-refresh">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(event) => setAutoRefresh(event.target.checked)}
            disabled={!selectedStation}
          />
          <span>자동 갱신</span>
        </label>
      </section>

      <section className="search-panel">
        <form className="search-panel__form" onSubmit={handleSearch}>
          <input
            value={stationQuery}
            onChange={handleQueryChange}
            placeholder="정류소명 입력"
          />
          <button type="submit" disabled={searching}>
            {searching ? '검색 중' : '검색'}
          </button>
        </form>

        {searchMessage && <p className="status-message status-message--warn">{searchMessage}</p>}

        {quickStations.length > 0 && (
          <div className="quick-stations">
            {favoriteStations.length > 0 && <span className="quick-stations__label">즐겨찾기/최근</span>}
            <div className="quick-stations__list">
              {quickStations.map((station) => (
                <button
                  key={`quick-${station.nodeid}`}
                  type="button"
                  onClick={() => handleSelectStation(station)}
                  className={selectedStation?.nodeid === station.nodeid ? 'station-chip station-chip--active' : 'station-chip'}
                >
                  {isFavoriteStation(favoriteStations, station) ? '★ ' : ''}
                  {station.nodenm}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <KakaoStationMap
        station={selectedStation}
        stations={stationResults}
        busLocations={busLocations}
        activeRouteNo={selectedRoute?.routeno}
        onSelectStation={handleSelectStation}
      />

      {selectedRoute && (
        <section className="bus-location-status" aria-live="polite">
          <strong>{selectedRoute.routeno}번 위치</strong>
          <span>
            {busLocationLoading && busLocations.length === 0
              ? '위치 불러오는 중'
              : `${busLocations.length}대 표시 · ${formatLastUpdated(busLocationUpdatedAt)}`}
          </span>
        </section>
      )}

      {busLocationError && (
        <p className="status-message status-message--warn">{busLocationError}</p>
      )}

      <section className="station-results" aria-label="검색 결과">
        {stationResults.map((station) => (
          <button
            key={`${station.nodeid}-${station.nodeno ?? ''}`}
            type="button"
            onClick={() => handleSelectStation(station)}
            className={selectedStation?.nodeid === station.nodeid ? 'station-result station-result--active' : 'station-result'}
          >
            <span>
              <strong>{station.nodenm}</strong>
              <small>
                ID {station.nodeid}
                {station.nodeno ? ` · ${station.nodeno}` : ''}
              </small>
            </span>
            <span className="station-result__arrow">선택</span>
          </button>
        ))}
      </section>

      <section className="arrival-panel">
        <div className="arrival-panel__top">
          <div>
            <p className="arrival-panel__label">선택 정류소</p>
            <h2>{selectedStation ? selectedStation.nodenm : '정류소를 선택해주세요'}</h2>
            <p className="arrival-panel__meta">
              마지막 업데이트: {formatLastUpdated(lastUpdatedAt)}
            </p>
          </div>
          <div className="arrival-panel__actions">
            <button type="button" onClick={handleToggleFavorite} disabled={!selectedStation}>
              {selectedStationIsFavorite ? '★ 즐겨찾기' : '☆ 즐겨찾기'}
            </button>
            <button type="button" onClick={() => loadArrivalData()} disabled={loading || !selectedStation}>
              {loading ? '갱신 중' : '새로고침'}
            </button>
          </div>
        </div>

        {error && <p className="status-message status-message--error">{error}</p>}

        {!selectedStation && !loading && (
          <p className="empty-state">정류소명을 검색하거나 지도 마커를 선택해주세요.</p>
        )}

        {selectedStation && arrivalData.length === 0 && !loading && (
          <p className="empty-state">현재 도착 예정인 버스가 없습니다.</p>
        )}

        {arrivalData.length > 0 && (
          <div className="arrival-list">
            {arrivalData.map((bus, index) => {
              const isActiveRoute = Boolean(bus.routeid && bus.routeid === selectedRouteId);

              return (
                <button
                  key={`${bus.routeid ?? bus.routeno}-${index}`}
                  type="button"
                  onClick={() => handleSelectRoute(bus)}
                  className={isActiveRoute ? 'arrival-card arrival-card--active' : 'arrival-card'}
                  aria-pressed={isActiveRoute}
                >
                  <div>
                    <strong>{bus.routeno}번</strong>
                    <span className="arrival-card__meta">
                      <span>{bus.arrprevstationcnt ?? '-'}정류장 전</span>
                      {isActiveRoute && <em>지도 표시 중</em>}
                    </span>
                  </div>
                  <span className={`arrival-badge arrival-badge--${getArrivalTone(Number(bus.arrtime))}`}>
                    {formatArrivalTime(Number(bus.arrtime))}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default BusArrivalScreen;
