import { EXEC_ED_TITLE } from '../constants';
import {
  AVAILABILITY_STATUS,
  availabilitySubtitle,
  checkAvailability,
  convertLearningTypesToFilters,
  createQueryParams,
  formatSessionDate,
} from './catalogUtils';

describe('catalogUtils', () => {
  it('converts lists of learning types to algolia filters', () => {
    const algoliaFilter = convertLearningTypesToFilters(['a', 'b', EXEC_ED_TITLE]);
    expect(algoliaFilter).toEqual('a OR b OR "Executive Education"');
  });

  it('parses an object with an array of values and returns query string', () => {
    const options = {
      enterprise_catalog_query_titles: [
        'A la carte',
      ],
      availability: [
        'Available Now',
        'Starting Soon',
      ],
    };
    const expectedQueryParams = 'enterprise_catalog_query_titles=A+la+carte&availability=Available+Now&availability=Starting+Soon';
    const queryParams = createQueryParams(options);
    expect(queryParams).toEqual(expectedQueryParams);
  });

  describe('checkAvailability', () => {
    it('returns AVAILABLE_NOW when the session has started but not ended', () => {
      expect(checkAvailability('2020-01-24T05:00:00Z', '2080-01-01T17:00:00Z'))
        .toEqual(AVAILABILITY_STATUS.AVAILABLE_NOW);
    });

    it('returns STARTING_SOON when the session has not started yet', () => {
      const futureStart = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      expect(checkAvailability(futureStart, '2080-01-01T17:00:00Z')).toEqual(AVAILABILITY_STATUS.STARTING_SOON);
    });

    it('returns an empty string when the session has already ended', () => {
      expect(checkAvailability('2019-01-24T05:00:00Z', '2020-01-01T17:00:00Z')).toEqual(AVAILABILITY_STATUS.NONE);
    });

    it('returns an empty string when the start date is missing/invalid, even if the end date is in the future', () => {
      expect(checkAvailability(undefined, '2080-01-01T17:00:00Z')).toEqual(AVAILABILITY_STATUS.NONE);
    });
  });

  describe('availabilitySubtitle', () => {
    it('shows both start and end dates together when both are known', () => {
      expect(availabilitySubtitle('2020-01-24T05:00:00Z', '2080-01-01T17:00:00Z')).toEqual(
        `Session starts ${formatSessionDate(new Date('2020-01-24T05:00:00Z'))} | Session ends ${formatSessionDate(new Date('2080-01-01T17:00:00Z'))}`,
      );
    });

    it('appends the upcoming session count when both dates are known', () => {
      expect(availabilitySubtitle('2020-01-24T05:00:00Z', '2080-01-01T17:00:00Z', 3)).toEqual(
        `Session starts ${formatSessionDate(new Date('2020-01-24T05:00:00Z'))} | Session ends ${formatSessionDate(new Date('2080-01-01T17:00:00Z'))} • 3 additional session(s)`,
      );
    });

    it('falls back to only the end date when the start date is unknown', () => {
      expect(availabilitySubtitle(undefined, '2080-01-01T17:00:00Z')).toEqual(
        `Session ends ${formatSessionDate(new Date('2080-01-01T17:00:00Z'))}`,
      );
    });

    it('falls back to only the start date when the end date is unknown', () => {
      const futureStart = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      expect(availabilitySubtitle(futureStart, undefined)).toEqual(
        `Session starts ${formatSessionDate(new Date(futureStart))}`,
      );
    });

    it('returns an empty string when neither date is known', () => {
      expect(availabilitySubtitle(undefined, undefined)).toEqual('');
    });

    it('returns an empty string when both dates are known but the session has already ended', () => {
      expect(availabilitySubtitle('2019-01-24T05:00:00Z', '2020-01-01T17:00:00Z')).toEqual('');
    });

    it('does not prepend the upcoming-runs suffix onto an empty base string', () => {
      expect(availabilitySubtitle('2019-01-24T05:00:00Z', '2020-01-01T17:00:00Z', 2)).toEqual('');
    });
  });
});
