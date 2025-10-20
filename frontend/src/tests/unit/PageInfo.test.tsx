import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageInfo from '../../sidepanel/components/PageInfo';

describe('PageInfo', () => {
  const defaultProps = {
    title: 'Example Page Title',
    description: 'This is an example page description',
    url: 'https://example.com',
  };

  it('should render page title', () => {
    render(<PageInfo {...defaultProps} />);
    
    expect(screen.getByText('Example Page Title')).toBeInTheDocument();
  });

  it('should render page description when provided', () => {
    render(<PageInfo {...defaultProps} />);
    
    expect(screen.getByText('This is an example page description')).toBeInTheDocument();
  });

  it('should render page URL', () => {
    render(<PageInfo {...defaultProps} />);
    
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });

  it('should display "Untitled Page" when title is null', () => {
    render(<PageInfo {...defaultProps} title={null} />);
    
    expect(screen.getByText('Untitled Page')).toBeInTheDocument();
  });

  it('should not render description when it is null', () => {
    render(<PageInfo {...defaultProps} description={null} />);
    
    expect(screen.queryByText('This is an example page description')).not.toBeInTheDocument();
  });

  it('should have correct CSS classes', () => {
    const { container } = render(<PageInfo {...defaultProps} />);
    
    expect(container.querySelector('.page-info')).toBeInTheDocument();
    expect(container.querySelector('.page-title')).toBeInTheDocument();
    expect(container.querySelector('.page-description')).toBeInTheDocument();
    expect(container.querySelector('.page-url')).toBeInTheDocument();
  });

  it('should render with null title and null description', () => {
    const { container } = render(<PageInfo title={null} description={null} url="https://test.com" />);
    
    expect(screen.getByText('Untitled Page')).toBeInTheDocument();
    expect(screen.getByText('https://test.com')).toBeInTheDocument();
    expect(container.querySelector('.page-description')).not.toBeInTheDocument();
  });

  it('should render h2 for title', () => {
    render(<PageInfo {...defaultProps} />);
    
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Example Page Title');
  });

  it('should handle long URLs', () => {
    const longUrl = 'https://example.com/very/long/path/that/goes/on/and/on/with/many/segments';
    render(<PageInfo {...defaultProps} url={longUrl} />);
    
    expect(screen.getByText(longUrl)).toBeInTheDocument();
  });

  it('should handle empty title string', () => {
    render(<PageInfo {...defaultProps} title="" />);
    
    expect(screen.getByText('Untitled Page')).toBeInTheDocument();
  });
});

