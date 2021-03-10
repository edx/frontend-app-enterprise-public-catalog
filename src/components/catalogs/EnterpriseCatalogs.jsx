import React from 'react';
import {
  Configure, InstantSearch,
} from 'react-instantsearch-dom';

import { SearchData, SearchHeader } from '@edx/frontend-enterprise';

import Wrapper from '../PageWrapper';
import { NUM_RESULTS_PER_PAGE } from '../../constants';
import CatalogSearchResults from './CatalogSearchResults';
import { useAlgoliaIndex } from './data/hooks';

export default function EnterpriseCatalogs() {
  const { algoliaIndexName, searchClient } = useAlgoliaIndex();

  return (
    <Wrapper>
      <SearchData>
        <InstantSearch
          indexName={algoliaIndexName}
          searchClient={searchClient}
        >
          <Configure hitsPerPage={NUM_RESULTS_PER_PAGE} />
          <div className="search-header-wrapper">
            <SearchHeader />
          </div>
          <CatalogSearchResults />
        </InstantSearch>
      </SearchData>
    </Wrapper>
  );
}
