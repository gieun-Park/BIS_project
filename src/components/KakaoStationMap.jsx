import { useEffect, useRef, useState } from 'react';
import {
  getBusLocationKey,
  getBusLocationPosition,
  getRoutePath,
  getRouteStationPosition
} from '../api/busData';
import {
  getMapStations,
  getStationMarkerTone,
  getStationPosition,
  loadKakaoMapSdk
} from '../api/kakaoMap';

const CHANGWON_CENTER = { lat: 35.2279, lng: 128.6819 };
const MARKER_COLORS = {
  default: '#007f73',
  selected: '#f08c00'
};
const BUS_MARKER_COLOR = '#2f6fed';
const BUS_MARKER_ANIMATION_MS = 900;
const ROUTE_LINE_COLOR = '#d6336c';
const ROUTE_STATION_COLOR = '#495057';

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);

const createMarkerSvgUrl = (color) => {
  const svg = `
    <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 43C17 43 32 27.65 32 16.85C32 8.65 25.28 2 17 2C8.72 2 2 8.65 2 16.85C2 27.65 17 43 17 43Z" fill="${color}" stroke="white" stroke-width="3"/>
      <circle cx="17" cy="17" r="6" fill="white"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const createBusMarkerSvgUrl = () => {
  const svg = `
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="21" cy="21" r="18" fill="${BUS_MARKER_COLOR}" stroke="white" stroke-width="3"/>
      <rect x="12" y="11" width="18" height="18" rx="4" fill="white"/>
      <rect x="15" y="15" width="12" height="6" rx="1.5" fill="${BUS_MARKER_COLOR}"/>
      <circle cx="16.5" cy="29" r="2.5" fill="#18212f"/>
      <circle cx="25.5" cy="29" r="2.5" fill="#18212f"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const createRouteStationMarkerSvgUrl = () => {
  const svg = `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="9" r="7" fill="${ROUTE_STATION_COLOR}" stroke="white" stroke-width="3"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const getBusLabel = (location, activeRouteNo) => {
  if (location?.routeno) return `${location.routeno}번`;
  if (activeRouteNo) return `${activeRouteNo}번`;
  return '버스';
};

const getBusInfoContent = (location, activeRouteNo) => {
  const routeLabel = escapeHtml(getBusLabel(location, activeRouteNo));
  const vehicleNo = location?.vehicleno ? `<span>차량 ${escapeHtml(location.vehicleno)}</span>` : '';
  const nodeName = location?.nodenm ? `<span>${escapeHtml(location.nodenm)}</span>` : '';

  return `
    <div style="padding:7px 10px;font-size:12px;line-height:1.45;white-space:nowrap;">
      <strong style="display:block;color:#18212f;">${routeLabel}</strong>
      ${vehicleNo}
      ${nodeName}
    </div>
  `;
};

const getRouteInsightContent = (routeInsight) => `
  <div style="padding:8px 11px;font-size:12px;line-height:1.5;white-space:nowrap;">
    <strong style="display:block;color:#18212f;">정류소 타임라인</strong>
    <span>${escapeHtml(routeInsight.message)}</span>
  </div>
`;

const animateBusMarker = (kakao, marker, nextLatLng, markerKey, animationRefs) => {
  const previousLatLng = marker.getPosition();

  if (
    !previousLatLng ||
    typeof window === 'undefined' ||
    !window.requestAnimationFrame ||
    !window.cancelAnimationFrame
  ) {
    marker.setPosition(nextLatLng);
    return;
  }

  const previousFrameId = animationRefs.get(markerKey);
  if (previousFrameId !== undefined) window.cancelAnimationFrame(previousFrameId);

  const startLat = previousLatLng.getLat();
  const startLng = previousLatLng.getLng();
  const endLat = nextLatLng.getLat();
  const endLng = nextLatLng.getLng();

  if (startLat === endLat && startLng === endLng) return;

  const startedAt = window.performance?.now?.() ?? Date.now();

  const step = (timestamp) => {
    const elapsed = timestamp - startedAt;
    const progress = Math.min(elapsed / BUS_MARKER_ANIMATION_MS, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const lat = startLat + (endLat - startLat) * easedProgress;
    const lng = startLng + (endLng - startLng) * easedProgress;

    marker.setPosition(new kakao.maps.LatLng(lat, lng));

    if (progress < 1) {
      animationRefs.set(markerKey, window.requestAnimationFrame(step));
    } else {
      animationRefs.delete(markerKey);
    }
  };

  animationRefs.set(markerKey, window.requestAnimationFrame(step));
};

function KakaoStationMap({
  station,
  stations = [],
  routeStations = [],
  routeInsight = null,
  busLocations = [],
  activeRouteNo,
  onSelectStation
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRefs = useRef([]);
  const routeMarkerRefs = useRef([]);
  const routePolylineRef = useRef(null);
  const busMarkerRefs = useRef(new Map());
  const busAnimationRefs = useRef(new Map());
  const infoWindowRef = useRef(null);
  const routeInsightWindowRef = useRef(null);
  const busInfoWindowRef = useRef(null);
  const [kakaoMaps, setKakaoMaps] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;

    const renderMap = async () => {
      setLoading(true);
      setMapError(null);

      try {
        const kakao = await loadKakaoMapSdk();
        if (canceled || !mapContainerRef.current) return;
        setKakaoMaps(kakao);

        const mapStations = getMapStations(stations, station);
        const positionedStations = mapStations
          .map((mapStation) => ({
            station: mapStation,
            position: getStationPosition(mapStation)
          }))
          .filter(({ position }) => position);
        const selectedPosition = getStationPosition(station);
        const position = selectedPosition ?? positionedStations[0]?.position ?? CHANGWON_CENTER;
        const center = new kakao.maps.LatLng(position.lat, position.lng);

        if (!mapRef.current) {
          mapRef.current = new kakao.maps.Map(mapContainerRef.current, {
            center,
            level: positionedStations.length ? 5 : 7
          });
        } else {
          mapRef.current.setCenter(center);
        }

        markerRefs.current.forEach((marker) => marker.setMap(null));
        markerRefs.current = [];

        if (infoWindowRef.current) {
          infoWindowRef.current.close();
          infoWindowRef.current = null;
        }

        if (positionedStations.length) {
          const bounds = new kakao.maps.LatLngBounds();
          const markerSize = new kakao.maps.Size(34, 44);
          const markerOption = { offset: new kakao.maps.Point(17, 44) };
          const markerImages = {
            default: new kakao.maps.MarkerImage(createMarkerSvgUrl(MARKER_COLORS.default), markerSize, markerOption),
            selected: new kakao.maps.MarkerImage(createMarkerSvgUrl(MARKER_COLORS.selected), markerSize, markerOption)
          };

          positionedStations.forEach(({ station: mapStation, position: markerPosition }) => {
            const latLng = new kakao.maps.LatLng(markerPosition.lat, markerPosition.lng);
            const markerTone = getStationMarkerTone(mapStation, station);
            const marker = new kakao.maps.Marker({
              position: latLng,
              title: mapStation.nodenm,
              image: markerImages[markerTone]
            });

            marker.setMap(mapRef.current);
            marker.setZIndex(markerTone === 'selected' ? 10 : 1);
            markerRefs.current.push(marker);
            bounds.extend(latLng);

            kakao.maps.event.addListener(marker, 'click', () => {
              const infoWindow = new kakao.maps.InfoWindow({
                content: `<div style="padding:6px 10px;font-size:12px;white-space:nowrap;">${escapeHtml(mapStation.nodenm)}</div>`
              });

              if (infoWindowRef.current) infoWindowRef.current.close();
              infoWindow.open(mapRef.current, marker);
              infoWindowRef.current = infoWindow;

              if (onSelectStation) onSelectStation(mapStation);
            });
          });

          if (positionedStations.length === 1) {
            mapRef.current.setCenter(bounds.getSouthWest());
            mapRef.current.setLevel(3);
          } else {
            mapRef.current.setBounds(bounds);
          }
        } else {
          mapRef.current.setLevel(7);
        }
      } catch (error) {
        console.error('카카오 지도 로드 실패:', error);
        setMapError('카카오 지도를 불러오지 못했습니다.');
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    renderMap();

    return () => {
      canceled = true;
    };
  }, [station, stations, onSelectStation]);

  useEffect(() => {
    if (!kakaoMaps || !mapRef.current) return undefined;

    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }

    routeMarkerRefs.current.forEach((marker) => marker.setMap(null));
    routeMarkerRefs.current = [];

    const routePath = getRoutePath(routeStations);
    if (routePath.length >= 2) {
      const polylinePath = routePath.map((position) => new kakaoMaps.maps.LatLng(position.lat, position.lng));
      routePolylineRef.current = new kakaoMaps.maps.Polyline({
        path: polylinePath,
        strokeWeight: 5,
        strokeColor: ROUTE_LINE_COLOR,
        strokeOpacity: 0.85,
        strokeStyle: 'solid'
      });
      routePolylineRef.current.setMap(mapRef.current);

      const bounds = new kakaoMaps.maps.LatLngBounds();
      polylinePath.forEach((latLng) => bounds.extend(latLng));
      if (!station) mapRef.current.setBounds(bounds);
    }

    const markerSize = new kakaoMaps.maps.Size(18, 18);
    const markerOption = { offset: new kakaoMaps.maps.Point(9, 9) };
    const markerImage = new kakaoMaps.maps.MarkerImage(createRouteStationMarkerSvgUrl(), markerSize, markerOption);

    routeStations.forEach((routeStation) => {
      const position = getRouteStationPosition(routeStation);
      if (!position) return;

      const marker = new kakaoMaps.maps.Marker({
        position: new kakaoMaps.maps.LatLng(position.lat, position.lng),
        title: routeStation.nodenm,
        image: markerImage
      });
      marker.setMap(mapRef.current);
      marker.setZIndex(2);
      routeMarkerRefs.current.push(marker);

      kakaoMaps.maps.event.addListener(marker, 'click', () => {
        if (onSelectStation) onSelectStation(routeStation);
      });
    });

    return undefined;
  }, [kakaoMaps, onSelectStation, routeStations, station]);

  useEffect(() => {
    if (!kakaoMaps || !mapRef.current) return undefined;

    if (routeInsightWindowRef.current) {
      routeInsightWindowRef.current.close();
      routeInsightWindowRef.current = null;
    }

    if (!routeInsight || !station) return undefined;

    const position = getRouteStationPosition(station);
    if (!position) return undefined;

    const marker = new kakaoMaps.maps.Marker({
      position: new kakaoMaps.maps.LatLng(position.lat, position.lng),
      opacity: 0
    });
    marker.setMap(mapRef.current);

    const infoWindow = new kakaoMaps.maps.InfoWindow({
      content: getRouteInsightContent(routeInsight)
    });
    infoWindow.open(mapRef.current, marker);
    routeInsightWindowRef.current = infoWindow;

    return () => {
      marker.setMap(null);
      infoWindow.close();
    };
  }, [kakaoMaps, routeInsight, station]);

  useEffect(() => {
    if (!kakaoMaps || !mapRef.current) return undefined;

    const markerSize = new kakaoMaps.maps.Size(42, 42);
    const markerOption = { offset: new kakaoMaps.maps.Point(21, 21) };
    const markerImage = new kakaoMaps.maps.MarkerImage(createBusMarkerSvgUrl(), markerSize, markerOption);
    const nextMarkerKeys = new Set();

    busLocations.forEach((location, index) => {
      const position = getBusLocationPosition(location);
      if (!position) return;

      const markerKey = getBusLocationKey(location, index);
      const latLng = new kakaoMaps.maps.LatLng(position.lat, position.lng);
      const currentMarker = busMarkerRefs.current.get(markerKey);
      nextMarkerKeys.add(markerKey);

      if (currentMarker) {
        currentMarker.location = location;
        currentMarker.activeRouteNo = activeRouteNo;
        animateBusMarker(kakaoMaps, currentMarker.marker, latLng, markerKey, busAnimationRefs.current);
        return;
      }

      const marker = new kakaoMaps.maps.Marker({
        position: latLng,
        title: getBusLabel(location, activeRouteNo),
        image: markerImage
      });

      marker.setMap(mapRef.current);
      marker.setZIndex(30);
      busMarkerRefs.current.set(markerKey, { marker, location, activeRouteNo });

      kakaoMaps.maps.event.addListener(marker, 'click', () => {
        const latestMarker = busMarkerRefs.current.get(markerKey);
        const infoWindow = new kakaoMaps.maps.InfoWindow({
          content: getBusInfoContent(latestMarker?.location ?? location, latestMarker?.activeRouteNo ?? activeRouteNo)
        });

        if (busInfoWindowRef.current) busInfoWindowRef.current.close();
        infoWindow.open(mapRef.current, marker);
        busInfoWindowRef.current = infoWindow;
      });
    });

    busMarkerRefs.current.forEach(({ marker }, markerKey) => {
      if (nextMarkerKeys.has(markerKey)) return;

      const frameId = busAnimationRefs.current.get(markerKey);
      if (frameId !== undefined && typeof window !== 'undefined') {
        window.cancelAnimationFrame(frameId);
      }

      busAnimationRefs.current.delete(markerKey);
      marker.setMap(null);
      busMarkerRefs.current.delete(markerKey);
    });

    if (!busLocations.length && busInfoWindowRef.current) {
      busInfoWindowRef.current.close();
      busInfoWindowRef.current = null;
    }

    return undefined;
  }, [activeRouteNo, busLocations, kakaoMaps]);

  useEffect(() => () => {
    markerRefs.current.forEach((marker) => marker.setMap(null));
    routeMarkerRefs.current.forEach((marker) => marker.setMap(null));
    if (routePolylineRef.current) routePolylineRef.current.setMap(null);
    busMarkerRefs.current.forEach(({ marker }) => marker.setMap(null));
    busAnimationRefs.current.forEach((frameId) => {
      if (typeof window !== 'undefined') window.cancelAnimationFrame(frameId);
    });

    if (infoWindowRef.current) infoWindowRef.current.close();
    if (routeInsightWindowRef.current) routeInsightWindowRef.current.close();
    if (busInfoWindowRef.current) busInfoWindowRef.current.close();
  }, []);

  return (
    <section className="map-panel">
      <div ref={mapContainerRef} className="map-panel__canvas" />
      {loading && <p className="map-panel__status">지도 로드 중...</p>}
      {mapError && <p className="status-message status-message--error">{mapError}</p>}
    </section>
  );
}

export default KakaoStationMap;
