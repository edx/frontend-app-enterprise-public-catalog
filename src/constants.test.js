jest.mock('@2uinc/frontend-enterprise-catalog-search', () => ({
  SEARCH_FACET_FILTERS: [
    { attribute: 'skill_names', title: 'Skills' },
    { attribute: 'subjects', title: 'Subject' },
    { attribute: 'partners.name', title: 'Partner' },
    { attribute: 'programs', title: 'Program' },
    { attribute: 'level_type', title: 'Level' },
    { attribute: 'availability', title: 'Availability' },
    { attribute: 'language', title: 'Language', isSortedAlphabetical: true },
    { attribute: 'transcript_languages', title: 'Subtitle', isSortedAlphabetical: true },
  ],
}));

jest.mock('./config', () => ({
  __esModule: true,
  default: { PROGRAM_TYPE_FACET: false, NEW_CONTENT_FACET: false },
}));

// eslint-disable-next-line import/first
import {
  SEARCH_FACET_FILTERS,
  LANGUAGE_REFINEMENT,
  TRANSLATION_LANGUAGE_REFINEMENT,
  TRANSCRIPT_LANGUAGE_REFINEMENT,
  getLocalizedSearchFacetFilters,
} from './constants';

// Mock intl object to return `defaultMessage` of the argument.
const intl = {
  formatMessage: (message) => message.defaultMessage,
};

describe('getLocalizedSearchFacetFilters for ENT-12318', () => {
  const localizedFacetFilters = getLocalizedSearchFacetFilters(SEARCH_FACET_FILTERS, intl);

  it('renames the language facet from "Language" to "Course Language"', () => {
    expect(localizedFacetFilters.find((f) => f.attribute === LANGUAGE_REFINEMENT)).toMatchObject({
      attribute: LANGUAGE_REFINEMENT,
      title: 'Course Language',
      isSortedAlphabetical: true,
    });
  });

  it('renames the transcript_languages facet from "Subtitle" to "Transcript Language"', () => {
    expect(localizedFacetFilters.find((f) => f.attribute === TRANSCRIPT_LANGUAGE_REFINEMENT)).toMatchObject({
      attribute: TRANSCRIPT_LANGUAGE_REFINEMENT,
      title: 'Transcript Language',
      isSortedAlphabetical: true,
    });
  });

  it('inserts the translation_languages facet directly after the language facet', () => {
    const languageIndex = localizedFacetFilters.findIndex((f) => f.attribute === LANGUAGE_REFINEMENT);
    const translationIndex = localizedFacetFilters
      .findIndex((f) => f.attribute === TRANSLATION_LANGUAGE_REFINEMENT);
    expect(languageIndex).toBeGreaterThanOrEqual(0);
    expect(translationIndex).toBe(languageIndex + 1);
    expect(localizedFacetFilters[translationIndex]).toMatchObject({
      attribute: TRANSLATION_LANGUAGE_REFINEMENT,
      title: 'Translation Language',
      isSortedAlphabetical: true,
    });
  });

  it('orders Course Language, Translation Language, and Transcript Language consecutively, with no other facet in between', () => {
    const languageIndex = localizedFacetFilters.findIndex((f) => f.attribute === LANGUAGE_REFINEMENT);
    const translationIndex = localizedFacetFilters
      .findIndex((f) => f.attribute === TRANSLATION_LANGUAGE_REFINEMENT);
    const transcriptIndex = localizedFacetFilters
      .findIndex((f) => f.attribute === TRANSCRIPT_LANGUAGE_REFINEMENT);
    expect(translationIndex).toBe(languageIndex + 1);
    expect(transcriptIndex).toBe(translationIndex + 1);
  });

  it('resolves facet titles through intl.formatMessage rather than hardcoded strings', () => {
    const formatMessageSpy = jest.fn((message) => message.defaultMessage);
    getLocalizedSearchFacetFilters(SEARCH_FACET_FILTERS, { formatMessage: formatMessageSpy });
    expect(formatMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'searchFacetFilters.courseLanguage.title' }),
    );
    expect(formatMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'searchFacetFilters.transcriptLanguage.title' }),
    );
  });

  it('does not mutate the base facet filters array or its objects (pure function, safe under React StrictMode)', () => {
    const originalLanguageFacet = SEARCH_FACET_FILTERS.find((f) => f.attribute === LANGUAGE_REFINEMENT);
    expect(originalLanguageFacet.title).toBe('Language');
    expect(SEARCH_FACET_FILTERS.some((f) => f.attribute === TRANSLATION_LANGUAGE_REFINEMENT)).toBe(false);
  });
});

describe('getLocalizedSearchFacetFilters when translation_languages already exists upstream', () => {
  it('repositions an existing translation_languages facet directly after language, instead of leaving it in place', () => {
    const baseFacetFiltersWithPreexistingTranslation = [
      { attribute: 'skill_names', title: 'Skills' },
      { attribute: 'level_type', title: 'Level' },
      { attribute: 'translation_languages', title: 'Translation Languages', isSortedAlphabetical: true },
      { attribute: 'availability', title: 'Availability' },
      { attribute: 'language', title: 'Language', isSortedAlphabetical: true },
      { attribute: 'transcript_languages', title: 'Subtitle', isSortedAlphabetical: true },
    ];

    const result = getLocalizedSearchFacetFilters(baseFacetFiltersWithPreexistingTranslation, intl);

    const languageIndex = result.findIndex((f) => f.attribute === LANGUAGE_REFINEMENT);
    const translationIndex = result.findIndex((f) => f.attribute === TRANSLATION_LANGUAGE_REFINEMENT);
    expect(translationIndex).toBe(languageIndex + 1);
    expect(result.filter((f) => f.attribute === TRANSLATION_LANGUAGE_REFINEMENT)).toHaveLength(1);
    // The upstream object's own title ("Translation Languages") must not leak
    // through — it should always be normalized to the intended singular label.
    expect(result[translationIndex]).toMatchObject({
      attribute: TRANSLATION_LANGUAGE_REFINEMENT,
      title: 'Translation Language',
      isSortedAlphabetical: true,
    });
  });
});
