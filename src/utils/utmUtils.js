/**
 * Helpers for the lead generation popup that gates the catalog download (ENT-10928).
 */
import {
  LEAD_GEN_DISABLE_PARAM,
  LEAD_GEN_SUBMITTED_STORAGE_KEY,
  UTM_PARAM_KEYS,
} from '../constants';

/**
 * The campaign params on the current URL, and nothing else.
 *
 * Deliberately narrower than `window.location.search`: that also carries catalog
 * refinements (`enterprise_catalog_query_titles`, `availability`, `q`), and passing
 * those along would let stale filter state leak into places that reapply this string.
 */
export function getUtmParams(search = window.location.search) {
  const currentParams = new URLSearchParams(search);
  const utmParams = new URLSearchParams();
  UTM_PARAM_KEYS.forEach((key) => {
    currentParams.getAll(key).forEach((value) => {
      if (value) {
        utmParams.append(key, value);
      }
    });
  });
  return utmParams;
}

export function hasUtmParams(search = window.location.search) {
  return [...getUtmParams(search)].length > 0;
}

/**
 * Escape hatch for links that should reach the catalog without being gated.
 */
export function isLeadGenDisabled(search = window.location.search) {
  return new URLSearchParams(search).get(LEAD_GEN_DISABLE_PARAM) === 'true';
}

/**
 * sessionStorage can throw in private browsing modes and is absent in some test
 * environments, so both accessors degrade to "not submitted" rather than blowing up
 * the download path.
 */
export function hasSubmittedLeadGenForm() {
  try {
    return window.sessionStorage.getItem(LEAD_GEN_SUBMITTED_STORAGE_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

export function markLeadGenFormSubmitted() {
  try {
    window.sessionStorage.setItem(LEAD_GEN_SUBMITTED_STORAGE_KEY, 'true');
  } catch (e) {
    // Non-fatal: the visitor is simply re-prompted on their next download.
  }
}

/**
 * Whether this visitor has to complete the form before downloading.
 */
export function shouldGateDownload(search = window.location.search) {
  return hasUtmParams(search)
    && !isLeadGenDisabled(search)
    && !hasSubmittedLeadGenForm();
}

/**
 * Append the page's campaign params to the hosted form URL.
 *
 * The Pardot page populates its hidden UTM fields by reading its *own*
 * `location.search`, so without this the form submits blank attribution.
 */
export function buildLeadGenFormUrl(formUrl, search = window.location.search) {
  if (!formUrl) {
    return null;
  }
  const utmParams = getUtmParams(search);
  if (![...utmParams].length) {
    return formUrl;
  }
  const separator = formUrl.includes('?') ? '&' : '?';
  return `${formUrl}${separator}${utmParams.toString()}`;
}

/**
 * Origin of the hosted form, used to verify inbound postMessage events.
 * Returns null for an unparseable URL so the caller rejects every message.
 */
export function getLeadGenFormOrigin(formUrl) {
  try {
    return new URL(formUrl).origin;
  } catch (e) {
    return null;
  }
}
