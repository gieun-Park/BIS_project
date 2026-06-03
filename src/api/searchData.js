const SEARCH_MODE_SOURCES = {
  all: ['station', 'route'],
  station: ['station'],
  route: ['route']
};

const getRequestedSources = (searchMode) => SEARCH_MODE_SOURCES[searchMode] ?? SEARCH_MODE_SOURCES.all;

export const resolveIntegratedSearch = async ({
  query,
  searchMode,
  searchStops,
  searchRoutes
}) => {
  const requestedSources = getRequestedSources(searchMode);
  const tasks = requestedSources.map((source) => {
    if (source === 'station') return searchStops(query);
    return searchRoutes(query);
  });
  const settledResults = await Promise.allSettled(tasks);
  const failedResults = settledResults.filter((result) => result.status === 'rejected');

  if (failedResults.length === settledResults.length) {
    throw failedResults[0].reason;
  }

  const stationIndex = requestedSources.indexOf('station');
  const routeIndex = requestedSources.indexOf('route');

  return {
    stationResults: stationIndex === -1 || settledResults[stationIndex].status !== 'fulfilled'
      ? []
      : settledResults[stationIndex].value,
    routeResults: routeIndex === -1 || settledResults[routeIndex].status !== 'fulfilled'
      ? []
      : settledResults[routeIndex].value,
    hasPartialFailure: failedResults.length > 0
  };
};
