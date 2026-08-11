import {
  buildLeadGenFormUrl,
  getLeadGenFormOrigin,
  getUtmParams,
  hasSubmittedLeadGenForm,
  hasUtmParams,
  isGatedCampaign,
  isLeadGenDisabled,
  markLeadGenFormSubmitted,
  shouldGateDownload,
} from './utmUtils';
import { LEAD_GEN_GATE_UTM_SOURCE } from '../constants';

const FORM_URL = 'https://get.business.edx.org/l/1059723/2025-07-22/fr8j4b';
const GATED_CAMPAIGN_SEARCH = `?utm_source=${LEAD_GEN_GATE_UTM_SOURCE}`;

describe('utmUtils', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  describe('getUtmParams', () => {
    it('keeps only campaign params', () => {
      const result = getUtmParams(
        '?utm_source=wordpress&utm_campaign=b2b&enterprise_catalog_query_titles=A+la+carte&q=python',
      );
      expect(result.toString()).toEqual('utm_source=wordpress&utm_campaign=b2b');
    });

    it('drops catalog refinements that would clobber filter state', () => {
      const result = getUtmParams('?availability=Available+Now&availability=Upcoming&q=data');
      expect(result.toString()).toEqual('');
    });

    it('ignores params present but empty', () => {
      expect(getUtmParams('?utm_source=&utm_medium=').toString()).toEqual('');
    });

    it('preserves repeated values', () => {
      expect(getUtmParams('?utm_term=a&utm_term=b').toString()).toEqual('utm_term=a&utm_term=b');
    });

    // Regression guard: "Clear all" filters rebuilds the url from the search
    // library's own state and drops any param it doesn't recognize, utm keys included.
    it('falls back to the last seen params once the url loses them', () => {
      getUtmParams('?utm_source=wordpress');
      expect(getUtmParams('?availability=Upcoming').toString()).toEqual('utm_source=wordpress');
    });

    it('prefers live params over stored ones when both are present', () => {
      getUtmParams('?utm_source=wordpress');
      expect(getUtmParams('?utm_source=email').toString()).toEqual('utm_source=email');
    });
  });

  describe('hasUtmParams', () => {
    it.each([
      ['?utm_source=wordpress', true],
      ['?utm_medium=email', true],
      ['?utm_term=x', true],
      ['', false],
      ['?q=python', false],
      ['?utm_source=', false],
    ])('returns %p -> %p', (search, expected) => {
      expect(hasUtmParams(search)).toBe(expected);
    });

    it('stays true for the rest of the session once utm params are seen', () => {
      expect(hasUtmParams('?utm_source=wordpress')).toBe(true);
      expect(hasUtmParams('')).toBe(true);
    });
  });

  describe('isLeadGenDisabled', () => {
    it('is true only for the explicit opt-out value', () => {
      expect(isLeadGenDisabled('?disable_lead_gen=false')).toBe(false);
      expect(isLeadGenDisabled('?disable_lead_gen=1')).toBe(false);
      expect(isLeadGenDisabled('')).toBe(false);
      expect(isLeadGenDisabled('?disable_lead_gen=true')).toBe(true);
    });

    it('stays true for the rest of the session once opted out', () => {
      expect(isLeadGenDisabled('?disable_lead_gen=true')).toBe(true);
      expect(isLeadGenDisabled('')).toBe(true);
    });
  });

  describe('isGatedCampaign', () => {
    it('matches on utm_source alone', () => {
      expect(isGatedCampaign(GATED_CAMPAIGN_SEARCH)).toBe(true);
    });

    it('ignores utm_medium and utm_campaign', () => {
      expect(isGatedCampaign(`${GATED_CAMPAIGN_SEARCH}&utm_medium=anything&utm_campaign=whatever`)).toBe(true);
    });

    it('rejects other campaign traffic entirely', () => {
      expect(isGatedCampaign('?utm_source=google&utm_medium=cpc&utm_campaign=brand')).toBe(false);
    });

    it('rejects a direct visit with no utm params', () => {
      expect(isGatedCampaign('?q=python')).toBe(false);
    });
  });

  describe('shouldGateDownload', () => {
    it('gates business.edx.org referral traffic', () => {
      expect(shouldGateDownload(GATED_CAMPAIGN_SEARCH)).toBe(true);
    });

    it('does not gate direct visits', () => {
      expect(shouldGateDownload('?q=python')).toBe(false);
    });

    it('does not gate traffic tagged with a different campaign', () => {
      expect(shouldGateDownload('?utm_source=google&utm_medium=cpc&utm_campaign=brand')).toBe(false);
    });

    it('does not gate when explicitly disabled', () => {
      expect(shouldGateDownload(`${GATED_CAMPAIGN_SEARCH}&disable_lead_gen=true`)).toBe(false);
    });

    it('does not re-gate a visitor who already submitted', () => {
      markLeadGenFormSubmitted();
      expect(hasSubmittedLeadGenForm()).toBe(true);
      expect(shouldGateDownload(GATED_CAMPAIGN_SEARCH)).toBe(false);
    });

    it('keeps gating after the url loses its utm params this session', () => {
      expect(shouldGateDownload(GATED_CAMPAIGN_SEARCH)).toBe(true);
      expect(shouldGateDownload('')).toBe(true);
    });
  });

  describe('hasSubmittedLeadGenForm', () => {
    it('degrades to false when sessionStorage throws', () => {
      const spy = jest.spyOn(window.Storage.prototype, 'getItem')
        .mockImplementation(() => { throw new Error('denied'); });
      expect(hasSubmittedLeadGenForm()).toBe(false);
      spy.mockRestore();
    });
  });

  describe('buildLeadGenFormUrl', () => {
    // Regression guard: the Pardot page fills its hidden UTM fields from its own
    // location.search, so a src without these params submits blank attribution.
    it('appends campaign params to the form url', () => {
      expect(buildLeadGenFormUrl(FORM_URL, '?utm_source=wordpress&utm_campaign=b2b'))
        .toEqual(`${FORM_URL}?utm_source=wordpress&utm_campaign=b2b`);
    });

    it('does not forward catalog refinements to the form', () => {
      expect(buildLeadGenFormUrl(FORM_URL, '?utm_source=wp&q=python&availability=Upcoming'))
        .toEqual(`${FORM_URL}?utm_source=wp`);
    });

    it('uses & when the form url already has a query string', () => {
      expect(buildLeadGenFormUrl(`${FORM_URL}?foo=bar`, '?utm_source=wp'))
        .toEqual(`${FORM_URL}?foo=bar&utm_source=wp`);
    });

    it('returns the url unchanged when there are no campaign params', () => {
      expect(buildLeadGenFormUrl(FORM_URL, '?q=python')).toEqual(FORM_URL);
    });

    it('returns null for a missing url', () => {
      expect(buildLeadGenFormUrl(null, '?utm_source=wp')).toBeNull();
    });

    it('keeps forwarding the first-seen utm params after the url loses them', () => {
      getUtmParams('?utm_source=wordpress');
      expect(buildLeadGenFormUrl(FORM_URL, '')).toEqual(`${FORM_URL}?utm_source=wordpress`);
    });
  });

  describe('getLeadGenFormOrigin', () => {
    it('extracts the origin', () => {
      expect(getLeadGenFormOrigin(FORM_URL)).toEqual('https://get.business.edx.org');
    });

    it('returns null for an unparseable url so every message is rejected', () => {
      expect(getLeadGenFormOrigin('not-a-url')).toBeNull();
      expect(getLeadGenFormOrigin(null)).toBeNull();
    });
  });
});
