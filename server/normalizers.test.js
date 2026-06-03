import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildRoutePath,
  filterRoutes,
  normalizeArrival,
  normalizeBusLocation,
  normalizeItems,
  normalizeRoute,
  normalizeRouteStation,
  normalizeStation,
  sortRouteStations
} from './normalizers.js';

describe('normalizeItems', () => {
  it('returns an empty array for missing API items', () => {
    assert.deepEqual(normalizeItems(undefined), []);
  });

  it('wraps a single API item in an array', () => {
    assert.deepEqual(normalizeItems({ routeid: 'R1' }), [{ routeid: 'R1' }]);
  });
});

describe('route normalization', () => {
  it('normalizes route fields used by the frontend', () => {
    assert.deepEqual(
      normalizeRoute({
        routeid: 'CWB1',
        routeno: 100,
        routetp: '간선',
        startnodenm: '기점',
        endnodenm: '종점'
      }),
      {
        routeid: 'CWB1',
        routeno: '100',
        routetp: '간선',
        startnodenm: '기점',
        endnodenm: '종점',
        startvehicletime: '',
        endvehicletime: '',
        intervaltime: ''
      }
    );
  });

  it('filters routes by route number text', () => {
    const routes = [
      normalizeRoute({ routeid: 'R10', routeno: '10' }),
      normalizeRoute({ routeid: 'R100', routeno: '100' })
    ];

    assert.deepEqual(filterRoutes(routes, '10').map((route) => route.routeid), ['R10', 'R100']);
  });
});

describe('station and path normalization', () => {
  it('normalizes a searched station', () => {
    assert.deepEqual(
      normalizeStation({
        nodeid: 'N1',
        nodenm: '창원역',
        nodeno: 123,
        gpslati: '35.257',
        gpslong: '128.607'
      }),
      {
        nodeid: 'N1',
        nodenm: '창원역',
        nodeno: '123',
        gpslati: '35.257',
        gpslong: '128.607'
      }
    );
  });

  it('sorts route stations by node order and builds route path points', () => {
    const stations = [
      normalizeRouteStation({ nodeid: 'N2', nodenm: '둘', nodeord: '2', gpslati: '35.2', gpslong: '128.2' }),
      normalizeRouteStation({ nodeid: 'N1', nodenm: '하나', nodeord: '1', gpslati: '35.1', gpslong: '128.1' })
    ];

    assert.deepEqual(sortRouteStations(stations).map((station) => station.nodeid), ['N1', 'N2']);
    assert.deepEqual(buildRoutePath(stations), [
      { lat: 35.1, lng: 128.1 },
      { lat: 35.2, lng: 128.2 }
    ]);
  });
});

describe('arrival and location normalization', () => {
  it('normalizes arrival values as strings for transport across the API', () => {
    assert.deepEqual(
      normalizeArrival({ routeid: 'R1', routeno: 100, arrtime: 420, arrprevstationcnt: 3 }),
      { routeid: 'R1', routeno: '100', arrtime: '420', arrprevstationcnt: '3' }
    );
  });

  it('drops bus locations without usable coordinates', () => {
    assert.equal(normalizeBusLocation({ gpslati: '0', gpslong: '128.1' }), null);
    assert.deepEqual(
      normalizeBusLocation({ routeid: 'R1', vehicleno: '70A', gpslati: '35.1', gpslong: '128.1', nodeid: 'N1' }),
      {
        routeid: 'R1',
        routeno: '',
        vehicleno: '70A',
        gpslati: '35.1',
        gpslong: '128.1',
        nodeid: 'N1',
        nodeord: '',
        nodenm: ''
      }
    );
  });
});
