import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MetricsCard from '../../sidepanel/components/MetricsCard';

describe('MetricsCard', () => {
  const mockCurrentMetrics = {
    link_count: 10,
    word_count: 500,
    image_count: 5,
  };

  const mockAggregatedMetrics = {
    total_visits: 42,
  };

  it('should render with current metrics only', () => {
    render(<MetricsCard currentMetrics={mockCurrentMetrics} aggregatedMetrics={null} />);
    
    expect(screen.getByText('Page Metrics')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should render with aggregated metrics', () => {
    render(<MetricsCard currentMetrics={mockCurrentMetrics} aggregatedMetrics={mockAggregatedMetrics} />);
    
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Total Visits')).toBeInTheDocument();
  });

  it('should not render when both metrics are null', () => {
    const { container } = render(<MetricsCard currentMetrics={null} aggregatedMetrics={null} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should render labels correctly', () => {
    render(<MetricsCard currentMetrics={mockCurrentMetrics} aggregatedMetrics={null} />);
    
    expect(screen.getByText('Links')).toBeInTheDocument();
    expect(screen.getByText('Words')).toBeInTheDocument();
    expect(screen.getByText('Images')).toBeInTheDocument();
  });

  it('should display 0 for current metrics when null', () => {
    render(<MetricsCard currentMetrics={null} aggregatedMetrics={mockAggregatedMetrics} />);
    
    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(3); // Links, Words, Images all show 0
  });

  it('should render with zero values in current metrics', () => {
    const zeroMetrics = {
      link_count: 0,
      word_count: 0,
      image_count: 0,
    };
    
    render(<MetricsCard currentMetrics={zeroMetrics} aggregatedMetrics={null} />);
    
    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(3);
  });

  it('should have correct CSS structure', () => {
    const { container } = render(<MetricsCard currentMetrics={mockCurrentMetrics} aggregatedMetrics={null} />);
    
    expect(container.querySelector('.metrics-card')).toBeInTheDocument();
    expect(container.querySelector('.metrics-grid')).toBeInTheDocument();
    expect(container.querySelectorAll('.metric')).toHaveLength(3);
  });

  it('should render 4 metrics when aggregated metrics present', () => {
    const { container } = render(<MetricsCard currentMetrics={mockCurrentMetrics} aggregatedMetrics={mockAggregatedMetrics} />);
    
    expect(container.querySelectorAll('.metric')).toHaveLength(4);
  });

  it('should render h2 heading', () => {
    render(<MetricsCard currentMetrics={mockCurrentMetrics} aggregatedMetrics={null} />);
    
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Page Metrics');
  });

  it('should not render Total Visits without aggregated metrics', () => {
    render(<MetricsCard currentMetrics={mockCurrentMetrics} aggregatedMetrics={null} />);
    
    expect(screen.queryByText('Total Visits')).not.toBeInTheDocument();
  });

  it('should handle large metric values', () => {
    const largeMetrics = {
      link_count: 9999,
      word_count: 100000,
      image_count: 5555,
    };
    
    render(<MetricsCard currentMetrics={largeMetrics} aggregatedMetrics={null} />);
    
    expect(screen.getByText('9999')).toBeInTheDocument();
    expect(screen.getByText('100000')).toBeInTheDocument();
    expect(screen.getByText('5555')).toBeInTheDocument();
  });

  it('should render aggregated metrics with zero visits', () => {
    render(<MetricsCard currentMetrics={mockCurrentMetrics} aggregatedMetrics={{ total_visits: 0 }} />);
    
    expect(screen.getByText('Total Visits')).toBeInTheDocument();
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(1);
  });
});

