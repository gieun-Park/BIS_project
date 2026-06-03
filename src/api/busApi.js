import axios from 'axios';

const localApi = axios.create({
  baseURL: '/api'
});

const readData = (response) => response.data ?? [];

export const searchBusStops = async (query) => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  const response = await localApi.get('/stations', {
    params: { query: normalizedQuery }
  });

  return readData(response);
};

export const getLiveBusArrival = async (nodeId) => {
  if (!nodeId) return [];

  const response = await localApi.get('/arrivals', {
    params: { nodeId }
  });

  return readData(response);
};

export const searchBusRoutes = async (query) => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  const response = await localApi.get('/routes', {
    params: { query: normalizedQuery }
  });

  return readData(response);
};

export const getRouteStations = async (routeId) => {
  if (!routeId) return [];

  const response = await localApi.get(`/routes/${encodeURIComponent(routeId)}/stations`);
  return readData(response);
};

export const getRouteBusLocations = async (routeId) => {
  if (!routeId) return [];

  const response = await localApi.get(`/routes/${encodeURIComponent(routeId)}/locations`);
  return readData(response);
};

export const getRouteInsight = async (routeId, nodeId) => {
  if (!routeId || !nodeId) return null;

  const response = await localApi.get(`/routes/${encodeURIComponent(routeId)}/insight`, {
    params: { nodeId }
  });

  return response.data ?? null;
};
