import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addRecentStation,
  isFavoriteStation,
  toggleFavoriteStation
} from './stationStorage.js';

const stationA = { nodeid: 'CWB379000573', nodenm: '지귀상가', nodeno: 119111 };
const stationB = { nodeid: 'CWB379000574', nodenm: '복음요양병원', nodeno: 119112 };

describe('addRecentStation', () => {
  it('moves an existing station to the front without duplication', () => {
    assert.deepEqual(addRecentStation([stationA, stationB], stationB), [stationB, stationA]);
  });
});

describe('toggleFavoriteStation', () => {
  it('adds a station that is not already favorited', () => {
    assert.deepEqual(toggleFavoriteStation([], stationA), [stationA]);
  });

  it('removes a station that is already favorited', () => {
    assert.deepEqual(toggleFavoriteStation([stationA], stationA), []);
  });
});

describe('isFavoriteStation', () => {
  it('checks favorites by node id', () => {
    assert.equal(isFavoriteStation([stationA], stationA), true);
    assert.equal(isFavoriteStation([stationA], stationB), false);
  });
});
