import React from 'react';
import { act, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { saveAs } from 'file-saver';

import userEvent from '@testing-library/user-event';
import DownloadCsvButton from './DownloadCsvButton';
import { renderWithRouter } from '../../../tests/testUtils';
import EnterpriseCatalogApiService from '../../../../data/services/EnterpriseCatalogAPIService';

// file-saver mocks
jest.mock('file-saver', () => ({
  ...jest.requireActual('file-saver'),
  saveAs: jest.fn(),
}));
// eslint-disable-next-line func-names
global.Blob = function (content, options) {
  return { content, options };
};

const mockDate = new Date('2024-01-06T12:00:00Z');
const mockTimestamp = mockDate.toISOString();
global.Date = jest.fn(() => mockDate);

const mockCatalogApiService = jest.spyOn(
  EnterpriseCatalogApiService,
  'generateCsvDownloadLink',
);

const facets = {
  skill_names: ['Research'],
  partners_names: ['Australian National University'],
  enterprise_catalog_query_titles: ['foo'],
  availability: ['Available Now', 'Upcoming'],
};
const defaultProps = { facets, query: 'foo' };

const smallFacets = {
  availability: ['Available Now', 'Upcoming'],
};
const badQueryProps = { facets: smallFacets, query: 'math & science' };

const assignMock = jest.fn();
delete global.location;
global.location = { href: assignMock };

let mockSoftGate = true;
jest.mock('@edx/frontend-platform', () => ({
  ...jest.requireActual('@edx/frontend-platform'),
  getConfig: () => ({
    LEAD_GEN_FORM_URL: 'https://get.business.edx.org/l/1059723/2025-07-22/fr8j4b',
    FEATURE_LEAD_GEN_SOFT_GATE: mockSoftGate,
  }),
}));

describe('Download button', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('button renders and is clickable', async () => {
    // Render the component
    renderWithRouter(<DownloadCsvButton {...defaultProps} />);
    // Expect to be in the default state
    expect(screen.queryByText('Download results')).toBeInTheDocument();

    // Click the button
    const input = screen.getByText('Download results');
    const user = userEvent.setup();
    await user.click(input);
    expect(mockCatalogApiService).toHaveBeenCalledWith(facets, 'foo');
  });
  test('download button url encodes queries', async () => {
    process.env.CATALOG_SERVICE_BASE_URL = 'foobar.com';
    const mockResponse = {
      data: 'mock-excel-data',
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    };
    mockCatalogApiService.mockResolvedValue(mockResponse);
    // Render the component
    renderWithRouter(<DownloadCsvButton {...badQueryProps} />);
    // Expect to be in the default state
    expect(screen.queryByText('Download results')).toBeInTheDocument();

    // Click the button
    const input = screen.getByText('Download results');
    const user = userEvent.setup();
    await user.click(input);
    expect(mockCatalogApiService).toHaveBeenCalledTimes(1);
    expect(mockCatalogApiService).toHaveBeenCalledWith(smallFacets, 'math & science');

    expect(saveAs).toHaveBeenCalledWith(
      expect.objectContaining({
        content: ['mock-excel-data'],
        options: {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      }),
      `Enterprise-Catalog-Export-${mockTimestamp}.xlsx`,
    );
  });

  // ENT-10928: campaign traffic sees a lead capture form before the download.
  describe('lead generation gate', () => {
    const clickDownload = async () => {
      const user = userEvent.setup();
      await user.click(screen.getByText('Download results'));
    };

    beforeEach(() => {
      mockSoftGate = true;
      window.sessionStorage.clear();
      global.location.search = '';
    });

    test('downloads directly when there are no campaign params', async () => {
      renderWithRouter(<DownloadCsvButton {...defaultProps} />);
      await clickDownload();
      expect(screen.queryByTitle('Catalog download request form')).not.toBeInTheDocument();
      expect(mockCatalogApiService).toHaveBeenCalledTimes(1);
    });

    test('shows the form instead of downloading for campaign traffic', async () => {
      global.location.search = '?utm_source=wordpress&utm_campaign=b2b';
      renderWithRouter(<DownloadCsvButton {...defaultProps} />);
      await clickDownload();
      expect(screen.getByTitle('Catalog download request form')).toBeInTheDocument();
      expect(mockCatalogApiService).not.toHaveBeenCalled();
    });

    test('honours the disable param on the incoming link', async () => {
      global.location.search = '?utm_source=wordpress&disable_lead_gen=true';
      renderWithRouter(<DownloadCsvButton {...defaultProps} />);
      await clickDownload();
      expect(screen.queryByTitle('Catalog download request form')).not.toBeInTheDocument();
      expect(mockCatalogApiService).toHaveBeenCalledTimes(1);
    });

    test('downloads once the form reports a submit', async () => {
      global.location.search = '?utm_source=wordpress';
      renderWithRouter(<DownloadCsvButton {...defaultProps} />);
      await clickDownload();
      expect(mockCatalogApiService).not.toHaveBeenCalled();

      act(() => {
        window.dispatchEvent(new MessageEvent('message', {
          origin: 'https://get.business.edx.org',
          data: { pardotFormSubmitted: true },
        }));
      });
      expect(mockCatalogApiService).toHaveBeenCalledTimes(1);
    });

    test('stays gated when a submit message comes from another origin', async () => {
      global.location.search = '?utm_source=wordpress';
      renderWithRouter(<DownloadCsvButton {...defaultProps} />);
      await clickDownload();

      act(() => {
        window.dispatchEvent(new MessageEvent('message', {
          origin: 'https://evil.example.com',
          data: { pardotFormSubmitted: true },
        }));
      });
      expect(mockCatalogApiService).not.toHaveBeenCalled();
    });

    test('does not re-gate a second download in the same session', async () => {
      global.location.search = '?utm_source=wordpress';
      const { unmount } = renderWithRouter(<DownloadCsvButton {...defaultProps} />);
      await clickDownload();
      act(() => {
        window.dispatchEvent(new MessageEvent('message', {
          origin: 'https://get.business.edx.org',
          data: { pardotFormSubmitted: true },
        }));
      });
      expect(mockCatalogApiService).toHaveBeenCalledTimes(1);
      unmount();

      renderWithRouter(<DownloadCsvButton {...defaultProps} />);
      await clickDownload();
      expect(screen.queryByTitle('Catalog download request form')).not.toBeInTheDocument();
      expect(mockCatalogApiService).toHaveBeenCalledTimes(2);
    });

    test('soft gate lets a dismissed form through', async () => {
      global.location.search = '?utm_source=wordpress';
      renderWithRouter(<DownloadCsvButton {...defaultProps} />);
      await clickDownload();
      expect(mockCatalogApiService).not.toHaveBeenCalled();

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /close/i }));
      expect(mockCatalogApiService).toHaveBeenCalledTimes(1);
    });

    test('hard gate holds a dismissed form', async () => {
      mockSoftGate = false;
      global.location.search = '?utm_source=wordpress';
      renderWithRouter(<DownloadCsvButton {...defaultProps} />);
      await clickDownload();

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /close/i }));
      expect(mockCatalogApiService).not.toHaveBeenCalled();
    });
  });
});
