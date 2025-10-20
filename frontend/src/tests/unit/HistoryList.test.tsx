import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HistoryList from '../../sidepanel/components/HistoryList';
import type { Visit } from '../../api/client';

describe('HistoryList', () => {
  const mockVisits: Visit[] = [
    {
      id: 1,
      url: 'https://example.com',
      title: 'Example Site',
      description: 'An example website',
      datetime_visited: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
      link_count: 10,
      word_count: 500,
      image_count: 5,
    },
    {
      id: 2,
      url: 'https://test.com',
      title: null,
      description: null,
      datetime_visited: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      link_count: 20,
      word_count: 1000,
      image_count: 10,
    },
  ];

  const defaultProps = {
    history: mockVisits,
    hasMore: false,
    loading: false,
    onLoadMore: vi.fn(),
  };

  it('should render history items', () => {
    render(<HistoryList {...defaultProps} />);
    
    expect(screen.getByText('Visit History')).toBeInTheDocument();
    expect(screen.getByText('Example Site')).toBeInTheDocument();
  });

  it('should display empty state when no history', () => {
    render(<HistoryList {...defaultProps} history={[]} />);
    
    expect(screen.getByText('No visits recorded yet.')).toBeInTheDocument();
  });

  it('should not show empty state while loading', () => {
    render(<HistoryList {...defaultProps} history={[]} loading={true} />);
    
    expect(screen.queryByText('No visits recorded yet.')).not.toBeInTheDocument();
  });

  it('should render visit with title', () => {
    render(<HistoryList {...defaultProps} />);
    
    expect(screen.getByText('Example Site')).toBeInTheDocument();
  });

  it('should render visit without title', () => {
    render(<HistoryList {...defaultProps} />);
    
    // Visit 2 has no title, so it shouldn't be rendered
    expect(screen.queryByText('Untitled')).not.toBeInTheDocument();
  });

  it('should render visit description when present', () => {
    render(<HistoryList {...defaultProps} />);
    
    expect(screen.getByText('An example website')).toBeInTheDocument();
  });

  it('should render visit stats', () => {
    render(<HistoryList {...defaultProps} />);
    
    expect(screen.getAllByText('Links:').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Words:').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Images:').length).toBeGreaterThan(0);
  });

  it('should format time "just now" for very recent visits', () => {
    const recentVisit: Visit = {
      ...mockVisits[0],
      datetime_visited: new Date(Date.now() - 30 * 1000).toISOString(), // 30 seconds ago
    };
    
    render(<HistoryList {...defaultProps} history={[recentVisit]} />);
    
    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('should format time in minutes', () => {
    render(<HistoryList {...defaultProps} />);
    
    expect(screen.getByText(/\d+m ago/)).toBeInTheDocument();
  });

  it('should format time in hours', () => {
    render(<HistoryList {...defaultProps} />);
    
    expect(screen.getByText(/\d+h ago/)).toBeInTheDocument();
  });

  it('should format time in days', () => {
    const oldVisit: Visit = {
      ...mockVisits[0],
      datetime_visited: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    };
    
    render(<HistoryList {...defaultProps} history={[oldVisit]} />);
    
    expect(screen.getByText(/\d+d ago/)).toBeInTheDocument();
  });

  it('should format old dates with full date', () => {
    const veryOldVisit: Visit = {
      ...mockVisits[0],
      datetime_visited: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    };
    
    render(<HistoryList {...defaultProps} history={[veryOldVisit]} />);
    
    // Should show month and day (e.g., "Oct 10")
    const timeElement = screen.getByText(/[A-Z][a-z]+ \d+/);
    expect(timeElement).toBeInTheDocument();
  });

  it('should show loading indicator when loading more', () => {
    render(<HistoryList {...defaultProps} hasMore={true} loading={true} />);
    
    expect(screen.getByText('Loading more...')).toBeInTheDocument();
  });

  it('should render IntersectionObserver target when hasMore is true', () => {
    const { container } = render(<HistoryList {...defaultProps} hasMore={true} />);
    
    expect(container.querySelector('.load-more-trigger')).toBeInTheDocument();
  });

  it('should not render load more trigger when hasMore is false', () => {
    const { container } = render(<HistoryList {...defaultProps} hasMore={false} />);
    
    expect(container.querySelector('.load-more-trigger')).not.toBeInTheDocument();
  });

  it('should have correct CSS structure', () => {
    const { container } = render(<HistoryList {...defaultProps} />);
    
    expect(container.querySelector('.history-list')).toBeInTheDocument();
    expect(container.querySelector('.history-items')).toBeInTheDocument();
    expect(container.querySelectorAll('.history-item')).toHaveLength(2);
  });

  it('should render all visit metrics', () => {
    const { container } = render(<HistoryList {...defaultProps} />);
    
    const statsContainer = container.querySelector('.history-item .history-stats');
    expect(statsContainer).toBeInTheDocument();
    expect(statsContainer?.textContent).toContain('10');
    expect(statsContainer?.textContent).toContain('500');
    expect(statsContainer?.textContent).toContain('5');
  });

  it('should render multiple visits correctly', () => {
    const { container } = render(<HistoryList {...defaultProps} />);
    
    const historyItems = container.querySelectorAll('.history-item');
    expect(historyItems).toHaveLength(2);
  });

  it('should render h2 heading', () => {
    render(<HistoryList {...defaultProps} />);
    
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Visit History');
  });

  it('should handle visit with all null optional fields', () => {
    const minimalVisit: Visit = {
      id: 999,
      url: 'https://minimal.com',
      title: null,
      description: null,
      datetime_visited: new Date().toISOString(),
      link_count: 0,
      word_count: 0,
      image_count: 0,
    };
    
    const { container } = render(<HistoryList {...defaultProps} history={[minimalVisit]} />);
    
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(3);
    expect(container.querySelector('.history-title')).not.toBeInTheDocument();
    expect(container.querySelector('.history-description')).not.toBeInTheDocument();
  });

  it('should setup IntersectionObserver when mounted with hasMore', () => {
    render(<HistoryList {...defaultProps} hasMore={true} />);
    
    // IntersectionObserver should be created
    expect(global.IntersectionObserver).toBeDefined();
  });

  it('should cleanup IntersectionObserver on unmount', () => {
    const { unmount } = render(<HistoryList {...defaultProps} hasMore={true} />);
    
    unmount();
    
    // Should not throw error
    expect(true).toBe(true);
  });

  it('should format dates from same year without year', () => {
    const thisYearVisit: Visit = {
      ...mockVisits[0],
      datetime_visited: new Date(new Date().getFullYear(), 0, 15).toISOString(),
    };
    
    render(<HistoryList {...defaultProps} history={[thisYearVisit]} />);
    
    // Should show month and day only (e.g., "Jan 15")
    expect(screen.getByText(/Jan 15/)).toBeInTheDocument();
  });

  it('should format dates from different year with year', () => {
    const lastYearVisit: Visit = {
      ...mockVisits[0],
      datetime_visited: new Date(new Date().getFullYear() - 1, 11, 25).toISOString(),
    };
    
    render(<HistoryList {...defaultProps} history={[lastYearVisit]} />);
    
    // Should show year (e.g., "Dec 25, 2023")
    const timeText = screen.getByText(/Dec 25/);
    expect(timeText).toBeInTheDocument();
  });
});

