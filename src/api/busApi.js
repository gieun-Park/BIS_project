// src/api/busApi.js
import axios from 'axios';
import apiClient from './apiClient';
import { filterBusStops, normalizeBusLocations, normalizeItems } from './busData';

const BUS_STATION_BASE_URL = 'https://apis.data.go.kr/1613000/BusSttnInfoInqireService';
const BUS_LOCATION_BASE_URL = 'https://apis.data.go.kr/1613000/BusLcInfoInqireService';
const CITY_CODE = '38010';

const busStopCache = new Map();

const getBusStopItems = async (query) => {
  const response = await axios.get(`${BUS_STATION_BASE_URL}/getSttnNoList`, {
    params: {
      serviceKey: apiClient.defaults.params.serviceKey,
      _type: 'json',
      cityCode: CITY_CODE,
      nodeNm: query,
      numOfRows: 50,
      pageNo: 1
    }
  });

  return normalizeItems(response.data?.response?.body?.items?.item);
};

export const searchBusStops = async (query) => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  if (!busStopCache.has(normalizedQuery)) {
    const stops = await getBusStopItems(normalizedQuery);
    busStopCache.set(normalizedQuery, filterBusStops(stops, normalizedQuery));
  }

  return busStopCache.get(normalizedQuery).slice(0, 20);
};

export const getLiveBusArrival = async (nodeId) => {
  try {
    const response = await apiClient.get('/getSttnAcctoArvlPrearngeInfoList', {
      params: {
        cityCode: CITY_CODE, // 창원시 코드
        nodeId: nodeId,
        numOfRows: 30,
        pageNo: 1
      }
    });

    return normalizeItems(response.data?.response?.body?.items?.item);
    
  } catch (error) {
    console.error("실시간 도착 정보 로드 실패:", error);
    throw error;
  }
};

export const getRouteBusLocations = async (routeId) => {
  if (!routeId) return [];

  try {
    const response = await axios.get(`${BUS_LOCATION_BASE_URL}/getRouteAcctoBusLcList`, {
      params: {
        serviceKey: apiClient.defaults.params.serviceKey,
        _type: 'json',
        cityCode: CITY_CODE,
        routeId,
        numOfRows: 100,
        pageNo: 1
      }
    });

    return normalizeBusLocations(response.data?.response?.body?.items?.item);
  } catch (error) {
    console.error('실시간 버스 위치 로드 실패:', error);
    throw error;
  }
};
