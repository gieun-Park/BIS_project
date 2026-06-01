import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildKakaoMapSdkUrl,
  getMapStations,
  getStationMarkerTone,
  getStationPosition
} from './kakaoMap.js';

describe('buildKakaoMapSdkUrl', () => {
  it('builds the Kakao Maps SDK URL with autoload disabled', () => {
    const url = buildKakaoMapSdkUrl('test-js-key');

    assert.equal(url.origin, 'https://dapi.kakao.com');
    assert.equal(url.pathname, '/v2/maps/sdk.js');
    assert.equal(url.searchParams.get('appkey'), 'test-js-key');
    assert.equal(url.searchParams.get('autoload'), 'false');
  });
});

describe('getStationPosition', () => {
  it('returns numeric latitude and longitude from a bus station', () => {
    assert.deepEqual(
      getStationPosition({ gpslati: '35.24477751', gpslong: '128.6594371' }),
      { lat: 35.24477751, lng: 128.6594371 }
    );
  });

  it('returns null when the station has no usable coordinates', () => {
    assert.equal(getStationPosition({ gpslati: '', gpslong: undefined }), null);
  });
});

describe('getMapStations', () => {
  it('keeps the selected station on the map without duplicating search results', () => {
    const selectedStation = { nodeid: 'CWB379000573', nodenm: '지귀상가' };
    const searchResults = [
      { nodeid: 'CWB379000573', nodenm: '지귀상가' },
      { nodeid: 'CWB379000575', nodenm: '지귀상가' },
    ];

    assert.deepEqual(getMapStations(searchResults, selectedStation), searchResults);
  });

  it('shows the selected station when there are no search results', () => {
    const selectedStation = { nodeid: 'CWB379000573', nodenm: '지귀상가' };

    assert.deepEqual(getMapStations([], selectedStation), [selectedStation]);
  });
});

describe('getStationMarkerTone', () => {
  it('marks the selected station differently from other search results', () => {
    const selectedStation = { nodeid: 'CWB379000573', nodenm: '지귀상가' };
    const otherStation = { nodeid: 'CWB379000575', nodenm: '지귀상가' };

    assert.equal(getStationMarkerTone(selectedStation, selectedStation), 'selected');
    assert.equal(getStationMarkerTone(otherStation, selectedStation), 'default');
  });
});
