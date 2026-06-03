// src/screens/BusArrivalScreen.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getLiveBusArrival,
  getRouteBusLocations,
  getRouteInsight,
  getRouteStations,
  searchBusRoutes,
  searchBusStops
} from '../api/busApi';
import { resolveIntegratedSearch } from '../api/searchData';
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
const SEARCH_MODES = [
  ['all', '전체'],
  ['station', '정류장'],
  ['route', '버스']
];

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
  const [searchMode, setSearchMode] = useState('all');
  const [stationResults, setStationResults] = useState([]);
  const [routeResults, setRouteResults] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [arrivalData, setArrivalData] = useState([]);
  const [activeRoute, setActiveRoute] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [routeStations, setRouteStations] = useState([]);
  const [routeInsight, setRouteInsight] = useState(null);
  const [busLocations, setBusLocations] = useState([]);
  const [favoriteStations, setFavoriteStations] = useState(() => readFavoriteStations());
  const [recentStations, setRecentStations] = useState(() => readRecentStations());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [busLocationUpdatedAt, setBusLocationUpdatedAt] = useState(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [busLocationLoading, setBusLocationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [routeError, setRouteError] = useState(null);
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

  const loadRouteStationData = useCallback(async (routeId) => {
    if (!routeId) {
      setRouteStations([]);
      return;
    }

    setRouteLoading(true);
    setRouteError(null);

    try {
      const stations = await getRouteStations(routeId);
      setRouteStations(stations);
    } catch (err) {
      console.error('노선 정류소 로드 실패:', err);
      setRouteStations([]);
      setRouteError('노선 경유 정류소를 불러오지 못했습니다.');
    } finally {
      setRouteLoading(false);
    }
  }, []);

  const loadRouteInsight = useCallback(async (routeId = selectedRouteId, nodeId = selectedStation?.nodeid) => {
    if (!routeId || !nodeId) {
      setRouteInsight(null);
      return;
    }

    try {
      const insight = await getRouteInsight(routeId, nodeId);
      setRouteInsight(insight);
    } catch (err) {
      console.error('정류소 타임라인 로드 실패:', err);
      setRouteInsight(null);
    }
  }, [selectedRouteId, selectedStation]);

  const loadArrivalData = useCallback(async (nodeId = selectedStation?.nodeid, options = {}) => {
    if (!nodeId) return;

    const preserveRoute = Boolean(options.preserveRoute);
    setLoading(true);
    setError(null);

    try {
      const data = await getLiveBusArrival(nodeId);
      setArrivalData(data);
      setLastUpdatedAt(new Date());
      const firstRoute = data.find((bus) => bus.routeid);

      if (!preserveRoute && firstRoute?.routeid) {
        setActiveRoute(null);
        loadRouteStationData(firstRoute.routeid);
      }

      setSelectedRouteId((currentRouteId) => {
        if (preserveRoute && currentRouteId) return currentRouteId;

        return firstRoute?.routeid ?? null;
      });
    } catch {
      setError('실시간 버스 도착 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [loadRouteStationData, selectedStation]);

  useEffect(() => {
    if (!autoRefresh || !selectedStation) return undefined;

    const intervalId = window.setInterval(() => {
      loadArrivalData(selectedStation.nodeid, { preserveRoute: Boolean(activeRoute) });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [activeRoute, autoRefresh, loadArrivalData, selectedStation]);

  useEffect(() => {
    if (!selectedRouteId) return undefined;

    const timeoutId = window.setTimeout(() => {
      loadBusLocationData(selectedRouteId);
      loadRouteInsight(selectedRouteId, selectedStation?.nodeid);
    }, 0);

    const intervalId = window.setInterval(() => {
      loadBusLocationData(selectedRouteId);
      loadRouteInsight(selectedRouteId, selectedStation?.nodeid);
    }, BUS_LOCATION_REFRESH_INTERVAL_MS);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [loadBusLocationData, loadRouteInsight, selectedRouteId, selectedStation]);

  const performSearch = useCallback(async (queryValue) => {
    const query = queryValue.trim();
    const minimumLength = searchMode === 'route' ? 1 : 2;
    setSearchMessage(null);
    setError(null);
    setRouteError(null);

    if (query.length < minimumLength) {
      setStationResults([]);
      setRouteResults([]);
      setSearchMessage(
        searchMode === 'route'
          ? '버스번호를 한 글자 이상 입력해주세요.'
          : '정류소명 또는 버스번호를 두 글자 이상 입력해주세요.'
      );
      return;
    }

    setSearching(true);
    try {
      const {
        stationResults: stops,
        routeResults: routes,
        hasPartialFailure
      } = await resolveIntegratedSearch({
        query,
        searchMode,
        searchStops: searchBusStops,
        searchRoutes: searchBusRoutes
      });

      setStationResults(stops);
      setRouteResults(routes);
      setSearchMessage(
        hasPartialFailure
          ? '일부 검색 정보를 불러오지 못했습니다. 검색 유형을 바꿔 다시 시도할 수 있습니다.'
          : stops.length === 0 && routes.length === 0 ? '검색 결과가 없습니다.' : null
      );
    } catch (err) {
      console.error('통합 검색 실패:', err);
      setStationResults([]);
      setRouteResults([]);
      setSearchMessage('검색 정보를 불러오지 못했습니다. API 서버와 활용신청 상태를 확인해주세요.');
    } finally {
      setSearching(false);
    }
  }, [searchMode]);

  const handleQueryChange = (event) => {
    const nextQuery = event.target.value;
    setStationQuery(nextQuery);

    if (nextQuery.trim().length < 2) {
      setStationResults([]);
      setRouteResults([]);
      if (nextQuery.trim().length === 0) setSearchMessage(null);
    }
  };

  useEffect(() => {
    const query = stationQuery.trim();
    const minimumLength = searchMode === 'route' ? 1 : 2;

    if (query.length < minimumLength) return undefined;

    const timeoutId = window.setTimeout(() => {
      performSearch(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [performSearch, searchMode, stationQuery]);

  const handleSearch = (event) => {
    event.preventDefault();
    performSearch(stationQuery);
  };

  const handleSelectStation = useCallback((station) => {
    const preserveRoute = Boolean(activeRoute);

    setSelectedStation(station);
    setStationQuery(station.nodenm);
    setArrivalData([]);
    setLastUpdatedAt(null);
    setError(null);

    if (!preserveRoute) {
      setActiveRoute(null);
      setSelectedRouteId(null);
      setRouteStations([]);
      setRouteInsight(null);
      setBusLocations([]);
      setBusLocationUpdatedAt(null);
      setBusLocationError(null);
    }

    setRecentStations((currentStations) => {
      const nextStations = addRecentStation(currentStations, station);
      writeRecentStations(nextStations);
      return nextStations;
    });

    loadArrivalData(station.nodeid, { preserveRoute });
    if (activeRoute?.routeid) loadRouteInsight(activeRoute.routeid, station.nodeid);
  }, [activeRoute, loadArrivalData, loadRouteInsight]);

  const handleSelectRouteResult = useCallback((route) => {
    if (!route.routeid) return;

    setActiveRoute(route);
    setSelectedRouteId(route.routeid);
    setBusLocations([]);
    setBusLocationUpdatedAt(null);
    setBusLocationError(null);
    setRouteInsight(null);
    loadRouteStationData(route.routeid);
    loadBusLocationData(route.routeid);
    if (selectedStation?.nodeid) loadRouteInsight(route.routeid, selectedStation.nodeid);
  }, [loadBusLocationData, loadRouteInsight, loadRouteStationData, selectedStation]);

  const handleSelectRoute = useCallback((bus) => {
    if (!bus.routeid) return;

    const nextRoute = {
      routeid: bus.routeid,
      routeno: bus.routeno ?? '',
      routetp: bus.routetp ?? '',
      startnodenm: '',
      endnodenm: ''
    };
    setActiveRoute(nextRoute);

    if (bus.routeid === selectedRouteId) {
      loadBusLocationData(bus.routeid);
      loadRouteInsight(bus.routeid, selectedStation?.nodeid);
      return;
    }

    setSelectedRouteId(bus.routeid);
    setBusLocations([]);
    setBusLocationUpdatedAt(null);
    setBusLocationError(null);
    setRouteInsight(null);
    loadRouteStationData(bus.routeid);
  }, [loadBusLocationData, loadRouteInsight, loadRouteStationData, selectedRouteId, selectedStation]);

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

  const displayRoute = activeRoute ?? selectedRoute;

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
        <div className="search-tabs" role="tablist" aria-label="검색 유형">
          {SEARCH_MODES.map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              className={searchMode === mode ? 'search-tabs__button search-tabs__button--active' : 'search-tabs__button'}
              onClick={() => setSearchMode(mode)}
            >
              {label}
            </button>
          ))}
        </div>

        <form className="search-panel__form" onSubmit={handleSearch}>
          <input
            value={stationQuery}
            onChange={handleQueryChange}
            placeholder="정류소명 또는 버스번호 입력"
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
        routeStations={routeStations}
        routeInsight={routeInsight}
        busLocations={busLocations}
        activeRouteNo={displayRoute?.routeno}
        onSelectStation={handleSelectStation}
      />

      {displayRoute && (
        <section className="route-status" aria-live="polite">
          <div>
            <strong>{displayRoute.routeno}번 노선</strong>
            <span>{routeStations.length}개 정류소 · {busLocations.length}대 운행 표시</span>
          </div>
          {routeLoading && <em>노선 불러오는 중</em>}
        </section>
      )}

      {routeInsight && (
        <p className="status-message status-message--info">{routeInsight.message}</p>
      )}

      {routeError && (
        <p className="status-message status-message--warn">{routeError}</p>
      )}

      {displayRoute && (
        <section className="bus-location-status" aria-live="polite">
          <strong>{displayRoute.routeno}번 위치</strong>
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

      <section className="station-results" aria-label="정류장 검색 결과">
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

      {routeResults.length > 0 && (
        <section className="route-results" aria-label="버스 검색 결과">
          {routeResults.map((route) => (
            <button
              key={route.routeid}
              type="button"
              onClick={() => handleSelectRouteResult(route)}
              className={activeRoute?.routeid === route.routeid ? 'route-result route-result--active' : 'route-result'}
            >
              <span>
                <strong>{route.routeno}번</strong>
                <small>
                  {route.routetp || '노선'}
                  {route.startnodenm || route.endnodenm ? ` · ${route.startnodenm} → ${route.endnodenm}` : ''}
                </small>
              </span>
              <span className="route-result__arrow">노선 보기</span>
            </button>
          ))}
        </section>
      )}

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
