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
} from './constants';

describe('search facet filter overrides for ENT-12318', () => {
  it('renames the language facet from "Language" to "Course Language"', () => {
    expect(SEARCH_FACET_FILTERS.find((f) => f.attribute === LANGUAGE_REFINEMENT)).toMatchObject({
      attribute: LANGUAGE_REFINEMENT,
      title: 'Course Language',
      isSortedAlphabetical: true,
    });
  });

  it('renames the transcript_languages facet from "Subtitle" to "Transcript Language"', () => {
    expect(SEARCH_FACET_FILTERS.find((f) => f.attribute === TRANSCRIPT_LANGUAGE_REFINEMENT)).toMatchObject({
      attribute: TRANSCRIPT_LANGUAGE_REFINEMENT,
      title: 'Transcript Language',
      isSortedAlphabetical: true,
    });
  });

  it('inserts the translation_languages facet directly after the language facet', () => {
    const languageIndex = SEARCH_FACET_FILTERS.findIndex((f) => f.attribute === LANGUAGE_REFINEMENT);
    const translationIndex = SEARCH_FACET_FILTERS
      .findIndex((f) => f.attribute === TRANSLATION_LANGUAGE_REFINEMENT);
    expect(languageIndex).toBeGreaterThanOrEqual(0);
    expect(translationIndex).toBe(languageIndex + 1);
    expect(SEARCH_FACET_FILTERS[translationIndex]).toMatchObject({
      attribute: TRANSLATION_LANGUAGE_REFINEMENT,
      title: 'Translation Language',
      isSortedAlphabetical: true,
    });
  });

  it('orders Course Language, Translation Language, and Transcript Language consecutively', () => {
    const languageFilterAttributes = [
      LANGUAGE_REFINEMENT,
      TRANSLATION_LANGUAGE_REFINEMENT,
      TRANSCRIPT_LANGUAGE_REFINEMENT,
    ];
    const order = SEARCH_FACET_FILTERS
      .map((f) => f.attribute)
      .filter((attribute) => languageFilterAttributes.includes(attribute));
    expect(order).toEqual(languageFilterAttributes);
  });
});
