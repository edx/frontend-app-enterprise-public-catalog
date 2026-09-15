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

// TEMPORARY ROLLBACK FOR TESTING (see PR discussion) — like the shared package's SearchFilters,
// but collapses is_new_content to its true row. Renders every facet as one flat, single wrapping
// row with no explicit grouping, so the browser's own flex-wrap decides where lines break based
// on available width. This does NOT guarantee Learning Type/Latest Offerings stay grouped
// together or land on their own row — a real Stage test earlier showed this natural wrap point
// can split them apart from each other. Kept only because the user explicitly asked to see this
// behavior directly before deciding; revert to the explicit two-row split if it doesn't hold up.
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
