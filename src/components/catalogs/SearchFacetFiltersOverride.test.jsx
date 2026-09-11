import { render, screen } from '@testing-library/react';
import { SearchContext } from '@2uinc/frontend-enterprise-catalog-search';
import '@testing-library/jest-dom/extend-expect';
import SearchFacetFiltersOverride from './SearchFacetFiltersOverride';
import mockFeatures from '../../config';

jest.mock('../../config', () => ({
  __esModule: true,
  default: { NEW_CONTENT_FACET: false },
}));

const capturedTransforms = {};

jest.mock('@2uinc/frontend-enterprise-catalog-search', () => {
  // eslint-disable-next-line global-require
  const PropTypes = require('prop-types');
  const actual = jest.requireActual('@2uinc/frontend-enterprise-catalog-search');
  const FacetListRefinement = ({ attribute, title, transformItems }) => {
    capturedTransforms[attribute] = transformItems;
    return <div data-testid={`facet-${attribute}`}>{title}</div>;
  };
  FacetListRefinement.propTypes = {
    attribute: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    transformItems: PropTypes.func.isRequired,
  };
  return {
    ...actual,
    FacetListRefinement,
  };
});

const baseFacets = [
  { attribute: 'skill_names', title: 'Skills' },
  { attribute: 'partners.name', title: 'Partner', isSortedAlphabetical: true },
];

const renderWithContext = (searchFacetFilters, refinements = {}) => render(
  <SearchContext.Provider value={{ refinements, searchFacetFilters }}>
    <SearchFacetFiltersOverride />
  </SearchContext.Provider>,
);

describe('SearchFacetFiltersOverride', () => {
  beforeEach(() => {
    Object.keys(capturedTransforms).forEach((key) => delete capturedTransforms[key]);
    mockFeatures.NEW_CONTENT_FACET = false;
  });

  it('renders one cell per facet from SearchContext', () => {
    renderWithContext(baseFacets);
    expect(screen.getByTestId('facet-skill_names')).toBeInTheDocument();
    expect(screen.getByTestId('facet-partners.name')).toBeInTheDocument();
  });

  it('sorts alphabetical facets via transformItems', () => {
    renderWithContext(baseFacets);
    const transform = capturedTransforms['partners.name'];
    const result = transform([{ label: 'Zed' }, { label: 'Alpha' }]);
    expect(result).toEqual([{ label: 'Alpha' }, { label: 'Zed' }]);
  });

  it('transformItems for is_new_content keeps only the true row with original label preserved', () => {
    mockFeatures.NEW_CONTENT_FACET = true;
    const facets = [
      { attribute: 'is_new_content', title: 'Latest Offerings' },
    ];
    renderWithContext(facets);
    const transform = capturedTransforms.is_new_content;
    const result = transform([
      { label: 'true', count: 181, isRefined: false },
      { label: 'false', count: 77, isRefined: false },
    ]);
    expect(result).toEqual([
      { label: 'true', count: 181, isRefined: false },
    ]);
  });

  it('renders is_new_content facet alongside other facets when the flag is on', () => {
    mockFeatures.NEW_CONTENT_FACET = true;
    const facets = [
      ...baseFacets,
      { attribute: 'is_new_content', title: 'Latest Offerings' },
    ];
    renderWithContext(facets);
    expect(screen.getByTestId('facet-is_new_content')).toBeInTheDocument();
  });

  it('omits the is_new_content facet entirely when the flag is off', () => {
    mockFeatures.NEW_CONTENT_FACET = false;
    const facets = [
      ...baseFacets,
      { attribute: 'is_new_content', title: 'Latest Offerings' },
    ];
    renderWithContext(facets);
    expect(screen.getByTestId('facet-skill_names')).toBeInTheDocument();
    expect(screen.queryByTestId('facet-is_new_content')).not.toBeInTheDocument();
  });

  it('still renders unrelated facets when the flag is off', () => {
    mockFeatures.NEW_CONTENT_FACET = false;
    renderWithContext(baseFacets);
    expect(screen.getByTestId('facet-skill_names')).toBeInTheDocument();
    expect(screen.getByTestId('facet-partners.name')).toBeInTheDocument();
  });

  it('renders main facets in a first row and learning_type onward in a separate second row', () => {
    mockFeatures.NEW_CONTENT_FACET = true;
    const facets = [
      ...baseFacets,
      { attribute: 'learning_type', title: 'Learning Type' },
      { attribute: 'is_new_content', title: 'Latest Offerings' },
    ];
    const { container } = renderWithContext(facets);
    const rows = Array.from(container.children);
    expect(rows).toHaveLength(2);

    const firstRowTestIds = Array.from(rows[0].children).map((child) => child.getAttribute('data-testid'));
    expect(firstRowTestIds).toEqual(['facet-skill_names', 'facet-partners.name']);

    const secondRowTestIds = Array.from(rows[1].children).map((child) => child.getAttribute('data-testid'));
    expect(secondRowTestIds).toEqual(['facet-learning_type', 'facet-is_new_content']);
  });

  it('renders a single row (no second row) when learning_type is not in the facet list', () => {
    const { container } = renderWithContext(baseFacets);
    expect(container.children).toHaveLength(1);
    const firstRowTestIds = Array.from(container.children[0].children)
      .map((child) => child.getAttribute('data-testid'));
    expect(firstRowTestIds).toEqual(['facet-skill_names', 'facet-partners.name']);
  });
});
