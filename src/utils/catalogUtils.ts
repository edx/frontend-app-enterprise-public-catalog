import { EXEC_ED_TITLE } from '../constants';

/* eslint-disable import/prefer-default-export */

const AVAILABILITY_STATUS = {
  AVAILABLE_NOW: 'available_now',
  STARTING_SOON: 'starting_soon',
  NONE: '',
} as const;

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

/**
 * Formats a Date the same way everywhere a session start/end date is displayed, so callers
 * (and tests) never re-derive this formatting independently.
 */
function formatSessionDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

function checkSubscriptions(courseAssociatedCatalogs) {
  const inSubscription = courseAssociatedCatalogs.includes(
    process.env.EDX_FOR_SUBSCRIPTION_TITLE,
  );
  if (inSubscription) {
    return 'Included in subscription catalog';
  }
  return false;
}

/**
 * Returns one of `AVAILABILITY_STATUS`'s values describing a session's availability. Callers are
 * responsible for mapping the returned status to localized display text (via
 * `intl.formatMessage`) rather than rendering it directly.
 */
function checkAvailability(start, end): string {
  const nowDate = new Date(Date.now());
  const startDate = new Date(start);
  const endDate = new Date(end);
  const hasValidStart = !!start && isValidDate(startDate);
  const hasValidEnd = !!end && isValidDate(endDate);
  if (hasValidStart && hasValidEnd && startDate < nowDate && endDate > nowDate) {
    return AVAILABILITY_STATUS.AVAILABLE_NOW;
  }
  if (hasValidStart && startDate > nowDate) {
    return AVAILABILITY_STATUS.STARTING_SOON;
  }
  return AVAILABILITY_STATUS.NONE;
}

/**
 * Builds a human-readable session date subtitle, e.g. "Session starts Aug 16, 2026 | Session
 * ends Oct 14, 2026". Shows both dates together whenever both are known and the session hasn't
 * ended yet; falls back to whichever single date is known and still relevant, or an empty string
 * when neither is known or the session has already ended.
 */
function availabilitySubtitle(start, end, upcomingRuns?: number) {
  const nowDate = new Date(Date.now());
  let retString = '';
  const startDate = new Date(start);
  const endDate = new Date(end);
  const hasValidStart = !!start && isValidDate(startDate);
  const hasValidEnd = !!end && isValidDate(endDate);
  if (hasValidStart && hasValidEnd && endDate > nowDate) {
    retString = `Session starts ${formatSessionDate(startDate)} | Session ends ${formatSessionDate(endDate)}`;
  } else if (hasValidEnd && endDate > nowDate) {
    retString = `Session ends ${formatSessionDate(endDate)}`;
  } else if (hasValidStart && startDate > nowDate) {
    retString = `Session starts ${formatSessionDate(startDate)}`;
  }
  if (upcomingRuns !== undefined && upcomingRuns > 0 && retString) {
    retString += ` • ${upcomingRuns} additional session(s)`;
  }
  return retString;
}

function convertLearningTypesToFilters(types) {
  return types.reduce((learningFacets, type) => {
    if (type === EXEC_ED_TITLE) {
      learningFacets.push(`"${type}"`);
    } else {
      learningFacets.push(type);
    }
    return learningFacets;
  }, []).join(' OR ');
}

/**
 * Parses an object that accounts for keys with values that is an array.
 * e.g. {'availability': ['Available Now', 'Starting Soon']} will be parsed as
 * 'availability=Available+Now&availability=Starting+Soon'
 *
 * @param Object query parameter with an array of values.
 * @returns A string containing a query string suitable for use in a URL.
 */

function createQueryParams(options: Record<string, any>): string {
  const queryParams = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        queryParams.append(key, item);
      });
      return;
    }
    queryParams.set(key, value.toString());
  });
  return queryParams.toString();
}

export {
  AVAILABILITY_STATUS,
  availabilitySubtitle,
  checkAvailability,
  checkSubscriptions,
  convertLearningTypesToFilters,
  createQueryParams,
  formatSessionDate,
};
