import { renderHook } from '@testing-library/react';

import { useAlgoliaIndex, useMarketingSite } from '../../data/hooks';

const indexName = 'test';
const indexNameV2 = 'test-v2';
const appid = 'test app';
const key = 'test key';
const marketingSite = 'http://test.edx.org';

jest.mock('@edx/frontend-platform', () => ({
  ...jest.requireActual('@edx/frontend-platform'),
  getConfig: jest.fn(),
}));

// eslint-disable-next-line import/no-extraneous-dependencies
const { getConfig } = require('@edx/frontend-platform');

describe('hooks function tests', () => {
  describe('useAlgoliaIndex', () => {
    it.each([
      ['v1 index when ALGOLIA_INDEX_NAME_V2 is not set', null, indexName],
      ['v2 index when ALGOLIA_INDEX_NAME_V2 is set', indexNameV2, indexNameV2],
    ])('uses %s', (_, algoliaIndexNameV2, expectedIndexName) => {
      getConfig.mockReturnValue({
        ALGOLIA_INDEX_NAME: indexName,
        ALGOLIA_INDEX_NAME_V2: algoliaIndexNameV2,
        ALGOLIA_APP_ID: appid,
        ALGOLIA_SEARCH_API_KEY: key,
      });
      const { result } = renderHook(() => useAlgoliaIndex());
      expect(result.current.algoliaIndexName).toBe(expectedIndexName);
      expect(result.current.searchClient.appId).toBe(appid);
    });
  });

  test('marketing site url resolves from config', () => {
    getConfig.mockReturnValue({ HUBSPOT_MARKETING_URL: marketingSite });
    const { result } = renderHook(() => useMarketingSite());
    expect(result.current).toBe(marketingSite);
  });
});
