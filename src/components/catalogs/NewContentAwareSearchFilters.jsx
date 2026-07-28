import { useContext } from 'react';
import PropTypes from 'prop-types';
import { FacetListRefinement, SearchContext } from '@2uinc/frontend-enterprise-catalog-search';
import { NEW_CONTENT_REFINEMENT } from '../../constants';

const TRUE_VALUE = 'true';
const sortItemsByLabelAsc = (items) => [...items].sort((a, b) => a.label.localeCompare(b.label));

// Label stays `true` (not renamed) since FacetListBase dispatches item.label as the
// refinement value — renaming it would break the match against Algolia's is_new_content.
// messages.js maps it to "Recently added" for display.
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

// Same as the shared package's SearchFilters, but collapses is_new_content to just the true row.
const NewContentAwareSearchFilters = ({ variant }) => {
  const { refinements, searchFacetFilters } = useContext(SearchContext);

  return searchFacetFilters.map(({
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
  ));
};

NewContentAwareSearchFilters.propTypes = {
  variant: PropTypes.string,
};

NewContentAwareSearchFilters.defaultProps = {
  variant: 'inverse',
};

export default NewContentAwareSearchFilters;
