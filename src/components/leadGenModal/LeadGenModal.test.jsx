import React from 'react';
import { act, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import LeadGenModal from './LeadGenModal';
import { renderWithRouter } from '../tests/testUtils';

const FORM_URL = 'https://get.business.edx.org/l/1059723/2025-07-22/fr8j4b';
const FORM_ORIGIN = 'https://get.business.edx.org';

let mockFormUrl = FORM_URL;
jest.mock('@edx/frontend-platform', () => ({
  ...jest.requireActual('@edx/frontend-platform'),
  getConfig: () => ({ LEAD_GEN_FORM_URL: mockFormUrl }),
}));

const postFromOrigin = (origin, data) => {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { origin, data }));
  });
};

const defaultProps = { isOpen: true, onClose: jest.fn(), onSubmitted: jest.fn() };

describe('LeadGenModal', () => {
  beforeEach(() => {
    mockFormUrl = FORM_URL;
    jest.clearAllMocks();
    window.sessionStorage.clear();
    // The component reads window.location.search to forward campaign params.
    Object.defineProperty(window, 'location', {
      value: { search: '?utm_source=wordpress&utm_campaign=b2b&q=python' },
      writable: true,
    });
  });

  it('forwards only campaign params to the form iframe', () => {
    renderWithRouter(<LeadGenModal {...defaultProps} />);
    const iframe = screen.getByTitle('Catalog download request form');
    // Pardot reads its own location.search for the hidden UTM fields, so these must
    // be on the src -- but catalog refinements like `q` must not leak through.
    expect(iframe).toHaveAttribute(
      'src',
      `${FORM_URL}?utm_source=wordpress&utm_campaign=b2b`,
    );
  });

  it('resizes to the height the form reports', () => {
    renderWithRouter(<LeadGenModal {...defaultProps} />);
    expect(screen.getByTitle('Catalog download request form')).toHaveAttribute('height', '500');
    postFromOrigin(FORM_ORIGIN, { iframeHeight: 820 });
    expect(screen.getByTitle('Catalog download request form')).toHaveAttribute('height', '820');
  });

  it('unlocks the download when the form reports a submit', () => {
    const onSubmitted = jest.fn();
    renderWithRouter(<LeadGenModal {...defaultProps} onSubmitted={onSubmitted} />);
    postFromOrigin(FORM_ORIGIN, { pardotFormSubmitted: true });
    expect(onSubmitted).toHaveBeenCalledTimes(1);
  });

  it('ignores a submit message from any other origin', () => {
    const onSubmitted = jest.fn();
    renderWithRouter(<LeadGenModal {...defaultProps} onSubmitted={onSubmitted} />);
    postFromOrigin('https://evil.example.com', { pardotFormSubmitted: true });
    postFromOrigin('http://get.business.edx.org', { pardotFormSubmitted: true });
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it('ignores a truthy-but-not-true submit value', () => {
    const onSubmitted = jest.fn();
    renderWithRouter(<LeadGenModal {...defaultProps} onSubmitted={onSubmitted} />);
    postFromOrigin(FORM_ORIGIN, { pardotFormSubmitted: 'yes' });
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it('tolerates a message with no data', () => {
    renderWithRouter(<LeadGenModal {...defaultProps} />);
    expect(() => postFromOrigin(FORM_ORIGIN, null)).not.toThrow();
  });

  it('shows a fallback and no iframe when the form url is not configured', () => {
    mockFormUrl = null;
    renderWithRouter(<LeadGenModal {...defaultProps} />);
    expect(screen.queryByTitle('Catalog download request form')).not.toBeInTheDocument();
    expect(screen.getByText(/currently unavailable/i)).toBeInTheDocument();
  });

  it('cannot be unlocked when the form url is unparseable', () => {
    mockFormUrl = 'not-a-url';
    const onSubmitted = jest.fn();
    renderWithRouter(<LeadGenModal {...defaultProps} onSubmitted={onSubmitted} />);
    postFromOrigin(FORM_ORIGIN, { pardotFormSubmitted: true });
    expect(onSubmitted).not.toHaveBeenCalled();
  });
});
