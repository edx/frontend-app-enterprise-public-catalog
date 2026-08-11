import {
  LEAD_GEN_DISABLE_PARAM,
  LEAD_GEN_DISABLE_STORAGE_KEY,
  LEAD_GEN_GATE_UTM_SOURCE,
  LEAD_GEN_SUBMITTED_STORAGE_KEY,
  LEAD_GEN_UTM_STORAGE_KEY,
  UTM_PARAM_KEYS,
} from '../constants';

// sessionStorage may be unavailable; degrade to a no-op.
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
    // ignore
  }
}

// Falls back to the last-seen UTM params once the search library rewrites the url and drops them.
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

// Gates only utm_source=edxenterprise traffic; utm_medium/utm_campaign are optional.
export function isGatedCampaign(search = window.location.search) {
  return getUtmParams(search).get('utm_source') === LEAD_GEN_GATE_UTM_SOURCE;
}

// Mirrors the UTM persistence above: cache disable_lead_gen once seen, since the url can drop it too.
export function isLeadGenDisabled(search = window.location.search) {
  if (new URLSearchParams(search).get(LEAD_GEN_DISABLE_PARAM) === 'true') {
    try {
      window.sessionStorage.setItem(LEAD_GEN_DISABLE_STORAGE_KEY, 'true');
    } catch (e) {
      // ignore
    }
    return true;
  }
  try {
    return window.sessionStorage.getItem(LEAD_GEN_DISABLE_STORAGE_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

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
    // ignore
  }
}

export function shouldGateDownload(search = window.location.search) {
  return isGatedCampaign(search)
    && !isLeadGenDisabled(search)
    && !hasSubmittedLeadGenForm();
}

// Forwards UTM params so Pardot's hidden fields aren't submitted blank.
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
