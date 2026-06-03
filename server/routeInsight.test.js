import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateRouteInsight } from './routeInsight.js';

const routeStations = [
  { nodeid: 'N1', nodenm: '첫정류장', nodeord: '1', gpslati: '35.1', gpslong: '128.1' },
  { nodeid: 'N2', nodenm: '둘째정류장', nodeord: '2', gpslati: '35.2', gpslong: '128.2' },
  { nodeid: 'N3', nodenm: '셋째정류장', nodeord: '3', gpslati: '35.3', gpslong: '128.3' }
];

describe('calculateRouteInsight', () => {
  it('uses official arrival values when the selected route arrival is available', () => {
    const insight = calculateRouteInsight({
      routeId: 'R1',
      nodeId: 'N3',
      routeStations,
      busLocations: [{ routeid: 'R1', vehicleno: '70A', nodeid: 'N2', gpslati: '35.2', gpslong: '128.2' }],
      arrivals: [{ routeid: 'R1', arrprevstationcnt: '1', arrtime: '420' }]
    });

    assert.equal(insight.message, '가장 가까운 버스는 1정류장 전 · 7분 뒤 도착 예정');
    assert.equal(insight.vehicleNo, '70A');
    assert.equal(insight.source, 'arrival');
  });

  it('calculates station-count distance from route order when arrival time is missing', () => {
    const insight = calculateRouteInsight({
      routeId: 'R1',
      nodeId: 'N3',
      routeStations,
      busLocations: [{ routeid: 'R1', vehicleno: '70A', nodeid: 'N1', gpslati: '35.1', gpslong: '128.1' }],
      arrivals: []
    });

    assert.equal(insight.message, '가장 가까운 버스는 2정류장 전');
    assert.equal(insight.stationCount, 2);
    assert.equal(insight.source, 'route-order');
  });

  it('falls back to nearest operating vehicle when order matching is unavailable', () => {
    const insight = calculateRouteInsight({
      routeId: 'R1',
      nodeId: 'N3',
      routeStations,
      busLocations: [{ routeid: 'R1', vehicleno: '70B', gpslati: '35.31', gpslong: '128.31' }],
      arrivals: []
    });

    assert.equal(insight.message, '가장 가까운 운행 차량 표시 중');
    assert.equal(insight.vehicleNo, '70B');
    assert.equal(insight.source, 'gps');
  });
});
