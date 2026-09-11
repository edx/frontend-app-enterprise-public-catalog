import { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FacetListRefinement, SearchContext } from '@2uinc/frontend-enterprise-catalog-search';
import { LEARNING_TYPE_REFINEMENT, NEW_CONTENT_REFINEMENT } from '../../constants';
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

const renderFacet = (facet, { refinements, variant }) => {
  const {
    title, attribute, isSortedAlphabetical, typeaheadOptions, noDisplay,
  } = facet;
  return (
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
  );
};

// Like the shared package's SearchFilters, but collapses is_new_content to its true row, and
// splits into two explicit rows so Learning Type onward always lands on its own row — not just
// "when it happens to overflow", since exactly how many facets fit per row varies with the active
// Paragon theme (branded deploys render noticeably larger buttons than an unthemed local build).
// Both rows use flex-wrap (not nowrap/overflow) — each FacetListRefinement's dropdown menu.
const SearchFacetFiltersOverride = ({ variant }) => {
  const { refinements, searchFacetFilters } = useContext(SearchContext);

  const updatedFacetFilter = useMemo(
    () => searchFacetFilters.filter(filterFacetItems),
    [searchFacetFilters],
  );

  return useMemo(() => {
    const learningTypeIndex = updatedFacetFilter.findIndex(
      ({ attribute }) => attribute === LEARNING_TYPE_REFINEMENT,
    );
    const mainRowFacets = learningTypeIndex >= 0
      ? updatedFacetFilter.slice(0, learningTypeIndex)
      : updatedFacetFilter;
    const secondRowFacets = learningTypeIndex >= 0
      ? updatedFacetFilter.slice(learningTypeIndex)
      : [];
    const renderOptions = { refinements, variant };

    return (
      <>
        <div className="d-flex flex-wrap w-100">
          {mainRowFacets.map((facet) => renderFacet(facet, renderOptions))}
        </div>
        {secondRowFacets.length > 0 && (
          <div className="d-flex flex-wrap w-100">
            {secondRowFacets.map((facet) => renderFacet(facet, renderOptions))}
          </div>
        )}
      </>
    );
  }, [updatedFacetFilter, refinements, variant]);
};

SearchFacetFiltersOverride.propTypes = {
  variant: PropTypes.string,
};

SearchFacetFiltersOverride.defaultProps = {
  variant: 'inverse',
};

export default SearchFacetFiltersOverride;
