import {
  LEAD_GEN_DISABLE_PARAM,
  LEAD_GEN_SUBMITTED_STORAGE_KEY,
  LEAD_GEN_UTM_STORAGE_KEY,
  UTM_PARAM_KEYS,
} from '../constants';

// sessionStorage can throw in private browsing and is absent in some test
// environments, so these degrade to a no-op rather than blowing up.
function getStoredUtmParams() {
  try {
    return window.sessionStorage.getItem(LEAD_GEN_UTM_STORAGE_KEY) || '';
  } catch (e) {
    return '';
  }
}

function storeUtmParams(search) {
  try {
    window.sessionStorage.setItem(LEAD_GEN_UTM_STORAGE_KEY, search);
  } catch (e) {
    // Non-fatal: falls back to whatever is currently in the URL.
  }
}

// Narrower than window.location.search: that also carries catalog refinements
// (enterprise_catalog_query_titles, availability, q) that must not leak through.
//
// Falls back to the first UTM params seen this session when the live URL has none:
// the search library rebuilds the URL from its own filter state (e.g. on "Clear
// all"), which drops any param it doesn't recognize, UTM keys included.
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
  if ([...utmParams].length) {
    storeUtmParams(utmParams.toString());
    return utmParams;
  }
  return new URLSearchParams(getStoredUtmParams());
}

export function hasUtmParams(search = window.location.search) {
  return [...getUtmParams(search)].length > 0;
}

export function isLeadGenDisabled(search = window.location.search) {
  return new URLSearchParams(search).get(LEAD_GEN_DISABLE_PARAM) === 'true';
}

// sessionStorage can throw in private browsing and is absent in some test
// environments, so this degrades to "not submitted" rather than blowing up.
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

export function shouldGateDownload(search = window.location.search) {
  return hasUtmParams(search)
    && !isLeadGenDisabled(search)
    && !hasSubmittedLeadGenForm();
}

// The Pardot page populates its hidden UTM fields from its own location.search,
// so without this the form submits blank attribution.
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

// Returns null for an unparseable URL so callers reject every postMessage.
export function getLeadGenFormOrigin(formUrl) {
  try {
    return new URL(formUrl).origin;
  } catch (e) {
    return null;
  }
}
