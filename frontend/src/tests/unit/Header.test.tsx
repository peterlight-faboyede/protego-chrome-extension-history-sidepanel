import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '../../sidepanel/components/Header';

describe('Header', () => {
  it('should render the header title', () => {
    render(<Header />);
    
    expect(screen.getByText('History Sidepanel')).toBeInTheDocument();
  });

  it('should render the subtitle', () => {
    render(<Header />);
    
    expect(screen.getByText('Page Analytics & Visit History')).toBeInTheDocument();
  });

  it('should have correct HTML structure', () => {
    const { container } = render(<Header />);
    
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('header');
  });

  it('should render h1 element', () => {
    render(<Header />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('History Sidepanel');
  });

  it('should render subtitle with correct class', () => {
    const { container } = render(<Header />);
    
    const subtitle = container.querySelector('.subtitle');
    expect(subtitle).toBeInTheDocument();
    expect(subtitle).toHaveTextContent('Page Analytics & Visit History');
  });
});

