import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  filterBusStops,
  getBusLocationKey,
  getBusLocationPosition,
  normalizeBusLocations,
  normalizeItems
} from './busData.js';

describe('normalizeItems', () => {
  it('returns an empty array when the API has no items', () => {
    assert.deepEqual(normalizeItems(undefined), []);
  });

  it('wraps a single API item in an array', () => {
    assert.deepEqual(normalizeItems({ nodeid: 'CWB1' }), [{ nodeid: 'CWB1' }]);
  });
});

describe('filterBusStops', () => {
  it('matches bus stops by Korean station name', () => {
    const stops = [
      { nodeid: 'CWB379000573', nodenm: '지귀상가', citycode: 38010 },
      { nodeid: 'CWB379000574', nodenm: '복음요양병원', citycode: 38010 },
    ];

    assert.deepEqual(filterBusStops(stops, '지귀'), [
      { nodeid: 'CWB379000573', nodenm: '지귀상가', citycode: 38010 },
    ]);
  });
});

describe('normalizeBusLocations', () => {
  it('keeps bus locations that have usable GPS coordinates', () => {
    const locations = normalizeBusLocations([
      { vehicleno: '경남70자1000', gpslati: '35.2279', gpslong: '128.6819' },
      { vehicleno: '경남70자1001', gpslati: '', gpslong: '128.6819' },
    ]);

    assert.deepEqual(locations, [
      { vehicleno: '경남70자1000', gpslati: '35.2279', gpslong: '128.6819' },
    ]);
  });
});

describe('getBusLocationPosition', () => {
  it('converts API GPS strings into numeric map coordinates', () => {
    assert.deepEqual(
      getBusLocationPosition({ gpslati: '35.2279', gpslong: '128.6819' }),
      { lat: 35.2279, lng: 128.6819 }
    );
  });

  it('returns null when a bus location has no usable GPS coordinates', () => {
    assert.equal(getBusLocationPosition({ gpslati: '0', gpslong: '128.6819' }), null);
  });
});

describe('getBusLocationKey', () => {
  it('prefers vehicle number for stable animated markers', () => {
    assert.equal(
      getBusLocationKey({ vehicleno: '경남70자1000', routeid: 'CWB379001000' }, 0),
      '경남70자1000'
    );
  });

  it('falls back to route and node information when vehicle number is missing', () => {
    assert.equal(
      getBusLocationKey({ routeid: 'CWB379001000', nodeid: 'CWB379000573' }, 2),
      'CWB379001000-CWB379000573'
    );
  });
});
