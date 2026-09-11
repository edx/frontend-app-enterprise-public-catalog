/* eslint-disable import/prefer-default-export */
import { defineMessages } from '@edx/frontend-platform/i18n';
import { SEARCH_FACET_FILTERS } from '@2uinc/frontend-enterprise-catalog-search';
import features from './config';

const messages = defineMessages({
  'searchFacetFilters.courseLanguage.title': {
    id: 'searchFacetFilters.courseLanguage.title',
    defaultMessage: 'Course Language',
    description: 'Title for the course language facet filter (renamed from "Language")',
  },
  'searchFacetFilters.translationLanguage.title': {
    id: 'searchFacetFilters.translationLanguage.title',
    defaultMessage: 'Translation Language',
    description: 'Title for the translation language facet filter',
  },
  'searchFacetFilters.transcriptLanguage.title': {
    id: 'searchFacetFilters.transcriptLanguage.title',
    defaultMessage: 'Transcript Language',
    description: 'Title for the transcript language facet filter (renamed from "Subtitle")',
  },
});

export const PAGE_TITLE = 'edX Enterprise Catalogs';

/**
 * Event names to use for tracking
 * Spec: https://openedx.atlassian.net/wiki/spaces/AN/pages/2624455676/Enterprise+public+catalog+Event+Design
 */
export const TRACKING_APP_NAME = 'explore-catalog';
// end: tracking related
export const QUERY_TITLE_REFINEMENT = 'enterprise_catalog_query_titles';
export const AVAILABILITY_REFINEMENT = 'availability';
export const AVAILABILITY_REFINEMENT_DEFAULTS = [
  'Available Now',
  'Starting Soon',
  'Upcoming',
];

// Facet filters
export const CONTENT_TYPE_REFINEMENT = 'content_type';
export const COURSE_TYPE_REFINEMENT = 'course_type';
export const LEARNING_TYPE_REFINEMENT = 'learning_type';
export const NEW_CONTENT_REFINEMENT = 'is_new_content';
export const LANGUAGE_REFINEMENT = 'language';
export const TRANSLATION_LANGUAGE_REFINEMENT = 'translation_languages';
export const TRANSCRIPT_LANGUAGE_REFINEMENT = 'transcript_languages';

// Page refinement settings
export const HIDE_CARDS_REFINEMENT = 'hide_cards';
export const HIDE_PRICE_REFINEMENT = 'hide_price';
export const NUM_RESULTS_PER_PAGE = 40;

// Learning types
export const CONTENT_TYPE_COURSE = 'course';
export const CONTENT_TYPE_PROGRAM = 'program';
export const EXEC_ED_TITLE = 'Executive Education';

// Page metric settings
export const NUM_RESULTS_PROGRAM = 4;
export const NUM_RESULTS_COURSE = 8;

export const COURSE_TITLE = 'Courses';
export const PROGRAM_TITLE = 'Programs';

export const NO_RESULTS_DECK_ITEM_COUNT = 4;
export const NO_RESULTS_PAGE_ITEM_COUNT = 1;
export const NO_RESULTS_PAGE_SIZE = 4;

// Descriptions
export const EDX_COURSE_TITLE_DESC = 'Self paced online learning from world-class academic institutions and corporate partners.';
export const TWOU_EXEC_ED_TITLE_DESC = 'Immersive, instructor led online short courses designed to develop interpersonal, analytical, and critical thinking skills.';
export const PROGRAM_TITLE_DESC = 'Multi-course bundled learning for skills mastery and to earn credentials such as Professional Certificates, MicroBachelors™, MicroMasters®, and Master’s Degrees.';

// Lead generation form
export const UTM_PARAM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
];
export const LEAD_GEN_DISABLE_PARAM = 'disable_lead_gen';
export const LEAD_GEN_DISABLE_STORAGE_KEY = 'exploreCatalogLeadGenDisabled';
export const LEAD_GEN_SUBMITTED_STORAGE_KEY = 'exploreCatalogLeadGenSubmitted';
export const LEAD_GEN_SUBMIT_MESSAGE_KEY = 'pardotFormSubmitted';
export const LEAD_GEN_UTM_STORAGE_KEY = 'exploreCatalogLeadGenUtmParams';
// Only visits tagged with business.edx.org's utm_source trigger the lead-gen gate.
export const LEAD_GEN_GATE_UTM_SOURCE = 'edxenterprise';

// Ask Xpert
export const XPERT_RESULT_STATUSES = ['IN_PROGRESS', 'PENDING', 'STARTED', 'FAILURE'];
export const XPERT_POLLING_RETRY_INTERVAL = 5000;
export const progressBarDuration = 30000; // 30 seconds in milliseconds
export const targetProgressBarValue = 95;

