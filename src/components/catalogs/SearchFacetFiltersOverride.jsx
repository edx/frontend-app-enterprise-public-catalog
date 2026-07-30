import { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FacetListRefinement, SearchContext } from '@2uinc/frontend-enterprise-catalog-search';
import { NEW_CONTENT_REFINEMENT } from '../../constants';
import features from '../../config';

const TRUE_VALUE = 'true';
const sortItemsByLabelAsc = (items) => [...items].sort((a, b) => a.label.localeCompare(b.label));

// Label stays `true` (not renamed) — FacetListBase dispatches it as the refinement value.
const newContentTransform = (items) => items.filter(({ label }) => label === TRUE_VALUE);

const getTransformItems = ({ attribute, isSortedAlphabetical }) => {
  if (attribute === NEW_CONTENT_REFINEMENT) {
    return newContentTransform;
  }
  if (isSortedAlphabetical) {
    return sortItemsByLabelAsc;
  }
  return (items) => items;
};

// Drops is_new_content when its flag is off; every other facet passes through.
const filterFacetItems = ({ attribute }) => {
  if (attribute === NEW_CONTENT_REFINEMENT && !features.NEW_CONTENT_FACET) {
    return false;
  }
  return true;
};

// Like the shared package's SearchFilters, but collapses is_new_content to its true row.
const SearchFacetFiltersOverride = ({ variant }) => {
  const { refinements, searchFacetFilters } = useContext(SearchContext);

  const updatedFacetFilter = useMemo(
    () => searchFacetFilters.filter(filterFacetItems),
    [searchFacetFilters],
  );

  return useMemo(() => updatedFacetFilter.map(({
    title, attribute, isSortedAlphabetical, typeaheadOptions, noDisplay,
  }) => (
    <FacetListRefinement
      key={attribute}
      title={title}
      attribute={attribute}
      limit={300}
      transformItems={getTransformItems({ attribute, isSortedAlphabetical })}
      refinements={refinements}
      defaultRefinement={refinements[attribute]}
      facetValueType="array"
      typeaheadOptions={typeaheadOptions}
      searchable={!!typeaheadOptions}
      variant={variant}
      noDisplay={noDisplay}
    />
  )), [updatedFacetFilter, refinements, variant]);
};

SearchFacetFiltersOverride.propTypes = {
  variant: PropTypes.string,
};

SearchFacetFiltersOverride.defaultProps = {
  variant: 'inverse',
};

export default SearchFacetFiltersOverride;
