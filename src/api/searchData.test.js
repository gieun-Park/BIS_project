import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveIntegratedSearch } from './searchData.js';

describe('resolveIntegratedSearch', () => {
  it('keeps route results when station search fails in all mode', async () => {
    const results = await resolveIntegratedSearch({
      query: '100',
      searchMode: 'all',
      searchStops: async () => {
        throw new Error('station failed');
      },
      searchRoutes: async () => [{ routeid: 'R100', routeno: '100' }]
    });

    assert.deepEqual(results.stationResults, []);
    assert.deepEqual(results.routeResults, [{ routeid: 'R100', routeno: '100' }]);
    assert.equal(results.hasPartialFailure, true);
  });

  it('throws when every requested search source fails', async () => {
    await assert.rejects(
      () => resolveIntegratedSearch({
        query: '100',
        searchMode: 'route',
        searchStops: async () => [],
        searchRoutes: async () => {
          throw new Error('route failed');
        }
      }),
      /route failed/
    );
  });
});
