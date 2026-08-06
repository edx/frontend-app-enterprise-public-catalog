import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { IntlProvider } from '@edx/frontend-platform/i18n';

import CatalogCourseModalBanner from './CatalogCourseModalBanner';
import { formatSessionDate } from '../../utils/catalogUtils';

const renderBanner = (props) => render(
  <IntlProvider locale="en">
    <CatalogCourseModalBanner coursePrice="$399.00" {...props} />
  </IntlProvider>,
);

describe('<CatalogCourseModalBanner />', () => {
  test('renders both start and end dates together when both are known', () => {
    renderBanner({
      startDate: '2026-08-16T00:00:00Z',
      endDate: '2026-10-14T00:00:00Z',
    });
    expect(
      screen.getByText(`Session starts ${formatSessionDate(new Date('2026-08-16T00:00:00Z'))} | Session ends ${formatSessionDate(new Date('2026-10-14T00:00:00Z'))}`),
    ).toBeInTheDocument();
  });

  test('appends the upcoming session count when both dates are known', () => {
    renderBanner({
      startDate: '2026-08-16T00:00:00Z',
      endDate: '2026-10-14T00:00:00Z',
      upcomingRuns: 2,
    });
    expect(
      screen.getByText(`Session starts ${formatSessionDate(new Date('2026-08-16T00:00:00Z'))} | Session ends ${formatSessionDate(new Date('2026-10-14T00:00:00Z'))} • 2 additional session(s)`),
    ).toBeInTheDocument();
  });

  test('falls back to only the end date when the course has already started', () => {
    renderBanner({ endDate: '2080-01-01T00:00:00Z' });
    expect(
      screen.getByText(new RegExp(`^Session ends ${formatSessionDate(new Date('2080-01-01T00:00:00Z'))}$`)),
    ).toBeInTheDocument();
  });

  test('falls back to only the start date when the end date is unknown', () => {
    const futureStart = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    renderBanner({ startDate: futureStart });
    expect(screen.getByText(/^Session starts /)).toBeInTheDocument();
  });

  test('renders no session date text when no dates are known', () => {
    renderBanner({});
    expect(screen.queryByText(/Session (starts|ends)/)).not.toBeInTheDocument();
  });
});