const OVERRIDE_FACET_FILTERS = [];

if (features.PROGRAM_TYPE_FACET) {
  const PROGRAM_TYPE_FACET_OVERRIDE = {
    overrideSearchKey: 'title',
    overrideSearchValue: 'Program',
    updatedFacetFilterValue: {
      attribute: 'program_type',
      title: 'Program',
      isSortedAlphabetical: true,
      typeaheadOptions: {
        placeholder: 'Find a program...',
        ariaLabel: 'Type to find a program',
        minLength: 3,
      },
    },
  };
  OVERRIDE_FACET_FILTERS.push(PROGRAM_TYPE_FACET_OVERRIDE);
}

OVERRIDE_FACET_FILTERS.forEach(
  ({ overrideSearchKey, overrideSearchValue, updatedFacetFilterValue }) => {
    SEARCH_FACET_FILTERS.find((facetFilter, index) => {
      if (facetFilter[overrideSearchKey] === overrideSearchValue) {
        SEARCH_FACET_FILTERS[index] = updatedFacetFilterValue;
        return true;
      }
      return false;
    });
  },
);

/**
 * Returns a NEW facet filter list with "Language" renamed to Course Language,
 * "Subtitle" renamed to Transcript Language, and Translation Language
 * repositioned (or inserted) directly after Course Language, so the filter
 * order reads: Course Language, Translation Language, Transcript Language —
 * even if translation_languages already exists elsewhere in `baseFacetFilters`
 * (e.g. if a future package version adds it).
 *
 * This is a pure function: it never mutates `baseFacetFilters` or any facet
 * object within it. Requires `intl` (only available at render time via
 * useIntl()), so the caller is responsible for invoking it once `intl` is
 * available — e.g. inside a useMemo keyed on `intl` (see CatalogPage.jsx).
 * Renaming/reordering the shared SEARCH_FACET_FILTERS singleton in place here
 * would be a side effect during render, which is unsafe under StrictMode's
 * double-invocation and concurrent rendering.
 */
export function getLocalizedSearchFacetFilters(baseFacetFilters, intl) {
  const facetFilters = baseFacetFilters.map((facetFilter) => ({ ...facetFilter }));

  // Match by `attribute` (stable) rather than the current `title` string, which
  // can change upstream or be localized — and merge into the existing facet
  // object rather than replacing it outright, so any other properties the
  // upstream package may set (typeaheadOptions, noDisplay, etc.) survive.
  const languageFacetOverrides = [
    {
      matchAttribute: LANGUAGE_REFINEMENT,
      title: intl.formatMessage(messages['searchFacetFilters.courseLanguage.title']),
    },
    {
      matchAttribute: TRANSCRIPT_LANGUAGE_REFINEMENT,
      title: intl.formatMessage(messages['searchFacetFilters.transcriptLanguage.title']),
    },
  ];
  languageFacetOverrides.forEach(({ matchAttribute, title }) => {
    const index = facetFilters.findIndex((facetFilter) => facetFilter.attribute === matchAttribute);
    if (index >= 0) {
      facetFilters[index] = {
        ...facetFilters[index],
        title,
        isSortedAlphabetical: true,
      };
    }
  });

  const languageFacetIndex = facetFilters.findIndex(
    (facetFilter) => facetFilter.attribute === LANGUAGE_REFINEMENT,
  );
  if (languageFacetIndex >= 0) {
    const existingTranslationLanguageFacetIndex = facetFilters.findIndex(
      (facetFilter) => facetFilter.attribute === TRANSLATION_LANGUAGE_REFINEMENT,
    );
    // Normalize the title and sort behavior even when reusing an existing
    // facet object, so an upstream label (e.g. "Translation Languages") never
    // leaks through instead of the intended "Translation Language".
    const translationLanguageFacet = {
      ...(existingTranslationLanguageFacetIndex >= 0
        ? facetFilters[existingTranslationLanguageFacetIndex]
        : { attribute: TRANSLATION_LANGUAGE_REFINEMENT }),
      title: intl.formatMessage(messages['searchFacetFilters.translationLanguage.title']),
      isSortedAlphabetical: true,
    };
    if (existingTranslationLanguageFacetIndex >= 0) {
      facetFilters.splice(existingTranslationLanguageFacetIndex, 1);
    }
    const insertAt = facetFilters.findIndex(
      (facetFilter) => facetFilter.attribute === LANGUAGE_REFINEMENT,
    ) + 1;
    facetFilters.splice(insertAt, 0, translationLanguageFacet);
  }

  return facetFilters;
}

export { SEARCH_FACET_FILTERS };
